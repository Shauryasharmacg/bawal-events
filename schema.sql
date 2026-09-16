-- PostgreSQL Production Schema for BAWAL Event Platform
-- Compatible with all hosted PostgreSQL providers (Supabase, Neon, AWS RDS, GCP Cloud SQL, Render, Railway, etc.)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  mobile TEXT UNIQUE,
  email TEXT UNIQUE,
  name TEXT,
  age INTEGER,
  gender TEXT,
  instagram TEXT,
  role TEXT NOT NULL DEFAULT 'USER', -- USER, STAFF, ADMIN, SUPER_ADMIN
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_verifications (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL, -- mobile or email
  hashed_otp TEXT NOT NULL,
  salt TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_identifier ON otp_verifications(identifier);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  event_number TEXT NOT NULL, -- e.g. "BAWAL #001"
  title TEXT NOT NULL,
  subtitle TEXT,
  date_str TEXT NOT NULL, -- "11/10/26"
  start_time TEXT NOT NULL, -- "11:00 AM"
  end_time TEXT NOT NULL, -- "2:00 PM"
  venue TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'New Delhi',
  description TEXT NOT NULL,
  about TEXT NOT NULL,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  activities JSONB NOT NULL DEFAULT '[]'::jsonb,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  whats_included JSONB NOT NULL DEFAULT '[]'::jsonb,
  who_should_join TEXT NOT NULL,
  total_capacity INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'PUBLISHED', -- DRAFT, PUBLISHED, SOLD_OUT, COMPLETED, CANCELLED
  hero_image TEXT NOT NULL,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_url TEXT,
  map_embed_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

CREATE TABLE IF NOT EXISTS ticket_types (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Early Bird Pass", "Regular Pass"
  price NUMERIC(10, 2) NOT NULL,
  total_available INTEGER NOT NULL,
  sold_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  perks JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON ticket_types(event_id);

CREATE TABLE IF NOT EXISTS custom_fields (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  field_label TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  placeholder TEXT,
  required BOOLEAN NOT NULL DEFAULT false,
  options JSONB DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  registration_id TEXT UNIQUE NOT NULL, -- e.g. "BW00101"
  user_id TEXT NOT NULL REFERENCES users(id),
  event_id TEXT NOT NULL REFERENCES events(id),
  ticket_type_id TEXT NOT NULL REFERENCES ticket_types(id),
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, CANCELLED, REFUNDED
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_phone TEXT NOT NULL,
  attendee_age INTEGER,
  attendee_gender TEXT,
  attendee_instagram TEXT,
  custom_answers JSONB DEFAULT '{}'::jsonb,
  amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_registrations_reg_id ON registrations(registration_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED, REFUNDED
  payu_txnid TEXT,
  payu_mihpayid TEXT,
  payu_hash TEXT,
  payu_mode TEXT,
  payment_method TEXT,
  error_description TEXT,
  bank_ref_num TEXT,
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_registration ON payments(registration_id);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  ticket_id TEXT UNIQUE NOT NULL, -- Unique secure ID / UUID
  registration_id TEXT UNIQUE NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'CONFIRMED', -- CONFIRMED, USED, CANCELLED
  qr_token TEXT UNIQUE NOT NULL,
  qr_data_url TEXT NOT NULL,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_in_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_token ON tickets(qr_token);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);

CREATE TABLE IF NOT EXISTS sponsors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_faqs (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'ADMIN', -- SUPER_ADMIN, ADMIN, STAFF
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  recipient TEXT NOT NULL,
  channel TEXT NOT NULL, -- EMAIL, SMS, WHATSAPP
  template TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'SENT', -- SENT, FAILED, SIMULATED
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
