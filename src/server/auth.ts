import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { getDbClient } from './db.js';
import { sendOtpEmail } from './notification.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bawal_jwt_secret_dev_2026_super_secure';

// Helper to hash OTP with salt
export function hashOtp(otp: string, salt: string): string {
  return crypto.pbkdf2Sync(otp, salt, 10000, 64, 'sha512').toString('hex');
}

// Generate 6 digit cryptographically secure random OTP
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Password hashing for admin
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, originalHash] = stored.split(':');
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

// Generate JWT token
export function generateToken(payload: object, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyToken<T>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch {
    return null;
  }
}

// Send OTP function (Email-only)
export async function createAndStoreOtp(emailInput: string): Promise<{ success: boolean; message: string; devOtp?: string }> {
  const db = await getDbClient();
  const cleanEmail = emailInput.trim().toLowerCase();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return {
      success: false,
      message: 'Please enter a valid email address.',
    };
  }

  // Rate limiting check: check if OTP requested in last 30 seconds
  const recent = await db.query(
    `SELECT * FROM otp_verifications 
     WHERE identifier = $1 
     ORDER BY created_at DESC LIMIT 1`,
    [cleanEmail]
  );

  if (recent.rows.length > 0) {
    const lastCreated = new Date(recent.rows[0].created_at).getTime();
    const elapsed = Date.now() - lastCreated;
    if (elapsed < 30000) { // 30 seconds cooldown
      return {
        success: false,
        message: `Please wait ${Math.ceil((30000 - elapsed) / 1000)} seconds before requesting a new OTP.`,
      };
    }
  }

  const otp = generateSecureOtp();
  const salt = crypto.randomBytes(16).toString('hex');
  const hashed = hashOtp(otp, salt);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
  const id = crypto.randomUUID();

  await db.query(
    `INSERT INTO otp_verifications (id, identifier, hashed_otp, salt, attempts, max_attempts, expires_at)
     VALUES ($1, $2, $3, $4, 0, 5, $5)`,
    [id, cleanEmail, hashed, salt, expiresAt.toISOString()]
  );

  console.log(`[AUTH] Secure OTP generated for ${cleanEmail}: [${otp}] (expires in 10 mins)`);

  // Direct OTP email delivery via Resend
  try {
    const delivery = await sendOtpEmail(cleanEmail, otp);
    if (!delivery.success) {
      console.error(`[AUTH DELIVERY ERROR] Resend failed to deliver OTP to ${cleanEmail}`);
    } else {
      console.log(`[AUTH DELIVERY] Resend OTP email dispatched successfully to ${cleanEmail}`);
    }
  } catch (err: any) {
    console.error(`[AUTH DELIVERY EXCEPTION] Error calling Resend for ${cleanEmail}:`, err?.message || err);
  }

  return {
    success: true,
    message: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
  };
}

// Verify OTP function (Email-only)
export async function verifyOtpAttempt(
  emailInput: string,
  otpCandidate: string
): Promise<{ valid: boolean; message: string; userId?: string }> {
  const db = await getDbClient();
  const cleanEmail = emailInput.trim().toLowerCase();

  const recordRes = await db.query(
    `SELECT * FROM otp_verifications 
     WHERE identifier = $1 AND verified_at IS NULL 
     ORDER BY created_at DESC LIMIT 1`,
    [cleanEmail]
  );

  if (recordRes.rows.length === 0) {
    return { valid: false, message: 'No active OTP request found for this email. Please request a new code.' };
  }

  const record = recordRes.rows[0];

  // Check expiration
  if (new Date(record.expires_at).getTime() < Date.now()) {
    return { valid: false, message: 'OTP has expired. Please request a new code.' };
  }

  // Check attempts
  if (record.attempts >= record.max_attempts) {
    return { valid: false, message: 'Maximum verification attempts exceeded. Please request a new code.' };
  }

  // Verify hash
  const computedHash = hashOtp(otpCandidate.trim(), record.salt);
  if (computedHash !== record.hashed_otp) {
    await db.query(
      `UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1`,
      [record.id]
    );
    const remaining = record.max_attempts - (record.attempts + 1);
    return {
      valid: false,
      message: `Invalid code. ${remaining} attempt(s) remaining.`,
    };
  }

  // Mark as verified
  await db.query(
    `UPDATE otp_verifications SET verified_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [record.id]
  );

  // Get or create user by email
  const userCheck = await db.query(
    `SELECT * FROM users WHERE LOWER(email) = $1`,
    [cleanEmail]
  );

  let userId: string;
  if (userCheck.rows.length > 0) {
    userId = userCheck.rows[0].id;
  } else {
    userId = crypto.randomUUID();
    await db.query(
      `INSERT INTO users (id, email, role) VALUES ($1, $2, 'USER')`,
      [userId, cleanEmail]
    );
    console.log(`[AUTH] New user record created for email: ${cleanEmail}`);
  }

  return {
    valid: true,
    message: 'OTP verified successfully.',
    userId,
  };
}
