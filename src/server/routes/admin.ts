import { Router, Request, Response } from 'express';
import { getDbClient } from '../db.js';
import { requireAdmin } from './events.js';
import crypto from 'node:crypto';

export const adminRouter = Router();

adminRouter.use(requireAdmin);

// Verify Admin Session / Identity directly against Database
adminRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).user;
    if (!adminUser?.id && !adminUser?.userId && !adminUser?.email) {
      return res.status(401).json({ error: 'Unauthorized: Admin context missing.' });
    }

    const db = await getDbClient();
    const identifier = adminUser.id || adminUser.userId;

    let result;
    if (identifier) {
      result = await db.query(
        `SELECT id, email, mobile, name, age, gender, instagram, role, created_at 
         FROM users 
         WHERE id = $1 
         LIMIT 1`,
        [identifier]
      );
    } else {
      result = await db.query(
        `SELECT id, email, mobile, name, age, gender, instagram, role, created_at 
         FROM users 
         WHERE LOWER(email) = LOWER($1) 
         LIMIT 1`,
        [adminUser.email]
      );
    }

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Admin account not found in database.' });
    }

    const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    console.error('Error verifying admin via database:', err);
    res.status(500).json({ error: 'Failed to verify admin status.' });
  }
});

// Dashboard Statistics
adminRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const db = await getDbClient();

    const [
      eventsCount,
      regStats,
      revenueRes,
      ticketsCount,
      earlyBirdRes,
      regularRes,
      recentRegs,
      recentPays,
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'PUBLISHED') as upcoming FROM events`),
      db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
          COUNT(*) FILTER (WHERE status = 'CANCELLED' OR status = 'REFUNDED') as cancelled
        FROM registrations
      `),
      db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'SUCCESS'`),
      db.query(`SELECT COUNT(*) as sold, COUNT(*) FILTER (WHERE status = 'USED') as checked_in FROM tickets`),
      db.query(`
        SELECT COUNT(*) as count FROM registrations r
        JOIN ticket_types tt ON r.ticket_type_id = tt.id
        WHERE LOWER(tt.name) LIKE '%early bird%' AND r.status = 'CONFIRMED'
      `),
      db.query(`
        SELECT COUNT(*) as count FROM registrations r
        JOIN ticket_types tt ON r.ticket_type_id = tt.id
        WHERE LOWER(tt.name) LIKE '%regular%' AND r.status = 'CONFIRMED'
      `),
      db.query(`
        SELECT r.*, e.title as event_title, e.event_number, tt.name as ticket_type_name
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        JOIN ticket_types tt ON r.ticket_type_id = tt.id
        ORDER BY r.created_at DESC LIMIT 10
      `),
      db.query(`
        SELECT p.*, r.registration_id as registration_code, r.attendee_name, e.title as event_title
        FROM payments p
        JOIN registrations r ON p.registration_id = r.id
        JOIN events e ON r.event_id = e.id
        ORDER BY p.created_at DESC LIMIT 10
      `),
    ]);

    const totalRegs = parseInt(regStats.rows[0]?.total || '0', 10);
    const confirmedRegs = parseInt(regStats.rows[0]?.confirmed || '0', 10);
    const pendingRegs = parseInt(regStats.rows[0]?.pending || '0', 10);
    const cancelledRegs = parseInt(regStats.rows[0]?.cancelled || '0', 10);
    const totalRev = parseFloat(revenueRes.rows[0]?.total || '0');
    const totalSold = parseInt(ticketsCount.rows[0]?.sold || '0', 10);
    const totalCheckedIn = parseInt(ticketsCount.rows[0]?.checked_in || '0', 10);
    const earlyBirdSold = parseInt(earlyBirdRes.rows[0]?.count || '0', 10);
    const regularSold = parseInt(regularRes.rows[0]?.count || '0', 10);

    res.json({
      stats: {
        totalEvents: parseInt(eventsCount.rows[0]?.total || '0', 10),
        upcomingEvents: parseInt(eventsCount.rows[0]?.upcoming || '0', 10),
        totalRegistrations: totalRegs,
        confirmedRegistrations: confirmedRegs,
        pendingRegistrations: pendingRegs,
        cancelledRegistrations: cancelledRegs,
        totalRevenue: totalRev,
        ticketsSold: totalSold,
        ticketsRemaining: Math.max(0, 100 - totalSold),
        earlyBirdSold,
        regularSold,
        checkedInAttendees: totalCheckedIn,
      },
      recentRegistrations: recentRegs.rows,
      recentPayments: recentPays.rows,
    });
  } catch (err: any) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// All Registrations with Search & Filter
adminRouter.get('/registrations', async (req: Request, res: Response) => {
  try {
    const { search, eventId, status } = req.query;
    const db = await getDbClient();

    let query = `
      SELECT r.*, e.title as event_title, e.event_number, tt.name as ticket_type_name,
             p.status as payment_status, p.payu_mihpayid as payment_ref_id, p.payu_txnid,
             t.id as ticket_db_id, t.ticket_id, t.status as ticket_status, t.checked_in_at
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN ticket_types tt ON r.ticket_type_id = tt.id
      LEFT JOIN payments p ON p.registration_id = r.id
      LEFT JOIN tickets t ON t.registration_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (eventId) {
      params.push(eventId);
      query += ` AND r.event_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND r.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (
        r.registration_id ILIKE $${params.length} OR 
        r.attendee_name ILIKE $${params.length} OR 
        r.attendee_email ILIKE $${params.length} OR 
        r.attendee_phone ILIKE $${params.length}
      )`;
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await db.query(query, params);
    res.json({ registrations: result.rows });
  } catch (err: any) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// CSV Export
