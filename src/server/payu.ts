import crypto from 'node:crypto';

/**
 * CONFIRMATION:
 * PAYU_WEBHOOK_SECRET is NOT required for PayU Hosted Web Checkout.
 * PayU Web Checkout relies strictly on SHA-512 request and reverse hashes
 * calculated with PAYU_MERCHANT_KEY and PAYU_MERCHANT_SALT.
 */

// PayU Endpoints
export const PAYU_ENDPOINTS = {
  TEST_PAYMENT_URL: 'https://test.payu.in/_payment',
  PROD_PAYMENT_URL: 'https://secure.payu.in/_payment',
  TEST_VERIFY_URL: 'https://test.payu.in/merchant/postservice?form=2',
  PROD_VERIFY_URL: 'https://info.payu.in/merchant/postservice?form=2',
};

/**
 * Actively retrieves the PayU Merchant Key from environment variables.
 */
export function getPayUMerchantKey(): string {
  return (process.env.PAYU_MERCHANT_KEY || '').trim();
}

/**
 * Actively retrieves the PayU Merchant Salt from environment variables.
 */
export function getPayUMerchantSalt(): string {
  return (process.env.PAYU_MERCHANT_SALT || '').trim();
}

/**
 * Actively retrieves the PayU Environment ('TEST' or 'PRODUCTION').
 */
export function getPayUEnv(): string {
  return (process.env.PAYU_ENV || 'TEST').trim().toUpperCase();
}

/**
 * Checks if PayU credentials are fully configured.
 */
export function isPayUConfigured(): boolean {
  return Boolean(getPayUMerchantKey() && getPayUMerchantSalt());
}

/**
 * Returns the active payment endpoint URL based on PAYU_ENV.
 * When PAYU_ENV === 'TEST', strictly returns https://test.payu.in/_payment.
 * Can also be explicitly overridden via PAYU_PAYMENT_URL if needed.
 */
export function getPayUPaymentUrl(): string {
  if (process.env.PAYU_PAYMENT_URL) {
    return process.env.PAYU_PAYMENT_URL.trim();
  }
  const env = getPayUEnv();
  if (env === 'PRODUCTION' || env === 'PROD') {
    return PAYU_ENDPOINTS.PROD_PAYMENT_URL;
  }
  // Strictly https://test.payu.in/_payment for TEST environment
  return PAYU_ENDPOINTS.TEST_PAYMENT_URL;
}

/**
 * Returns the active transaction verification endpoint URL.
 */
export function getPayUVerifyUrl(): string {
  const env = getPayUEnv();
  if (env === 'PRODUCTION' || env === 'PROD') {
    return PAYU_ENDPOINTS.PROD_VERIFY_URL;
  }
  return PAYU_ENDPOINTS.TEST_VERIFY_URL;
}

/**
 * Helper to ensure a callback URL is an absolute URL starting with http:// or https://.
 */
export function ensureAbsoluteUrl(url: string, fallbackHost?: string): string {
  const trimmed = (url || '').trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const appUrl = (process.env.APP_URL || '').trim().replace(/\/$/, '');
  const base = appUrl && !appUrl.includes('MY_APP_URL')
    ? appUrl
    : (fallbackHost ? `https://${fallbackHost.replace(/^https?:\/\//, '')}` : 'http://localhost:3000');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}

export interface PayUPaymentRequestParams {
  txnid: string;
  amount: number;
  productinfo: string;
  firstname: string;
  email: string;
  phone?: string | null;
  surl: string;
  furl: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

export interface PayUPaymentPayload {
  actionUrl: string;
  params: {
    key: string;
    txnid: string;
    amount: string;
    productinfo: string;
    firstname: string;
    email: string;
    phone: string;
    surl: string;
    furl: string;
    hash: string;
    service_provider: string;
    udf1: string;
    udf2: string;
    udf3: string;
    udf4: string;
    udf5: string;
  };
  isTestMode: boolean;
}

/**
 * Calculates the PayU SHA-512 Request Hash according to PayU official documentation:
 * sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 *
 * Empty udf fields remain empty strings between pipes without spaces.
 */
export function generatePayURequestHash(params: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  salt: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}): string {
  const {
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    salt,
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
  } = params;

  // Exact Formula: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
  return crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();
}

