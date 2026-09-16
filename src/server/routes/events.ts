import { Router, Request, Response } from 'express';
import { getDbClient } from '../db.js';
import { verifyToken } from '../auth.js';
import crypto from 'node:crypto';

export const eventsRouter = Router();

// Middleware to verify Admin/Staff
export function requireAdmin(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.bawal_admin_token || req.cookies?.bawal_token;
  const token = authHeader ? authHeader.replace('Bearer ', '') : cookieToken;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Admin login required' });
  }

  const decoded = verifyToken<any>(token);
  if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'STAFF')) {
    return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
  }

  (req as any).user = decoded;
  next();
}

// Get all events
eventsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDbClient();
    const eventsRes = await db.query(
      `SELECT * FROM events WHERE is_active = true ORDER BY created_at DESC`
    );

    const results = [];
    for (const ev of eventsRes.rows) {
      // Calculate actual confirmed registrations
      const regCountRes = await db.query(
        `SELECT COUNT(*) as count FROM registrations WHERE event_id = $1 AND status = 'CONFIRMED'`,
        [ev.id]
      );
      const registeredCount = parseInt(regCountRes.rows[0]?.count || '0', 10);
      const remainingSpots = Math.max(0, ev.total_capacity - registeredCount);
      const isSoldOut = remainingSpots === 0;

      // Get ticket types
      const ttRes = await db.query(
        `SELECT * FROM ticket_types WHERE event_id = $1 AND is_active = true ORDER BY sort_order ASC`,
        [ev.id]
      );

      const ticketTypes = [];
      for (const tt of ttRes.rows) {
        const ttSoldCountRes = await db.query(
          `SELECT COUNT(*) as count FROM registrations WHERE ticket_type_id = $1 AND status = 'CONFIRMED'`,
          [tt.id]
        );
        const ttSoldCount = parseInt(ttSoldCountRes.rows[0]?.count || '0', 10);
        const ttRemaining = Math.max(0, tt.total_available - ttSoldCount);
        ticketTypes.push({
          id: tt.id,
          eventId: tt.event_id,
          name: tt.name,
          price: parseFloat(tt.price),
          totalAvailable: tt.total_available,
          soldCount: ttSoldCount,
          remainingCount: ttRemaining,
          isActive: tt.is_active,
          perks: typeof tt.perks === 'string' ? JSON.parse(tt.perks) : tt.perks,
          sortOrder: tt.sort_order,
        });
      }

      results.push({
        id: ev.id,
        slug: ev.slug,
        eventNumber: ev.event_number,
        title: ev.title,
        subtitle: ev.subtitle,
        dateStr: ev.date_str,
        startTime: ev.start_time,
        endTime: ev.end_time,
        venue: ev.venue,
        address: ev.address,
        city: ev.city,
        description: ev.description,
        about: ev.about,
        highlights: typeof ev.highlights === 'string' ? JSON.parse(ev.highlights) : ev.highlights,
        totalCapacity: ev.total_capacity,
        registeredCount,
        remainingSpots,
        status: isSoldOut ? 'SOLD_OUT' : ev.status,
        heroImage: ev.hero_image,
        gallery: typeof ev.gallery === 'string' ? JSON.parse(ev.gallery) : ev.gallery,
        ticketTypes,
      });
    }

    res.json({ events: results });
  } catch (err: any) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get event by slug