adminRouter.get('/registrations/export-csv', async (req: Request, res: Response) => {
  try {
    const db = await getDbClient();
    const result = await db.query(`
      SELECT r.registration_id, r.attendee_name, r.attendee_email, r.attendee_phone,
             r.attendee_age, r.attendee_gender, r.attendee_instagram,
             r.status as reg_status, r.amount, r.created_at,
             e.title as event_title, e.event_number, tt.name as pass_type,
             t.status as ticket_status, t.checked_in_at
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN ticket_types tt ON r.ticket_type_id = tt.id
      LEFT JOIN tickets t ON t.registration_id = r.id
      ORDER BY r.created_at DESC
    `);

    const headers = [
      'Registration ID',
      'Attendee Name',
      'Email',
      'Phone',
      'Age',
      'Gender',
      'Instagram',
      'Event',
      'Pass Type',
      'Amount (INR)',
      'Registration Status',
      'Ticket Status',
      'Checked In At',
      'Registered Date',
    ];

    const rows = result.rows.map((r) => [
      `"${r.registration_id}"`,
      `"${r.attendee_name}"`,
      `"${r.attendee_email}"`,
      `"${r.attendee_phone}"`,
      r.attendee_age || '',
      `"${r.attendee_gender || ''}"`,
      `"${r.attendee_instagram || ''}"`,
      `"${r.event_title} (${r.event_number})"`,
      `"${r.pass_type}"`,
      r.amount,
      r.reg_status,
      r.ticket_status || 'N/A',
      r.checked_in_at ? `"${new Date(r.checked_in_at).toLocaleString()}"` : 'NO',
      `"${new Date(r.created_at).toLocaleString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bawal_registrations.csv"');
    res.send(csvContent);
  } catch (err: any) {
    console.error('Error exporting CSV:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Cancel Registration
adminRouter.post('/registrations/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDbClient();

    await db.query(`UPDATE registrations SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
    await db.query(`UPDATE tickets SET status = 'CANCELLED' WHERE registration_id = $1`, [id]);

    res.json({ success: true, message: 'Registration cancelled successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to cancel registration' });
  }
});

// Refund Registration
adminRouter.post('/registrations/:id/refund', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDbClient();

    await db.query(`UPDATE registrations SET status = 'REFUNDED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
    await db.query(`UPDATE payments SET status = 'REFUNDED', updated_at = CURRENT_TIMESTAMP WHERE registration_id = $1`, [id]);
    await db.query(`UPDATE tickets SET status = 'CANCELLED' WHERE registration_id = $1`, [id]);

    res.json({ success: true, message: 'Registration marked as REFUNDED.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Get Payments
adminRouter.get('/payments', async (req: Request, res: Response) => {
  try {
    const db = await getDbClient();
    const result = await db.query(`
      SELECT p.*, r.registration_id as registration_code, r.attendee_name, r.attendee_email,
             e.title as event_title, e.event_number
      FROM payments p
      JOIN registrations r ON p.registration_id = r.id
      JOIN events e ON r.event_id = e.id
      ORDER BY p.created_at DESC
    `);
    res.json({ payments: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get Tickets
adminRouter.get('/tickets', async (req: Request, res: Response) => {
  try {
    const db = await getDbClient();
    const result = await db.query(`
      SELECT t.*, r.registration_id as registration_code, r.attendee_name, r.attendee_email, r.attendee_phone,
             e.title as event_title, e.event_number, tt.name as ticket_type_name
      FROM tickets t
      JOIN registrations r ON t.registration_id = r.id
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON r.ticket_type_id = tt.id
      ORDER BY t.created_at DESC
    `);
    res.json({ tickets: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get Users & Manage Roles
adminRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const db = await getDbClient();
    const result = await db.query(`
      SELECT id, email, mobile, name, age, gender, instagram, role, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json({ users: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

adminRouter.put('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['USER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    const db = await getDbClient();
    await db.query(`UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [role, id]);
    res.json({ success: true, message: `Role updated to ${role}` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Sponsors Management
adminRouter.get('/sponsors', async (req: Request, res: Response) => {
  try {
    const db = await getDbClient();
    const result = await db.query(`SELECT * FROM sponsors ORDER BY display_order ASC`);
    res.json({ sponsors: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch sponsors' });
  }
});

adminRouter.post('/sponsors', async (req: Request, res: Response) => {
  try {
    const { name, logoUrl, website, displayOrder } = req.body;
    const db = await getDbClient();
    const id = `sp_${crypto.randomBytes(6).toString('hex')}`;
    await db.query(
      `INSERT INTO sponsors (id, name, logo_url, website, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [id, name, logoUrl, website || '', displayOrder || 0]
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add sponsor' });
  }
});

adminRouter.delete('/sponsors/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDbClient();
    await db.query(`DELETE FROM sponsors WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete sponsor' });
  }
});

// Platform Configuration & Settings
adminRouter.get('/settings', async (req: Request, res: Response) => {
  try {
    const db = await getDbClient();

    await db.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
        brand_name VARCHAR(100) DEFAULT 'BAWAL',
        brand_tagline VARCHAR(255) DEFAULT 'Weekends Hit Different.',
        support_email VARCHAR(255) DEFAULT 'tickets@bawal.social',
        instagram_handle VARCHAR(100) DEFAULT '@bawal.social',
        default_early_bird_cap INT DEFAULT 20,
        currency VARCHAR(50) DEFAULT 'INR (₹)',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    let result = await db.query(`SELECT * FROM platform_settings WHERE id = 'default'`);
    if (result.rows.length === 0) {
      await db.query(`
        INSERT INTO platform_settings (id, brand_name, brand_tagline, support_email, instagram_handle, default_early_bird_cap, currency)
        VALUES ('default', 'BAWAL', 'Weekends Hit Different.', 'tickets@bawal.social', '@bawal.social', 20, 'INR (₹)')
      `);
      result = await db.query(`SELECT * FROM platform_settings WHERE id = 'default'`);
    }

    res.json({ settings: result.rows[0] });
  } catch (err: any) {
    console.error('Error fetching platform settings:', err);
    res.status(500).json({ error: 'Failed to fetch platform settings' });
  }
});

adminRouter.put('/settings', async (req: Request, res: Response) => {
  try {
    const { brandName, tagline, email, instagram, earlyBirdCap } = req.body;
    const db = await getDbClient();

    await db.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
        brand_name VARCHAR(100) DEFAULT 'BAWAL',
        brand_tagline VARCHAR(255) DEFAULT 'Weekends Hit Different.',
        support_email VARCHAR(255) DEFAULT 'tickets@bawal.social',
        instagram_handle VARCHAR(100) DEFAULT '@bawal.social',
        default_early_bird_cap INT DEFAULT 20,
        currency VARCHAR(50) DEFAULT 'INR (₹)',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      INSERT INTO platform_settings (id, brand_name, brand_tagline, support_email, instagram_handle, default_early_bird_cap, updated_at)
      VALUES ('default', $1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE 
      SET brand_name = $1,
          brand_tagline = $2,
          support_email = $3,
          instagram_handle = $4,
          default_early_bird_cap = $5,
          updated_at = CURRENT_TIMESTAMP
    `, [brandName, tagline, email, instagram, earlyBirdCap || 20]);

    res.json({ success: true, message: 'Platform settings saved successfully' });
  } catch (err: any) {
    console.error('Error saving platform settings:', err);
    res.status(500).json({ error: 'Failed to save platform settings' });
  }
});