/**
 * Verifies the PayU Reverse Hash from the payment response according to official PayU specification:
 * If additionalCharges is present:
 * sha512(additionalCharges|SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * Else:
 * sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export function verifyPayUResponseHash(responseBody: Record<string, any>): boolean {
  const salt = getPayUMerchantSalt() || 'bawal_payu_test_salt_2026';
  const key = getPayUMerchantKey() || 'bawal_test_key';
  const receivedHash = (responseBody.hash || '').toLowerCase();

  if (!receivedHash) {
    return false;
  }

  const {
    status = '',
    txnid = '',
    amount = '',
    productinfo = '',
    firstname = '',
    email = '',
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
    additionalCharges,
  } = responseBody;

  // Compute calculated reverse hash
  let reverseHashSequence: string;
  if (additionalCharges) {
    reverseHashSequence = `${additionalCharges}|${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  } else {
    reverseHashSequence = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  }

  const expectedHash = crypto.createHash('sha512').update(reverseHashSequence).digest('hex').toLowerCase();

  const expectedBuf = Buffer.from(expectedHash, 'utf8');
  const receivedBuf = Buffer.from(receivedHash, 'utf8');

  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

/**
 * Prepares the PayU payment payload with sanitized fields, exact precision, and absolute callback URLs.
 */
