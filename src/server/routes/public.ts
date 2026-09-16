import { Router, Request, Response } from 'express';
import { getDbClient } from '../db.js';

export const publicRouter = Router();

publicRouter.get('/sponsors', async (req: Request, res: Response) => {
  try {
    const db = await getDbClient();
    const sponsorsRes = await db.query(
      `SELECT id, name, logo_url, website FROM sponsors WHERE is_active = true ORDER BY display_order ASC`
    );
    res.json({ sponsors: sponsorsRes.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch sponsors' });
  }
});

publicRouter.get('/faqs', async (req: Request, res: Response) => {
  try {
    const db = await getDbClient();
    const faqsRes = await db.query(
      `SELECT id, question, answer, event_id FROM event_faqs ORDER BY display_order ASC`
    );
    res.json({ faqs: faqsRes.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// Platform config / branding info for white-label support
publicRouter.get('/config', (req: Request, res: Response) => {
  res.json({
    brandName: 'BAWAL',
    tagline: 'Weekends Hit Different.',
    instagram: '@bawal.social',
    supportEmail: 'tickets@bawal.social',
    phone: '+91 98710 00000',
    currency: 'INR',
    currencySymbol: '₹',
  });
});
