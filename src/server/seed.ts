import { getDbClient } from './db.js';
import { hashPassword } from './auth.js';
import crypto from 'node:crypto';

export async function seedDatabase() {
  const db = await getDbClient();

  const heroImageUrl = 'https://cdn.district.in/assets/events/publisher/event_gallery/01KTKV2BHFYR016Z0YQM5A6RF0.jpg';

  const highlights = [
    '🎳 Team Bowling Championship',
    '🏆 Prizes for the winning team',
    '🔥 Special Bawal Challenges',
    '🎁 Prizes for selected challenges',
    '⚡ Special Animated Nitro Bowling Experience',
    '🎶 Live Music',
    '🎸 Live Guitarist & Singers',
    '🍹 1 Free Mocktail for Every Participant',
    '🤝 Socialising & Networking',
  ];

  const activities = [
    'Team Formation & Icebreakers',
    'Championship Tournament Bowling',
    'Animated Nitro Glow Bowling Round',
    'Special Bawal Skill & Speed Challenges',
    'Live Acoustic Music & Social Hour',
    'Prize Distribution & Champion Crowning',
  ];

  const rules = [
    'Please arrive 15 minutes before the 11:00 AM start time for team assignments.',
    'Bowling shoes will be provided at the venue (socks are mandatory).',
    'Open to all age groups! Valid photo ID is required at the entry check-in counter.',
    'Respect other participants and maintain good sportsmanship.',
    'Outside food or beverages are strictly not permitted.',
  ];

  const whatsIncluded = [
    'Entry to The Bowling Social',
    'Participation in the Bowling Championship',
    'Animated Nitro Bowling Experience',
    'Access to all Special Bawal Challenges',
    'Live music performances',
    '1 free mocktail',
    'Chance to win prizes',
    'Socialising and networking',
  ];

  const faqs = [
    {
      q: 'Can I come solo?',
      a: 'Absolutely! More than 60% of our attendees come solo. We design teams and icebreaker challenges specifically so you meet awesome new people naturally without awkwardness.',
    },
    {
      q: 'What if I have never bowled before?',
      a: 'All skill levels are warmly welcome! The team scoring format ensures that excitement, teamwork, and laughter matter just as much as strikes. Plus, everyone gets to experience the fun Animated Nitro Bowling round.',
    },
    {
      q: 'What is included with my pass?',
      a: 'Your pass includes complete event entry, team championship rounds, Nitro bowling games, live musical performances by acoustic artists, special challenges, and 1 complimentary crafted mocktail.',
    },
    {
      q: 'Is there an age limit?',
      a: 'No, this event is open to all age groups! Bring along a valid photo ID for quick check-in at the desk.',
    },
    {
      q: 'What is the refund and transfer policy?',
      a: 'Tickets are non-refundable. However, you can transfer your ticket to a friend up to 24 hours prior to the event by contacting our support team at @bawal.social.',
    },
    {
      q: 'What shoes do I need to wear?',
      a: 'Standard bowling shoes are provided free of cost at the alley. Please remember to wear or carry a pair of clean socks!',
    },
  ];

  // Check if Event #001 already exists
  const existingEvent = await db.query(`SELECT id FROM events WHERE slug = $1`, ['bawal-001-the-bowling-social']);
  if (existingEvent.rows.length > 0) {
    console.log('[SEED] Event #001 already exists. Updating ticket prices to ₹599 & ₹699, removing age limits, and setting hero image CDN...');
    await db.query(
      `UPDATE events 
       SET hero_image = $1, rules = $2 
       WHERE slug = $3`,
      [heroImageUrl, JSON.stringify(rules), 'bawal-001-the-bowling-social']
    );
    await db.query(`UPDATE ticket_types SET price = 599 WHERE id = 'tt_early_bird_001'`);
    await db.query(`UPDATE ticket_types SET price = 699 WHERE id = 'tt_regular_001'`);

    // Refresh FAQs for existing event
    await db.query(`DELETE FROM event_faqs WHERE event_id = 'ev_bawal_001_bowling'`);
    for (let i = 0; i < faqs.length; i++) {
      await db.query(
        `INSERT INTO event_faqs (id, event_id, question, answer, display_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [crypto.randomUUID(), 'ev_bawal_001_bowling', faqs[i].q, faqs[i].a, i + 1]
      );
    }

    console.log('[SEED] Age restriction removed, FAQs refreshed, and prices/CDN image updated successfully!');
    return;
  }

  console.log('[SEED] Seeding BAWAL Event #001 and initial data...');

  const eventId = 'ev_bawal_001_bowling';
  const eventSlug = 'bawal-001-the-bowling-social';

  const gallery = [
    'https://images.unsplash.com/photo-1545809074-59472b3f5ecc?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
  ];

  await db.query(
    `INSERT INTO events (
      id, slug, event_number, title, subtitle, date_str, start_time, end_time,
      venue, address, city, description, about, highlights, activities, rules,
      whats_included, who_should_join, total_capacity, status, hero_image, gallery,
      map_embed_url, is_active
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13, $14, $15, $16,
      $17, $18, $19, $20, $21, $22,
      $23, true
    )`,
    [
      eventId,
      eventSlug,
      'BAWAL #001',
      'The Bowling Social',
      'Bowling + Social Experience + Live Music + Nitro Glow',
      '11/10/26',
      '11:00 AM',
      '2:00 PM',
      'Dave & Buster’s Pacific Mall',
      'Pacific Mall, Tagore Garden, Najafgarh Rd, New Delhi, Delhi 110027',
      'New Delhi',
      'A high-energy social entertainment event focused on team bowling, special nitro challenges, live acoustic music, and meeting new people.',
      'The Bowling Social is a social entertainment event focused on bowling, special challenges, music and meeting new people. It’s a place where people can come with friends or come solo, participate in activities, compete in the bowling championship, experience Nitro Bowling, enjoy live music and socialise with new people.',
      JSON.stringify(highlights),
      JSON.stringify(activities),
      JSON.stringify(rules),
      JSON.stringify(whatsIncluded),
      'Anyone who wants to meet new people, enjoy music, play bowling, take part in challenges and experience a different kind of social event. You can come with your friends or join individually and meet new people at the event.',
      100,
      'PUBLISHED',
      heroImageUrl,
      JSON.stringify(gallery),
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.9961601053424!2d77.10842067640236!3d28.63220557566415!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d0322303530c3%3A0x628045610b271d43!2sPacific%20Mall%20Tagore%20Garden!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
    ]
  );

  // Ticket types: Early Bird Pass (20 passes @ ₹599), Regular Pass (80 passes @ ₹699)
  await db.query(
    `INSERT INTO ticket_types (id, event_id, name, price, total_available, sold_count, perks, sort_order, is_active)
     VALUES 
     ($1, $2, 'Early Bird Pass', 599, 20, 0, $3, 1, true),
     ($4, $2, 'Regular Pass', 699, 80, 0, $5, 2, true)`,
    [
      'tt_early_bird_001',
      eventId,
      JSON.stringify([
        'Early Bird discounted entry',
        'Full Bowling Championship Participation',
        'Animated Nitro Bowling Experience',
        '1 Free Craft Mocktail',
        'Live Music & Special Challenges',
      ]),
      'tt_regular_001',
      JSON.stringify([
        'Full Event Entry',
        'Bowling Championship Participation',
        'Animated Nitro Bowling Experience',
        '1 Free Craft Mocktail',
        'Live Music & Special Challenges',
      ]),
    ]
  );

  // Custom Fields for registration
  await db.query(
    `INSERT INTO custom_fields (id, event_id, field_label, field_name, field_type, placeholder, required, options, display_order)
     VALUES 
     ($1, $2, 'Instagram Username', 'instagram', 'text', '@yourhandle', false, '[]'::jsonb, 1),
     ($3, $2, 'Bowling Experience Level', 'bowling_level', 'dropdown', 'Select level', true, $4, 2),
     ($5, $2, 'Are you coming solo or in a group?', 'attendance_type', 'radio', '', true, $6, 3)`,
    [
      'cf_001_insta',
      eventId,
      'cf_001_level',
      JSON.stringify(['First Timer / Total Beginner', 'Casual Bowler (Played a few times)', 'Championship Material (Pro bowler)']),
      'cf_001_type',
      JSON.stringify(['Solo (Place me in a fun team!)', 'With Friends (We want to bowl together)']),
    ]
  );

  for (let i = 0; i < faqs.length; i++) {
    await db.query(
      `INSERT INTO event_faqs (id, event_id, question, answer, display_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [crypto.randomUUID(), eventId, faqs[i].q, faqs[i].a, i + 1]
    );
  }

  // Sponsors
  const sponsors = [
    {
      name: "Dave & Buster's",
      logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=200&h=200&q=80',
      site: 'https://daveandbusters.com',
    },
    {
      name: 'Red Bull India',
      logo: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=200&h=200&q=80',
      site: 'https://redbull.in',
    },
    {
      name: 'Monster Energy',
      logo: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=200&h=200&q=80',
      site: 'https://monsterenergy.com',
    },
  ];

  for (let i = 0; i < sponsors.length; i++) {
    await db.query(
      `INSERT INTO sponsors (id, name, logo_url, website, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [crypto.randomUUID(), sponsors[i].name, sponsors[i].logo, sponsors[i].site, i + 1]
    );
  }

  // Default Admin User: admin@bawal.social / Bawaln@2026
  const adminEmail = 'admin@bawal.social';
  const adminPass = process.env.ADMIN_DEFAULT_PASSWORD || 'Bawal@2026';
  const hashedPass = hashPassword(adminPass);

  await db.query(
    `INSERT INTO admin_users (id, email, password_hash, name, role, is_active)
     VALUES ($1, $2, $3, $4, 'SUPER_ADMIN', true)
     ON CONFLICT (email) DO NOTHING`,
    [crypto.randomUUID(), adminEmail, hashedPass, 'BAWAL HQ Super Admin']
  );

  console.log(`[SEED] Admin created: ${adminEmail} (password configured). Event #001 ready!`);
}