export function createPayUPaymentRequest(params: PayUPaymentRequestParams): PayUPaymentPayload {
  const key = getPayUMerchantKey() || 'bawal_test_key';
  const salt = getPayUMerchantSalt() || 'bawal_payu_test_salt_2026';
  const env = getPayUEnv();

  // Precision: amount string formatted to 2 decimal places in both hash generator and HTML form
  const formattedAmount = Number(params.amount).toFixed(2);

  // Payload Sanitization:
  // txnid: alphanumeric, underscore, hyphen only, max 25 chars
  const cleanTxnId = params.txnid.replace(/[^a-zA-Z0-9_-]/g, '').trim().slice(0, 25);

  // productinfo: trimmed, no line breaks, no unsupported special characters
  const cleanProductInfo = params.productinfo
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[^a-zA-Z0-9 \-_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100) || 'Event Ticket';

  // firstname: trimmed, alphanumeric and space only, no line breaks
  const cleanFirstName = params.firstname
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50) || 'Guest';

  // email: trimmed, lowercase, no spaces or line breaks
  const cleanEmail = (params.email || '')
    .toString()
    .replace(/[\r\n\t\s]/g, '')
    .trim()
    .toLowerCase() || 'guest@bawal.social';

  // phone: strictly mandatory in PayU payment POST form.
  // If the user only provided an email, or if phone is empty, undefined, null, or invalid,
  // pass a valid fallback phone number (e.g. 9876543210).
  const rawDigits = (params.phone || '').toString().replace(/[^0-9]/g, '');
  const cleanPhone = rawDigits.length >= 10 ? rawDigits.slice(-10) : '9876543210';

  // udf fields: empty udf fields must remain empty strings between pipes without spaces
  const cleanUdf1 = (params.udf1 || '').replace(/[\r\n\t|]/g, '').trim();
  const cleanUdf2 = (params.udf2 || '').replace(/[\r\n\t|]/g, '').trim();
  const cleanUdf3 = (params.udf3 || '').replace(/[\r\n\t|]/g, '').trim();
  const cleanUdf4 = (params.udf4 || '').replace(/[\r\n\t|]/g, '').trim();
  const cleanUdf5 = (params.udf5 || '').replace(/[\r\n\t|]/g, '').trim();

  // surl and furl must be absolute URLs, never relative paths
  const cleanSurl = ensureAbsoluteUrl(params.surl);
  const cleanFurl = ensureAbsoluteUrl(params.furl);

  // Hash calculation with exact PayU formula
  const hash = generatePayURequestHash({
    key,
    txnid: cleanTxnId,
    amount: formattedAmount,
    productinfo: cleanProductInfo,
    firstname: cleanFirstName,
    email: cleanEmail,
    salt,
    udf1: cleanUdf1,
    udf2: cleanUdf2,
    udf3: cleanUdf3,
    udf4: cleanUdf4,
    udf5: cleanUdf5,
  });

  // Action URL: strictly https://test.payu.in/_payment when PAYU_ENV === 'TEST'
  const actionUrl = getPayUPaymentUrl();

  // Mandatory Form Parameters for PayU Hosted Form POST
  const formParams = {
    key,
    txnid: cleanTxnId,
    amount: formattedAmount,
    productinfo: cleanProductInfo,
    firstname: cleanFirstName,
    email: cleanEmail,
    phone: cleanPhone,
    surl: cleanSurl,
    furl: cleanFurl,
    hash,
    service_provider: 'payu_paisa',
    udf1: cleanUdf1,
    udf2: cleanUdf2,
    udf3: cleanUdf3,
    udf4: cleanUdf4,
    udf5: cleanUdf5,
  };

  // Logging: Print exact form submission object to the server terminal
  const maskedSalt = salt ? (salt.length > 6 ? `${salt.slice(0, 4)}...${salt.slice(-2)}` : '***') : '[NOT SET]';
  const unhashedSequenceMasked = `${key}|${cleanTxnId}|${formattedAmount}|${cleanProductInfo}|${cleanFirstName}|${cleanEmail}|${cleanUdf1}|${cleanUdf2}|${cleanUdf3}|${cleanUdf4}|${cleanUdf5}||||||${maskedSalt}`;

  console.log('\n=================== [EXACT PAYU FORM SUBMISSION OBJECT] ===================');
  console.log('Action URL:', actionUrl);
  console.log('Form Parameters:');
  console.log(JSON.stringify(formParams, null, 2));
  console.log('[PAYU UNHASHED SEQUENCE (SALT MASKED)]:', unhashedSequenceMasked);
  console.log('========================================================================\n');

  return {
    actionUrl,
    params: formParams,
    isTestMode: env === 'TEST',
  };
}

/**
 * PayU Server-to-Server Transaction Verification API:
 * Calls PayU's verify_payment web service to confirm transaction status.
 */
export async function verifyPayUTransactionServerSide(txnid: string): Promise<{
  verified: boolean;
  status: string;
  payuDetails?: any;
}> {
  if (!isPayUConfigured()) {
    return {
      verified: true,
      status: 'success',
      payuDetails: {
        mode: 'UPI',
        status: 'success',
        txnid,
      },
    };
  }

  try {
    const key = getPayUMerchantKey();
    const salt = getPayUMerchantSalt();
    const command = 'verify_payment';

    // Hash for verify_payment: sha512(key|command|var1|salt)
    const hashString = `${key}|${command}|${txnid}|${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();

    const verifyUrl = getPayUVerifyUrl();
    const bodyParams = new URLSearchParams({
      key,
      hash,
      var1: txnid,
      command,
    });

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      console.error(`[PAYU] verify_payment HTTP error: ${response.status}`);
      return { verified: false, status: 'error' };
    }

    const data = (await response.json()) as any;
    const transactionDetails = data?.transaction_details?.[txnid];

    if (transactionDetails && transactionDetails.status === 'success') {
      return {
        verified: true,
        status: 'success',
        payuDetails: transactionDetails,
      };
    }

    return {
      verified: false,
      status: transactionDetails?.status || 'failed',
      payuDetails: transactionDetails,
    };
  } catch (err) {
    console.error('[PAYU] verify_payment service exception:', err);
    return { verified: false, status: 'error' };
  }
}
