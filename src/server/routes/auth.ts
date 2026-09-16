import { Router, Request, Response } from 'express';
import { createAndStoreOtp, verifyOtpAttempt, generateToken, verifyToken, verifyPassword } from '../auth.js';
import { getDbClient } from '../db.js';

export const authRouter = Router();

// Send OTP (Email-only)
authRouter.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const rawEmail = req.body.email || req.body.identifier;
    if (!rawEmail || typeof rawEmail !== 'string') {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const email = rawEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const result = await createAndStoreOtp(email);
    if (!result.success) {
      return res.status(429).json({ error: result.message });
    }

    res.json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (err: any) {
    console.error('Error in send-otp:', err);
    res.status(500).json({ error: 'Failed to send OTP. Please try again later.' });
  }
});

// Verify OTP (Email-only)
authRouter.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const rawEmail = req.body.email || req.body.identifier;
    const otpCandidate = req.body.otp || req.body.code;

    if (!rawEmail || typeof rawEmail !== 'string') {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const email = rawEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!otpCandidate || typeof otpCandidate !== 'string' || !otpCandidate.trim()) {
      return res.status(400).json({ error: 'OTP verification code is required.' });
    }

    const verification = await verifyOtpAttempt(email, otpCandidate.trim());
    if (!verification.valid || !verification.userId) {
      return res.status(400).json({ error: verification.message });
    }

    // Fetch user
    const db = await getDbClient();
    const userRes = await db.query(`SELECT * FROM users WHERE id = $1`, [verification.userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User record not found.' });
    }
    const user = userRes.rows[0];

    const token = generateToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    res.cookie('bawal_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        instagram: user.instagram,
      },
    });
  } catch (err: any) {
    console.error('Error in verify-otp:', err);
    res.status(500).json({ error: 'OTP verification failed. Please try again.' });
  }
});

// Get Current Logged-in User
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.bawal_token;
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : cookieToken;

    if (!token) {
      return res.json({ user: null });
    }

    const decoded = verifyToken<any>(token);
    if (!decoded || !decoded.userId) {
      return res.json({ user: null });
    }

    const db = await getDbClient();
    const userRes = await db.query(
      `SELECT id, email, mobile, name, age, gender, instagram, role, created_at FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (userRes.rows.length === 0) {
      return res.json({ user: null });
    }

    res.json({ user: userRes.rows[0] });
  } catch (err) {
    res.json({ user: null });
  }
});

// Update Profile
authRouter.put('/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.bawal_token;
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : cookieToken;

    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = verifyToken<any>(token);
    if (!decoded?.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, age, gender, instagram } = req.body;
    const db = await getDbClient();

    await db.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           age = COALESCE($2, age),
           gender = COALESCE($3, gender),
           instagram = COALESCE($4, instagram),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [name, age ? parseInt(age, 10) : null, gender, instagram, decoded.userId]
    );

    const updated = await db.query(
      `SELECT id, email, mobile, name, age, gender, instagram, role FROM users WHERE id = $1`,
      [decoded.userId]
    );
    res.json({ success: true, user: updated.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

// Admin Login (Strict Database Verification)
authRouter.post('/admin-login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = await getDbClient();
    const adminRes = await db.query(
      `SELECT * FROM admin_users WHERE LOWER(email) = $1 AND is_active = true`,
      [cleanEmail]
    );

    if (adminRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const admin = adminRes.rows[0];

    // Strictly verify hashed password against PostgreSQL admin_users table
    const passwordMatch = verifyPassword(password, admin.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const adminData = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };

    const token = generateToken(
      {
        userId: admin.id,
        role: admin.role,
        isAdmin: true,
        email: admin.email,
        name: admin.name,
      },
      '24h'
    );

    res.cookie('bawal_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    res.json({
      success: true,
      token,
      admin: adminData,
      user: adminData,
    });
  } catch (err: any) {
    console.error('Admin login failed:', err);
    res.status(500).json({ error: 'Admin login failed.' });
  }
});

// Admin Session Verification (Database-backed)
authRouter.get('/admin-me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.bawal_admin_token;
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : cookieToken;

    if (!token) {
      return res.status(401).json({ success: false, admin: null });
    }

    const decoded = verifyToken<any>(token);
    if (!decoded || !decoded.userId || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(decoded.role)) {
      return res.status(401).json({ success: false, admin: null });
    }

    // Verify against DB to ensure account wasn't deactivated or deleted
    const db = await getDbClient();
    const adminRes = await db.query(
      `SELECT id, email, name, role FROM admin_users WHERE id = $1 AND is_active = true`,
      [decoded.userId]
    );

    if (adminRes.rows.length === 0) {
      return res.status(401).json({ success: false, admin: null });
    }

    res.json({
      success: true,
      admin: adminRes.rows[0],
    });
  } catch {
    res.status(401).json({ success: false, admin: null });
  }
});

// Logout
authRouter.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('bawal_token');
  res.clearCookie('bawal_admin_token');
  res.json({ success: true });
});