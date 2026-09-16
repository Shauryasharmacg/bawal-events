import { Router, Request, Response } from 'express';
import { getDbClient, withTransaction } from '../db.js';
import {
  createPayUPaymentRequest,
  verifyPayUResponseHash,
  generatePayURequestHash,
  verifyPayUTransactionServerSide,
} from '../payu.js';
import { sendTicketConfirmationEmail } from '../notification.js';
import { verifyToken } from '../auth.js';
import QRCode from 'qrcode';
import crypto from 'node:crypto';

export const registrationsRouter = Router();

// Helper to generate unique registration code: e.g. BW00101
async function generateUniqueRegistrationId(eventId: string): Promise<string> {
  const db = await getDbClient();
  const countRes = await db.query(`SELECT COUNT(*) as count FROM registrations WHERE event_id = $1`, [eventId]);
  const currentCount = parseInt(countRes.rows[0]?.count || '0', 10);
  const nextNum = 101 + currentCount;
  const candidate = `BW00${nextNum}`;

  // Ensure collision safety
  const check = await db.query(`SELECT id FROM registrations WHERE registration_id = $1`, [candidate]);
  if (check.rows.length === 0) {
    return candidate;
  }
  return `BW${crypto.randomInt(10000, 99999)}`;
}

// Reusable atomic confirmation & ticket generation service
export async function confirmRegistrationAndIssueTicket(
  registrationDbId: string,
  payuDetails: {
    mihpayid: string;
    txnid: string;
    mode?: string;
    hash?: string;
    bank_ref_num?: string;
    raw_response?: any;
  }
): Promise<{ ticket: any; alreadyConfirmed: boolean }> {
  const result = await withTransaction(async (tx) => {
    // Lock and fetch registration
    const regRes = await tx.query(
      `SELECT r.*, e.title as event_title, e.event_number, e.date_str, e.start_time, e.venue, e.total_capacity,
              tt.name as ticket_type_name, tt.price
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       JOIN ticket_types tt ON r.ticket_type_id = tt.id
       WHERE r.id = $1`,
      [registrationDbId]
    );

    if (regRes.rows.length === 0) {
      throw new Error('Registration record not found.');
    }

    const reg = regRes.rows[0];

    // If already confirmed, return existing ticket (idempotent duplicate prevention)
    if (reg.status === 'CONFIRMED') {
      const existingTicket = await tx.query(`SELECT * FROM tickets WHERE registration_id = $1`, [reg.id]);
      if (existingTicket.rows.length > 0) {
        return { ticket: existingTicket.rows[0], alreadyConfirmed: true };
      }
    }

    // Check capacity once more under transaction lock
    const countCheck = await tx.query(
      `SELECT COUNT(*) as count FROM registrations WHERE event_id = $1 AND status = 'CONFIRMED'`,
      [reg.event_id]
    );
    const confirmedTotal = parseInt(countCheck.rows[0]?.count || '0', 10);
    if (confirmedTotal >= reg.total_capacity) {
      throw new Error('Event capacity of 100 reached before payment completion.');
    }

    // 1. Update Payment record with PayU details
    await tx.query(
      `UPDATE payments 
       SET status = 'SUCCESS',
           payu_mihpayid = $1,
           payu_txnid = $2,
           payu_mode = $3,
           payment_method = $3,
           payu_hash = $4,
           bank_ref_num = $5,
           raw_response = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE registration_id = $7`,
      [
        payuDetails.mihpayid,
        payuDetails.txnid,
        payuDetails.mode || 'PayU / UPI',
        payuDetails.hash || null,
        payuDetails.bank_ref_num || null,
        JSON.stringify(payuDetails.raw_response || {}),
        reg.id,
      ]
    );

    // 2. Mark Registration as CONFIRMED
    await tx.query(
      `UPDATE registrations SET status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [reg.id]
    );

    // 3. Update sold count on ticket tier
    await tx.query(
      `UPDATE ticket_types SET sold_count = sold_count + 1 WHERE id = $1`,
      [reg.ticket_type_id]
    );

    // 4. Generate Unique Ticket ID & QR Code
    const ticketDbId = `tk_${crypto.randomBytes(8).toString('hex')}`;
    const qrToken = `bawal_${crypto.randomBytes(12).toString('hex')}`;

    const appUrl = process.env.APP_URL || 'https://bawal.social';
    const verificationUrl = `${appUrl}/verify/${ticketDbId}`;

    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    await tx.query(
      `INSERT INTO tickets (id, ticket_id, registration_id, event_id, user_id, status, qr_token, qr_data_url)
       VALUES ($1, $2, $3, $4, $5, 'CONFIRMED', $6, $7)`,
      [ticketDbId, ticketDbId, reg.id, reg.event_id, reg.user_id, qrToken, qrDataUrl]
    );

    const ticketObj = {
      id: ticketDbId,
      ticketId: ticketDbId,
      registrationId: reg.id,
      registrationCode: reg.registration_id,
      eventId: reg.event_id,
      eventTitle: reg.event_title,
      eventNumber: reg.event_number,
      eventDate: reg.date_str,
      eventTime: reg.start_time,
      eventVenue: reg.venue,
      attendeeName: reg.attendee_name,
      attendeeEmail: reg.attendee_email,
      attendeePhone: reg.attendee_phone,
      ticketTypeName: reg.ticket_type_name,
      price: parseFloat(reg.price),
      status: 'CONFIRMED',
      qrToken,
      qrDataUrl,
      verificationUrl,
    };

    return { ticket: ticketObj, alreadyConfirmed: false };
  });

  // Dispatch confirmation email asynchronously (do not block)
  if (!result.alreadyConfirmed && result.ticket) {
    sendTicketConfirmationEmail({
      attendeeName: result.ticket.attendeeName,
      attendeeEmail: result.ticket.attendeeEmail,
      eventTitle: result.ticket.eventTitle,
      eventNumber: result.ticket.eventNumber,
      registrationCode: result.ticket.registrationCode,
      eventDate: result.ticket.eventDate,
      eventTime: result.ticket.eventTime,
      eventVenue: result.ticket.eventVenue,
      ticketUrl: `${process.env.APP_URL || ''}/ticket/${result.ticket.ticketId}`,
    }).catch((e) => console.error('[EMAIL] Ticket confirmation email dispatch error:', e));
  }

  return result;
}

// 1. Initiate Registration & PayU Payment Request
registrationsRouter.post('/create', async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      ticketTypeId,
      attendeeName,
      attendeeEmail,
      attendeePhone,
      attendeeAge,
      attendeeGender,
      attendeeInstagram,
      customAnswers,
    } = req.body;

    if (!eventId || !ticketTypeId || !attendeeName || !attendeeEmail) {
      return res.status(400).json({ error: 'Please fill in all required registration fields.' });
    }

    // PayU strictly requires a mandatory phone parameter in the payment POST form.
    // If the user only provided an email, pass a valid fallback phone number (e.g. 9876543210 or the attendee's phone).
    const rawDigits = (attendeePhone || '').toString().replace(/[^0-9]/g, '');
    const cleanPhone = rawDigits.length >= 10 ? rawDigits.slice(-10) : '9876543210';
    const cleanName = attendeeName.trim();
    const cleanEmail = attendeeEmail.toLowerCase().trim();

    const db = await getDbClient();

    // Check Event & Total Capacity Constraint
    const eventRes = await db.query(`SELECT * FROM events WHERE id = $1 AND is_active = true`, [eventId]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or inactive.' });
    }
    const event = eventRes.rows[0];

    const confirmedCountRes = await db.query(
      `SELECT COUNT(*) as count FROM registrations WHERE event_id = $1 AND status = 'CONFIRMED'`,
      [eventId]
    );
    const confirmedCount = parseInt(confirmedCountRes.rows[0]?.count || '0', 10);
    if (confirmedCount >= event.total_capacity) {
      return res.status(400).json({ error: 'This event is completely SOLD OUT! Total capacity of 100 reached.' });
    }

    // Check Ticket Tier & Price from Database
    const ttRes = await db.query(`SELECT * FROM ticket_types WHERE id = $1 AND event_id = $2`, [ticketTypeId, eventId]);
    if (ttRes.rows.length === 0) {
      return res.status(400).json({ error: 'Selected ticket pass type does not exist.' });
    }
    let ticketType = ttRes.rows[0];

    // Check ticket inventory
    const ttSoldCountRes = await db.query(
      `SELECT COUNT(*) as count FROM registrations WHERE ticket_type_id = $1 AND status = 'CONFIRMED'`,
      [ticketType.id]
    );
    const ttSoldCount = parseInt(ttSoldCountRes.rows[0]?.count || '0', 10);

    // If Early Bird pass is requested but already 20 sold, automatically switch or reject
    if (ticketType.name.toLowerCase().includes('early bird') && ttSoldCount >= ticketType.total_available) {
      const regPassRes = await db.query(
        `SELECT * FROM ticket_types WHERE event_id = $1 AND LOWER(name) LIKE '%regular%' LIMIT 1`,
        [eventId]
      );
      if (regPassRes.rows.length > 0) {
        ticketType = regPassRes.rows[0];
      } else {
        return res.status(400).json({ error: 'Early Bird passes are completely SOLD OUT.' });
      }
    }

    const amount = parseFloat(ticketType.price);
    const registrationIdCode = await generateUniqueRegistrationId(eventId);
    const regDbId = `reg_${crypto.randomBytes(8).toString('hex')}`;

    // Get or create user
    let userId: string;
    const userRes = await db.query(`SELECT id FROM users WHERE LOWER(email) = $1 OR mobile = $2`, [
      cleanEmail,
      cleanPhone,
    ]);
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
    } else {
      userId = crypto.randomUUID();
      await db.query(
        `INSERT INTO users (id, email, mobile, name, age, gender, instagram, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'USER')`,
        [
          userId,
          cleanEmail,
          cleanPhone,
          cleanName,
          attendeeAge ? parseInt(attendeeAge, 10) : null,
          attendeeGender || null,
          attendeeInstagram ? attendeeInstagram.replace(/^@/, '').trim() : null,
        ]
      );
    }

    // Insert PENDING Registration
    await db.query(
      `INSERT INTO registrations (
        id, registration_id, user_id, event_id, ticket_type_id, status,
        attendee_name, attendee_email, attendee_phone, attendee_age,
        attendee_gender, attendee_instagram, custom_answers, amount
      ) VALUES (
        $1, $2, $3, $4, $5, 'PENDING',
        $6, $7, $8, $9,
        $10, $11, $12, $13
      )`,
      [
        regDbId,
        registrationIdCode,
        userId,
        eventId,
        ticketType.id,
        cleanName,
        cleanEmail,
        cleanPhone,
        attendeeAge ? parseInt(attendeeAge, 10) : null,
        attendeeGender || null,
        attendeeInstagram ? attendeeInstagram.replace(/^@/, '').trim() : null,
        JSON.stringify(customAnswers || {}),
        amount,
      ]
    );

    // Generate unique PayU Transaction ID (alphanumeric up to 25 chars)
    const txnid = `BW${Date.now()}${crypto.randomBytes(4).toString('hex')}`.slice(0, 25);

    // Record payment order entry in database with PayU fields
    const paymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;
    await db.query(
      `INSERT INTO payments (id, registration_id, amount, currency, status, payu_txnid)
       VALUES ($1, $2, $3, 'INR', 'PENDING', $4)`,
      [paymentId, regDbId, amount, txnid]
    );

    // Compute Base App URL for PayU callback redirects (strictly absolute URL)
    const host = req.get('host') || 'localhost:3000';
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const origin = req.headers.origin || `${proto}://${host}`;
    const appBaseUrl = (process.env.APP_URL && !process.env.APP_URL.includes('MY_APP_URL'))
      ? process.env.APP_URL.replace(/\/$/, '')
      : origin;

    const surl = `${appBaseUrl}/api/registrations/payu-callback`;
    const furl = `${appBaseUrl}/api/registrations/payu-callback`;

    // Create PayU Hosted Payment payload with SHA-512 Hash
    const payuPayload = createPayUPaymentRequest({
      txnid,
      amount,
      productinfo: `${event.title} - ${ticketType.name}`,
      firstname: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      surl,
      furl,
      udf1: regDbId,
      udf2: registrationIdCode,
      udf3: eventId,
    });

    console.log('\n================ [PAYU REGISTRATION CHECKOUT INITIATED] ================');
    console.log('Action URL:', payuPayload.actionUrl);
    console.log('Exact Form Submission Object to PayU:');
    console.log(JSON.stringify(payuPayload.params, null, 2));
    console.log('========================================================================\n');

    res.json({
      success: true,
      registrationDbId: regDbId,
      registrationCode: registrationIdCode,
      amount,
      ticketTypeName: ticketType.name,
      txnid,
      actionUrl: payuPayload.actionUrl,
      payuParams: payuPayload.params,
      isTestMode: payuPayload.isTestMode,
    });
  } catch (err: any) {
    console.error('[REGISTRATION] Error initiating registration:', err);
    res.status(500).json({ error: err.message || 'Failed to initiate registration' });
  }
});

// 2. PayU Hosted Payment Gateway Callback (surl and furl)
// Handles PayU payment response (POST application/x-www-form-urlencoded or GET redirect)
const handlePayUCallback = async (req: Request, res: Response) => {
  try {
    const postData = Object.assign({}, req.query, req.body);
    const {
      status,
      txnid,
      amount,
      mihpayid,
      mode,
      bank_ref_num,
      error_Message,
      error: payuError,
      udf1: registrationDbId,
      udf2: registrationCode,
    } = postData;

    console.log(`[PAYU] Received callback for txnid: ${txnid}, status: ${status}, amount: ${amount}`);

    // Determine target frontend host for redirects
    const origin = req.headers.origin || (req.protocol + '://' + req.get('host'));
    const appBaseUrl = (process.env.APP_URL && !process.env.APP_URL.includes('MY_APP_URL'))
      ? process.env.APP_URL.replace(/\/$/, '')
      : origin;

    // A. Server-Side Security Verification: Validate PayU Reverse Hash
    const isHashValid = verifyPayUResponseHash(postData);
    if (!isHashValid) {
      console.error('[PAYU SECURITY] Reverse Hash validation failed for txnid:', txnid);
      // Mark as failed in DB
      const db = await getDbClient();
      await db.query(
        `UPDATE payments SET status = 'FAILED', error_description = 'Security Check Failed: Invalid PayU Reverse Hash' WHERE payu_txnid = $1`,
        [txnid]
      );
      return res.redirect(`${appBaseUrl}/experiences?payment_status=failed&error=Security+Hash+Mismatch`);
    }

    const db = await getDbClient();

    // B. Lookup registration by ID or txnid
    let regId = registrationDbId;
    if (!regId && txnid) {
      const pRes = await db.query(`SELECT registration_id FROM payments WHERE payu_txnid = $1`, [txnid]);
      if (pRes.rows.length > 0) {
        regId = pRes.rows[0].registration_id;
      }
    }

    if (!regId) {
      console.error('[PAYU] Could not locate registration for txnid:', txnid);
      return res.redirect(`${appBaseUrl}/experiences?payment_status=failed&error=Registration+Not+Found`);
    }

    // C. Handle Successful Payment
    if (status && status.toLowerCase() === 'success') {
      // Validate payment amount against registration expected amount
      const regCheck = await db.query(`SELECT amount FROM registrations WHERE id = $1`, [regId]);
      if (regCheck.rows.length === 0) {
        return res.redirect(`${appBaseUrl}/experiences?payment_status=failed&error=Registration+Not+Found`);
      }

      const expectedAmount = parseFloat(regCheck.rows[0].amount);
      const paidAmount = parseFloat(amount);
      if (Math.abs(expectedAmount - paidAmount) > 0.01) {
        console.error(`[PAYU] Amount mismatch! Expected: ${expectedAmount}, Received: ${paidAmount}`);
        await db.query(
          `UPDATE payments SET status = 'FAILED', error_description = 'Amount mismatch validation failed' WHERE registration_id = $1`,
          [regId]
        );
        return res.redirect(`${appBaseUrl}/experiences?payment_status=failed&error=Amount+Mismatch`);
      }

      // Atomic confirmation, ticket issuance, and inventory decrement
      const { ticket } = await confirmRegistrationAndIssueTicket(regId, {
        mihpayid: mihpayid || txnid,
        txnid,
        mode: mode || 'PayU',
        hash: postData.hash,
        bank_ref_num: bank_ref_num || null,
        raw_response: postData,
      });

      console.log(`[PAYU] Payment confirmed! Ticket issued: ${ticket.id} (${ticket.registrationCode})`);

      // Seamlessly redirect attendee to their confirmed digital ticket pass
      return res.redirect(`${appBaseUrl}/tickets/${ticket.id}`);
    } else {
      // D. Handle Failed, Cancelled, or Pending Payment
      const failureReason = error_Message || payuError || 'Payment cancelled or declined by user/bank';
      console.warn(`[PAYU] Payment not successful for txnid ${txnid}: ${failureReason}`);

      await db.query(
        `UPDATE payments
         SET status = 'FAILED',
             payu_mihpayid = $1,
             error_description = $2,
             raw_response = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE payu_txnid = $4 OR registration_id = $5`,
        [mihpayid || null, failureReason, JSON.stringify(postData), txnid, regId]
      );

      return res.redirect(
        `${appBaseUrl}/experiences?payment_status=failed&error=${encodeURIComponent(failureReason)}`
      );
    }
  } catch (err: any) {
    console.error('[PAYU] Exception processing callback:', err);
    const origin = req.headers.origin || (req.protocol + '://' + req.get('host'));
    return res.redirect(`${origin}/experiences?payment_status=error&error=${encodeURIComponent(err.message || 'Payment processing error')}`);
  }
};

registrationsRouter.all('/payu-callback', handlePayUCallback);
registrationsRouter.all('/callback', handlePayUCallback);

// 3. PayU Webhook / Server-to-Server Notification Endpoint
registrationsRouter.post('/payu-webhook', async (req: Request, res: Response) => {
  try {
    const postData = req.body || {};
    const { status, txnid, mihpayid, udf1: regId, mode, bank_ref_num } = postData;

    console.log(`[PAYU WEBHOOK] Received S2S webhook for txnid: ${txnid}`);

    // Verify Reverse Hash
    if (!verifyPayUResponseHash(postData)) {
      console.warn('[PAYU WEBHOOK] Hash verification failed.');
      return res.status(400).json({ error: 'Invalid PayU Hash signature' });
    }

    if (status && status.toLowerCase() === 'success' && regId) {
      await confirmRegistrationAndIssueTicket(regId, {
        mihpayid: mihpayid || txnid,
        txnid,
        mode,
        hash: postData.hash,
        bank_ref_num,
        raw_response: postData,
      });
    }

    res.json({ status: 'ok', received: true });
  } catch (err: any) {
    console.error('[PAYU WEBHOOK] Error:', err);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

// 4. Client-side verify or query endpoint
registrationsRouter.get('/status/:registrationDbId', async (req: Request, res: Response) => {
  try {
    const { registrationDbId } = req.params;
    const db = await getDbClient();

    const regRes = await db.query(`SELECT * FROM registrations WHERE id = $1`, [registrationDbId]);
    if (regRes.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    const reg = regRes.rows[0];

    const payRes = await db.query(`SELECT * FROM payments WHERE registration_id = $1 ORDER BY created_at DESC LIMIT 1`, [reg.id]);
    const payment = payRes.rows[0] || null;

    let ticket = null;
    if (reg.status === 'CONFIRMED') {
      const tRes = await db.query(`SELECT * FROM tickets WHERE registration_id = $1`, [reg.id]);
      ticket = tRes.rows[0] || null;
    }

    res.json({
      registration: reg,
      payment,
      ticket,
      isConfirmed: reg.status === 'CONFIRMED',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Interactive PayU Test Gateway Simulator (for development and test mode)
// Simulates the official PayU Hosted Checkout interface when testing without live merchant keys
registrationsRouter.all('/payu-test-gateway', (req: Request, res: Response) => {
  const data = req.method === 'POST' ? req.body : req.query;
  const {
    key = 'bawal_test_key',
    txnid = `BW${Date.now()}`,
    amount = '500.00',
    productinfo = 'BAWAL Experience Ticket Pass',
    firstname = 'Attendee',
    email = 'user@bawal.social',
    phone = '9876543210',
    surl = '/api/registrations/payu-callback',
    furl = '/api/registrations/payu-callback',
    hash = '',
    udf1 = '',
    udf2 = '',
    udf3 = '',
  } = data;

  // Salt used for test environment verification
  const salt = process.env.PAYU_MERCHANT_SALT || 'bawal_payu_test_salt_2026';

  // Compute valid PayU reverse hash for success
  // sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
  const successReverseSeq = `${salt}|success|||||||||${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const successHash = crypto.createHash('sha512').update(successReverseSeq).digest('hex').toLowerCase();

  const failReverseSeq = `${salt}|failure|||||||||${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const failHash = crypto.createHash('sha512').update(failReverseSeq).digest('hex').toLowerCase();

  const simulatedMihpayid = `payu_${Date.now()}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PayU Payment Gateway — Secure Checkout</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: #0A0A0E; color: #E4E4E7; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .checkout-card { background: #14141B; border: 1px solid #272733; border-radius: 24px; width: 100%; max-width: 460px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); }
    .header { background: #1C1C26; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #2A2A38; }
    .payu-brand { display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 22px; color: #A4C639; }
    .payu-brand span { color: #FFFFFF; font-size: 13px; font-weight: 500; background: #262638; padding: 2px 8px; border-radius: 6px; letter-spacing: 0.5px; }
    .secure-badge { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #10B981; font-weight: 600; }
    .body { padding: 24px; }
    .order-box { background: #0B0B0F; border: 1px solid #22222E; border-radius: 16px; padding: 16px; margin-bottom: 20px; }
    .order-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: #A1A1AA; }
    .order-row.total { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #272733; color: #FFFFFF; font-weight: 800; font-size: 18px; margin-bottom: 0; }
    .order-row.total .amount { color: #3888FF; }
    .methods { display: flex; gap: 8px; margin-bottom: 20px; }
    .method-tab { flex: 1; padding: 10px; border-radius: 10px; background: #1E1E2A; border: 1px solid #2E2E40; text-align: center; font-size: 12px; font-weight: 600; cursor: pointer; color: #D4D4D8; }
    .method-tab.active { background: #0038FF; border-color: #0038FF; color: #FFFFFF; }
    .upi-section { background: #0E0E14; border: 1px solid #232332; border-radius: 14px; padding: 16px; margin-bottom: 20px; font-size: 12px; }
    .upi-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
    .upi-btn { padding: 10px; background: #181822; border: 1px solid #28283A; border-radius: 8px; text-align: center; font-size: 12px; color: #FFFFFF; font-weight: 600; }
    .upi-btn:hover { border-color: #A4C639; }
    .btn-pay { width: 100%; background: #A4C639; color: #052602; font-weight: 800; font-size: 15px; padding: 16px; border: none; border-radius: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; box-shadow: 0 10px 25px -5px rgba(164,198,57,0.3); }
    .btn-pay:hover { opacity: 0.95; transform: translateY(-1px); }
    .btn-cancel { width: 100%; background: transparent; color: #71717A; font-weight: 600; font-size: 12px; padding: 12px; border: none; cursor: pointer; margin-top: 8px; }
    .btn-cancel:hover { color: #EF4444; }
    .footer-note { font-size: 11px; text-align: center; color: #52525B; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="checkout-card">
    <div class="header">
      <div class="payu-brand">
        Pay<span>U</span> <span>TEST GATEWAY</span>
      </div>
      <div class="secure-badge">
        🔒 256-Bit SSL
      </div>
    </div>

    <div class="body">
      <div class="order-box">
        <div class="order-row">
          <span>Merchant</span>
          <span style="color: #FFFFFF; font-weight: 600;">BAWAL Experiences</span>
        </div>
        <div class="order-row">
          <span>Transaction ID</span>
          <span style="font-family: monospace; color: #F59E0B;">${txnid}</span>
        </div>
        <div class="order-row">
          <span>Registration</span>
          <span style="color: #FFFFFF; font-weight: 600;">${udf2 || 'BAWAL Pass'}</span>
        </div>
        <div class="order-row">
          <span>Item</span>
          <span style="color: #D4D4D8;">${productinfo}</span>
        </div>
        <div class="order-row total">
          <span>Total Payable</span>
          <span class="amount">₹${amount}</span>
        </div>
      </div>

      <div class="methods">
        <div class="method-tab active">UPI Instant</div>
        <div class="method-tab">Cards</div>
        <div class="method-tab">Net Banking</div>
      </div>

      <div class="upi-section">
        <div style="font-weight: 600; color: #E4E4E7; margin-bottom: 4px;">Fast UPI Authorization</div>
        <div style="color: #71717A; font-size: 11px;">Select preferred payment app to approve transaction:</div>
        <div class="upi-options">
          <div class="upi-btn">📱 Google Pay</div>
          <div class="upi-btn">⚡ PhonePe</div>
          <div class="upi-btn">💳 Paytm UPI</div>
          <div class="upi-btn">🇮🇳 BHIM UPI</div>
        </div>
      </div>

      <!-- Success Form Submission to surl -->
      <form action="${surl}" method="POST">
        <input type="hidden" name="status" value="success">
        <input type="hidden" name="txnid" value="${txnid}">
        <input type="hidden" name="amount" value="${amount}">
        <input type="hidden" name="productinfo" value="${productinfo}">
        <input type="hidden" name="firstname" value="${firstname}">
        <input type="hidden" name="email" value="${email}">
        <input type="hidden" name="phone" value="${phone}">
        <input type="hidden" name="key" value="${key}">
        <input type="hidden" name="mihpayid" value="${simulatedMihpayid}">
        <input type="hidden" name="mode" value="UPI">
        <input type="hidden" name="bank_ref_num" value="UPI-${Date.now()}">
        <input type="hidden" name="hash" value="${successHash}">
        <input type="hidden" name="udf1" value="${udf1}">
        <input type="hidden" name="udf2" value="${udf2}">
        <input type="hidden" name="udf3" value="${udf3}">

        <button type="submit" class="btn-pay">
          ⚡ Complete Secure Payment of ₹${amount}
        </button>
      </form>

      <!-- Failure Form Submission to furl -->
      <form action="${furl}" method="POST">
        <input type="hidden" name="status" value="failure">
        <input type="hidden" name="txnid" value="${txnid}">
        <input type="hidden" name="amount" value="${amount}">
        <input type="hidden" name="productinfo" value="${productinfo}">
        <input type="hidden" name="firstname" value="${firstname}">
        <input type="hidden" name="email" value="${email}">
        <input type="hidden" name="phone" value="${phone}">
        <input type="hidden" name="key" value="${key}">
        <input type="hidden" name="mihpayid" value="${simulatedMihpayid}">
        <input type="hidden" name="error_Message" value="User cancelled payment at checkout">
        <input type="hidden" name="hash" value="${failHash}">
        <input type="hidden" name="udf1" value="${udf1}">
        <input type="hidden" name="udf2" value="${udf2}">
        <input type="hidden" name="udf3" value="${udf3}">

        <button type="submit" class="btn-cancel">
          Cancel and return to BAWAL
        </button>
      </form>

      <div class="footer-note">
        PayU Payments Private Limited • End-to-End Encrypted Gateway
      </div>
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// 6. Get User Registrations & Tickets
registrationsRouter.get('/user', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.bawal_token;
    const token = authHeader ? authHeader.replace('Bearer ', '') : cookieToken;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: User login required.' });
    }

    const decoded = verifyToken<any>(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = await getDbClient();
    const ticketsRes = await db.query(
      `SELECT t.*, r.registration_id as registration_code, r.attendee_name, r.attendee_email, r.attendee_phone,
              e.title as event_title, e.event_number, e.date_str as event_date, e.start_time as event_time, e.venue as event_venue,
              tt.name as ticket_type_name, tt.price
       FROM tickets t
       JOIN registrations r ON t.registration_id = r.id
       JOIN events e ON t.event_id = e.id
       JOIN ticket_types tt ON r.ticket_type_id = tt.id
       WHERE t.user_id = $1 OR r.attendee_email = $2 OR r.attendee_phone = $3
       ORDER BY t.created_at DESC`,
      [decoded.userId, decoded.email || '', decoded.mobile || '']
    );

    res.json({ tickets: ticketsRes.rows });
  } catch (err: any) {
    console.error('Error fetching user tickets:', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});
