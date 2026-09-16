import { Router, Request, Response } from 'express';
import { getDbClient } from '../db.js';
import { verifyToken } from '../auth.js';

export const ticketsRouter = Router();

// Get Digital Ticket by ID
ticketsRouter.get('/:ticketId', async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const db = await getDbClient();

    const ticketRes = await db.query(
      `SELECT t.*, r.registration_id as registration_code, r.attendee_name, r.attendee_email, r.attendee_phone,
              r.attendee_age, r.attendee_gender, r.attendee_instagram,
              e.title as event_title, e.event_number, e.date_str as event_date, e.start_time as event_time,
              e.venue as event_venue, e.address as event_address,
              tt.name as ticket_type_name, tt.price
       FROM tickets t
       JOIN registrations r ON t.registration_id = r.id
       JOIN events e ON t.event_id = e.id
       JOIN ticket_types tt ON r.ticket_type_id = tt.id
       WHERE t.ticket_id = $1 OR t.id = $1 OR r.registration_id = $1`,
      [ticketId]
    );

    if (ticketRes.rows.length === 0) {
      return res.status(404).json({ error: 'Digital ticket not found.' });
    }

    const row = ticketRes.rows[0];
    res.json({
      ticket: {
        id: row.id,
        ticketId: row.ticket_id,
        registrationId: row.registration_id,
        registrationCode: row.registration_code,
        eventId: row.event_id,
        eventTitle: row.event_title,
        eventNumber: row.event_number,
        eventDate: row.event_date,
        eventTime: row.event_time,
        eventVenue: row.event_venue,
        eventAddress: row.event_address,
        userId: row.user_id,
        attendeeName: row.attendee_name,
        attendeeEmail: row.attendee_email,
        attendeePhone: row.attendee_phone,
        ticketTypeName: row.ticket_type_name,
        price: parseFloat(row.price),
        status: row.status, // CONFIRMED, USED, CANCELLED
        qrToken: row.qr_token,
        qrDataUrl: row.qr_data_url,
        checkedInAt: row.checked_in_at,
        checkedInBy: row.checked_in_by,
        createdAt: row.created_at,
      },
    });
  } catch (err: any) {
    console.error('Error fetching digital ticket:', err);
    res.status(500).json({ error: 'Failed to fetch ticket.' });
  }
});

// Verification check (For QR Scanner and Verify Page)
ticketsRouter.get('/verify/:identifier', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    const db = await getDbClient();

    const ticketRes = await db.query(
      `SELECT t.*, r.registration_id as registration_code, r.attendee_name, r.attendee_email, r.attendee_phone,
              e.title as event_title, e.event_number, e.date_str as event_date, e.start_time as event_time,
              e.venue as event_venue, tt.name as ticket_type_name
       FROM tickets t
       JOIN registrations r ON t.registration_id = r.id
       JOIN events e ON t.event_id = e.id
       JOIN ticket_types tt ON r.ticket_type_id = tt.id
       WHERE t.ticket_id = $1 OR t.qr_token = $1 OR r.registration_id = $1`,
      [identifier]
    );

    if (ticketRes.rows.length === 0) {
      return res.status(404).json({
        valid: false,
        status: 'INVALID',
        message: 'INVALID TICKET: No matching pass found in system database.',
      });
    }

    const ticket = ticketRes.rows[0];

    if (ticket.status === 'CANCELLED') {
      return res.json({
        valid: false,
        status: 'CANCELLED',
        message: 'TICKET CANCELLED: This pass has been cancelled or refunded.',
        ticket: {
          attendeeName: ticket.attendee_name,
          registrationCode: ticket.registration_code,
          eventTitle: ticket.event_title,
        },
      });
    }

    if (ticket.status === 'USED') {
      return res.json({
        valid: true,
        status: 'ALREADY_CHECKED_IN',
        message: 'ALREADY CHECKED IN',
        checkedInAt: ticket.checked_in_at,
        checkedInBy: ticket.checked_in_by,
        ticket: {
          ticketId: ticket.ticket_id,
          registrationCode: ticket.registration_code,
          attendeeName: ticket.attendee_name,
          attendeeEmail: ticket.attendee_email,
          attendeePhone: ticket.attendee_phone,
          eventTitle: ticket.event_title,
          eventNumber: ticket.event_number,
          eventDate: ticket.event_date,
          eventVenue: ticket.event_venue,
          ticketTypeName: ticket.ticket_type_name,
        },
      });
    }

    // Status is CONFIRMED & Unused
    return res.json({
      valid: true,
      status: 'VALID',
      message: 'VALID TICKET',
      ticket: {
        ticketId: ticket.ticket_id,
        registrationCode: ticket.registration_code,
        attendeeName: ticket.attendee_name,
        attendeeEmail: ticket.attendee_email,
        attendeePhone: ticket.attendee_phone,
        eventTitle: ticket.event_title,
        eventNumber: ticket.event_number,
        eventDate: ticket.event_date,
        eventVenue: ticket.event_venue,
        ticketTypeName: ticket.ticket_type_name,
      },
    });
  } catch (err: any) {
    console.error('Error verifying ticket:', err);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// Attendee Check-In (Admin or Staff action)
ticketsRouter.post('/checkin', async (req: Request, res: Response) => {
  try {
    const { ticketId, staffName } = req.body;
    if (!ticketId) {
      return res.status(400).json({ error: 'Ticket ID is required.' });
    }

    const db = await getDbClient();

    // Verify current status
    const ticketRes = await db.query(
      `SELECT t.*, r.attendee_name, r.registration_id as registration_code 
       FROM tickets t
       JOIN registrations r ON t.registration_id = r.id
       WHERE t.ticket_id = $1 OR t.qr_token = $1 OR r.registration_id = $1`,
      [ticketId]
    );

    if (ticketRes.rows.length === 0) {
      return res.status(404).json({ error: 'INVALID TICKET' });
    }

    const ticket = ticketRes.rows[0];

    if (ticket.status === 'USED') {
      return res.status(400).json({
        error: 'ALREADY CHECKED IN',
        checkedInAt: ticket.checked_in_at,
        checkedInBy: ticket.checked_in_by,
      });
    }

    if (ticket.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot check in a cancelled ticket.' });
    }

    const checker = staffName || 'Gate Staff 1';
    await db.query(
      `UPDATE tickets 
       SET status = 'USED', checked_in_at = CURRENT_TIMESTAMP, checked_in_by = $1
       WHERE id = $2`,
      [checker, ticket.id]
    );

    res.json({
      success: true,
      status: 'CHECKED_IN',
      message: 'CHECKED IN successfully!',
      attendeeName: ticket.attendee_name,
      registrationCode: ticket.registration_code,
      checkedInAt: new Date().toISOString(),
      checkedInBy: checker,
    });
  } catch (err: any) {
    console.error('Error in check-in:', err);
    res.status(500).json({ error: 'Check-in failed.' });
  }
});