eventsRouter.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const db = await getDbClient();

    const evRes = await db.query(
      `SELECT * FROM events WHERE slug = $1 OR id = $1`,
      [slug]
    );

    if (evRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const ev = evRes.rows[0];

    // Real dynamic spots count
    const regCountRes = await db.query(
      `SELECT COUNT(*) as count FROM registrations WHERE event_id = $1 AND status = 'CONFIRMED'`,
      [ev.id]
    );
    const registeredCount = parseInt(regCountRes.rows[0]?.count || '0', 10);
    const remainingSpots = Math.max(0, ev.total_capacity - registeredCount);
    const isSoldOut = remainingSpots === 0;

    // Ticket types
    const ttRes = await db.query(
      `SELECT * FROM ticket_types WHERE event_id = $1 AND is_active = true ORDER BY sort_order ASC`,
      [ev.id]
    );

    const ticketTypes = [];
    for (const tt of ttRes.rows) {
      const ttSoldCountRes = await db.query(
        `SELECT COUNT(*) as count FROM registrations WHERE ticket_type_id = $1 AND status = 'CONFIRMED'`,
        [tt.id]
      );
      const ttSoldCount = parseInt(ttSoldCountRes.rows[0]?.count || '0', 10);
      const ttRemaining = Math.max(0, tt.total_available - ttSoldCount);
      ticketTypes.push({
        id: tt.id,
        eventId: tt.event_id,
        name: tt.name,
        price: parseFloat(tt.price),
        totalAvailable: tt.total_available,
        soldCount: ttSoldCount,
        remainingCount: ttRemaining,
        isActive: tt.is_active && ttRemaining > 0,
        perks: typeof tt.perks === 'string' ? JSON.parse(tt.perks) : tt.perks,
        sortOrder: tt.sort_order,
      });
    }

    // Custom fields
    const cfRes = await db.query(
      `SELECT * FROM custom_fields WHERE event_id = $1 ORDER BY display_order ASC`,
      [ev.id]
    );
    const customFields = cfRes.rows.map((cf) => ({
      id: cf.id,
      eventId: cf.event_id,
      fieldLabel: cf.field_label,
      fieldName: cf.field_name,
      fieldType: cf.field_type,
      placeholder: cf.placeholder,
      required: cf.required,
      options: typeof cf.options === 'string' ? JSON.parse(cf.options) : cf.options,
      displayOrder: cf.display_order,
    }));

    // FAQs
    const faqRes = await db.query(
      `SELECT * FROM event_faqs WHERE event_id = $1 OR event_id IS NULL ORDER BY display_order ASC`,
      [ev.id]
    );
    const faqs = faqRes.rows.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      displayOrder: f.display_order,
    }));

    // Sponsors
    const spRes = await db.query(
      `SELECT * FROM sponsors WHERE is_active = true ORDER BY display_order ASC`
    );
    const sponsors = spRes.rows.map((s) => ({
      id: s.id,
      name: s.name,
      logoUrl: s.logo_url,
      website: s.website,
    }));

    res.json({
      event: {
        id: ev.id,
        slug: ev.slug,
        eventNumber: ev.event_number,
        title: ev.title,
        subtitle: ev.subtitle,
        dateStr: ev.date_str,
        startTime: ev.start_time,
        endTime: ev.end_time,
        venue: ev.venue,
        address: ev.address,
        city: ev.city,
        description: ev.description,
        about: ev.about,
        highlights: typeof ev.highlights === 'string' ? JSON.parse(ev.highlights) : ev.highlights,
        activities: typeof ev.activities === 'string' ? JSON.parse(ev.activities) : ev.activities,
        rules: typeof ev.rules === 'string' ? JSON.parse(ev.rules) : ev.rules,
        whatsIncluded: typeof ev.whats_included === 'string' ? JSON.parse(ev.whats_included) : ev.whats_included,
        whoShouldJoin: ev.who_should_join,
        totalCapacity: ev.total_capacity,
        registeredCount,
        remainingSpots,
        status: isSoldOut ? 'SOLD_OUT' : ev.status,
        heroImage: ev.hero_image,
        gallery: typeof ev.gallery === 'string' ? JSON.parse(ev.gallery) : ev.gallery,
        videoUrl: ev.video_url,
        mapEmbedUrl: ev.map_embed_url,
        ticketTypes,
        customFields,
        faqs,
        sponsors,
      },
    });
  } catch (err: any) {
    console.error('Error fetching event by slug:', err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Admin: Create Event (Supports White-Label and Future Events like BAWAL #002)
eventsRouter.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      title,
      eventNumber,
      slug,
      subtitle,
      dateStr,
      startTime,
      endTime,
      venue,
      address,
      city,
      description,
      about,
      highlights,
      activities,
      rules,
      whatsIncluded,
      whoShouldJoin,
      totalCapacity,
      heroImage,
      gallery,
      ticketTypes,
    } = req.body;

    const db = await getDbClient();
    const id = `ev_${crypto.randomBytes(6).toString('hex')}`;
    const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    await db.query(
      `INSERT INTO events (
        id, slug, event_number, title, subtitle, date_str, start_time, end_time,
        venue, address, city, description, about, highlights, activities, rules,
        whats_included, who_should_join, total_capacity, status, hero_image, gallery
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, 'PUBLISHED', $20, $21
      )`,
      [
        id,
        generatedSlug,
        eventNumber || 'BAWAL Experience',
        title,
        subtitle || '',
        dateStr,
        startTime,
        endTime,
        venue,
        address,
        city || 'New Delhi',
        description,
        about || description,
        JSON.stringify(highlights || []),
        JSON.stringify(activities || []),
        JSON.stringify(rules || []),
        JSON.stringify(whatsIncluded || []),
        whoShouldJoin || 'Everyone looking for vibrant social connection.',
        parseInt(totalCapacity || '100', 10),
        heroImage || 'https://images.unsplash.com/photo-1545809074-59472b3f5ecc?auto=format&fit=crop&w=1600&q=80',
        JSON.stringify(gallery || []),
      ]
    );

    // Create ticket tiers if provided
    if (Array.isArray(ticketTypes) && ticketTypes.length > 0) {
      for (let i = 0; i < ticketTypes.length; i++) {
        const tt = ticketTypes[i];
        await db.query(
          `INSERT INTO ticket_types (id, event_id, name, price, total_available, perks, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            `tt_${crypto.randomBytes(6).toString('hex')}`,
            id,
            tt.name,
            tt.price,
            tt.totalAvailable,
            JSON.stringify(tt.perks || []),
            i + 1,
          ]
        );
      }
    }

    res.json({ success: true, id, slug: generatedSlug });
  } catch (err: any) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: err.message || 'Failed to create event' });
  }
});

// Admin: Update Event
eventsRouter.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const db = await getDbClient();

    await db.query(
      `UPDATE events SET
        title = COALESCE($1, title),
        event_number = COALESCE($2, event_number),
        date_str = COALESCE($3, date_str),
        start_time = COALESCE($4, start_time),
        end_time = COALESCE($5, end_time),
        venue = COALESCE($6, venue),
        address = COALESCE($7, address),
        total_capacity = COALESCE($8, total_capacity),
        status = COALESCE($9, status),
        description = COALESCE($10, description),
        about = COALESCE($11, about),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $12`,
      [
        body.title,
        body.eventNumber,
        body.dateStr,
        body.startTime,
        body.endTime,
        body.venue,
        body.address,
        body.totalCapacity ? parseInt(body.totalCapacity, 10) : null,
        body.status,
        body.description,
        body.about,
        id,
      ]
    );

    res.json({ success: true, message: 'Event updated successfully.' });
  } catch (err: any) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: err.message || 'Failed to update event' });
  }
});
