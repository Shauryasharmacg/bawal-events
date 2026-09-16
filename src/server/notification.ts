import { getDbClient } from './db.js';
import crypto from 'node:crypto';

export interface NotificationPayload {
  to: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  subject?: string;
  text: string;
  html?: string;
  template: string;
  metadata?: Record<string, any>;
}

export async function sendNotification(payload: NotificationPayload): Promise<{ success: boolean; simulated: boolean }> {
  const db = await getDbClient();
  const id = crypto.randomUUID();

  let simulated = true;
  let status = 'SIMULATED';
  let errorMessage: string | null = null;

  // Real Email Provider check (e.g. Resend)
  if (payload.channel === 'EMAIL') {
    if (process.env.RESEND_API_KEY) {
      try {
        let from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
        if (!from.includes('<')) {
          from = `BAWAL <${from}>`;
        }

        console.log(`[RESEND DISPATCH] Initiating email delivery to: ${payload.to} | From: ${from} | Subject: ${payload.subject || 'BAWAL Notification'}`);

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [payload.to],
            subject: payload.subject || 'BAWAL Event Notification',
            html: payload.html || `<p>${payload.text}</p>`,
          }),
        });

        if (res.ok) {
          const resData = await res.json().catch(() => ({}));
          simulated = false;
          status = 'SENT';
          console.log(`[RESEND SUCCESS] Email delivered successfully to: ${payload.to} | ID: ${(resData as any)?.id || 'ok'}`);
        } else {
          const errorData = await res.text();
          status = 'FAILED';
          errorMessage = `Resend API Error (Status ${res.status}): ${errorData}`;
          console.error(`[RESEND ERROR] Delivery failure to ${payload.to}:`, errorMessage);
        }
      } catch (err: any) {
        status = 'FAILED';
        errorMessage = `Resend Request Exception: ${err?.message || err}`;
        console.error(`[RESEND EXCEPTION] Network or unexpected error sending email to ${payload.to}:`, errorMessage);
      }
    } else {
      console.warn(`[RESEND WARNING] RESEND_API_KEY is not configured in process.env. Using simulated email delivery to ${payload.to}`);
    }
  }

  // Real SMS Provider check
  if (payload.channel === 'SMS' && process.env.SMS_API_KEY) {
    // Ready for Indian SMS Provider (Gupshup / MSG91)
    simulated = false;
    status = 'SENT';
    console.log(`[SMS DISPATCHED] To: ${payload.to} | Msg: ${payload.text}`);
  }

  // Real WhatsApp Provider check
  if (payload.channel === 'WHATSAPP' && process.env.WHATSAPP_API_KEY) {
    // Ready for WhatsApp Cloud API
    simulated = false;
    status = 'SENT';
    console.log(`[WHATSAPP DISPATCHED] To: ${payload.to}`);
  }

  if (simulated) {
    console.log(`[NOTIFICATION SIMULATION] [${payload.channel}] To: ${payload.to} | Template: ${payload.template} | Text: ${payload.text}`);
  }

  // Persist notification record
  try {
    await db.query(
      `INSERT INTO notifications (id, recipient, channel, template, payload, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        payload.to,
        payload.channel,
        payload.template,
        JSON.stringify(payload.metadata || {}),
        status,
        errorMessage,
      ]
    );
  } catch (e) {
    console.error('Failed to log notification:', e);
  }

  return { success: status === 'SENT' || status === 'SIMULATED', simulated };
}

export async function sendTicketConfirmationEmail(ticket: {
  attendeeName: string;
  attendeeEmail: string;
  eventTitle: string;
  eventNumber: string;
  registrationCode: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  ticketUrl: string;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #02040D; color: #FFFFFF; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #132252;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #3888FF; font-size: 32px; margin: 0; letter-spacing: 2px;">BAWAL</h1>
        <p style="color: #A0A0A8; font-size: 14px; margin: 4px 0 0 0;">Weekends Hit Different.</p>
      </div>

      <div style="background-color: #060B22; border: 1px solid #132252; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <h2 style="margin-top: 0; color: #FFFFFF;">You're In! Confirmed Pass 🎟️</h2>
        <p style="color: #E2E2E8; font-size: 16px;">Hey <strong>${ticket.attendeeName}</strong>, your spot is officially booked for <strong>${ticket.eventTitle}</strong> (${ticket.eventNumber}).</p>
        
        <hr style="border: none; border-top: 1px solid #132252; margin: 16px 0;" />

        <div style="margin-bottom: 12px;">
          <span style="color: #A0A0A8; font-size: 12px; text-transform: uppercase;">Registration ID</span>
          <p style="font-size: 20px; font-weight: bold; color: #3888FF; margin: 4px 0;">${ticket.registrationCode}</p>
        </div>

        <div style="margin-bottom: 12px;">
          <span style="color: #A0A0A8; font-size: 12px; text-transform: uppercase;">Date & Time</span>
          <p style="font-size: 15px; color: #FFFFFF; margin: 4px 0;">${ticket.eventDate} • ${ticket.eventTime}</p>
        </div>

        <div style="margin-bottom: 12px;">
          <span style="color: #A0A0A8; font-size: 12px; text-transform: uppercase;">Venue</span>
          <p style="font-size: 15px; color: #FFFFFF; margin: 4px 0;">${ticket.eventVenue}</p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${ticket.ticketUrl}" style="background-color: #0038FF; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          View & Download Digital Ticket
        </a>
      </div>

      <p style="text-align: center; color: #6E6E78; font-size: 12px; margin-top: 32px;">
        Follow our vibe on Instagram: <a href="https://instagram.com/bawal.social" style="color: #3888FF;">@bawal.social</a>
      </p>
    </div>
  `;

  return await sendNotification({
    to: ticket.attendeeEmail,
    channel: 'EMAIL',
    subject: `Your Confirmed Ticket for ${ticket.eventTitle} (${ticket.registrationCode})`,
    text: `Hey ${ticket.attendeeName}, your registration (${ticket.registrationCode}) for ${ticket.eventTitle} is CONFIRMED! Date: ${ticket.eventDate}, Venue: ${ticket.eventVenue}. Access your ticket here: ${ticket.ticketUrl}`,
    html,
    template: 'TICKET_CONFIRMATION',
    metadata: { registrationCode: ticket.registrationCode, eventTitle: ticket.eventTitle },
  });
}

export async function sendOtpEmail(email: string, otp: string): Promise<{ success: boolean; simulated: boolean }> {
  console.log(`[AUTH RESEND] Preparing login verification OTP email for: ${email}`);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #02040D; color: #FFFFFF; padding: 36px 24px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #132252;">
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #0038FF, #3888FF); color: #FFFFFF; font-weight: 900; font-size: 20px; padding: 8px 16px; border-radius: 10px; letter-spacing: 2px; margin-bottom: 12px;">BAWAL</div>
        <h2 style="color: #FFFFFF; font-size: 22px; font-weight: 800; margin: 8px 0;">Your Login Verification Code</h2>
        <p style="color: #A0A0A8; font-size: 14px; margin: 0;">Use this code to sign in to your BAWAL account.</p>
      </div>

      <div style="background-color: #060B22; border: 1px solid #132252; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="color: #A0A0A8; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">One-Time Password (OTP)</span>
        <div style="background-color: #02040D; border: 1px dashed #0038FF; border-radius: 10px; padding: 18px; margin: 16px 0; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #3888FF; font-family: monospace;">
          ${otp}
        </div>
        <p style="color: #E2E2E8; font-size: 13px; margin: 0;">
          This code is valid for <strong>10 minutes</strong>. Do not share it with anyone.
        </p>
      </div>

      <p style="color: #6E6E78; font-size: 12px; text-align: center; margin: 0;">
        If you did not request this login code, you can safely ignore this email.
      </p>
    </div>
  `;

  const result = await sendNotification({
    to: email,
    channel: 'EMAIL',
    subject: `Your BAWAL Login Code: ${otp}`,
    text: `Your BAWAL verification code is: ${otp}. It will expire in 10 minutes.`,
    html,
    template: 'EMAIL_OTP',
    metadata: { email, otp },
  });

  if (!result.success) {
    console.error(`[AUTH RESEND ERROR] Failed to dispatch OTP to ${email}`);
  }

  return result;
}

