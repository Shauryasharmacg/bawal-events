BAWAL — Weekends Hit Different

A full-stack social entertainment and curated experience platform designed for modern weekend culture across Indian cities. Features automated ticket generation, transactional OTP auth, Neon PostgreSQL integration, and an isolated administrative control room.

Core Features

Curated Experiences: Dynamic discovery and booking system for IRL gatherings, bowling socials, and competitive weekend events.

Secured Admin Control Room: Dedicated administrative portal with PBKDF2 sha512 salted hashing, role enforcement (SUPER_ADMIN, ADMIN, STAFF), and session persistence.

Passwordless Auth Flow: Email OTP verification powered by Resend with sliding window rate limiting and secure UUID session handling.

Live Digital Passes: Instant QR ticket generation and pass storage linked directly to user profiles.

Serverless SQL Engine: High-performance queries with connection pooling powered by Neon PostgreSQL.

Tech Stack

Frontend: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons

Backend: Node.js, Express, TSX runtime

Database: PostgreSQL via Neon Serverless

Authentication: JWT, PBKDF2 Crypto Hashing, HttpOnly Cookies

Integrations: Resend (Transactional Mail), PayU (Payments)

Architecture Overview

bawal-events/
├── src/
│   ├── components/      (UI components: Navbar, Footer, Modals)
│   ├── pages/           (Client views: Landing, Experiences, Admin, Passes)
│   ├── lib/             (AuthContext, API utilities, state handlers)
│   └── server/
│       ├── routes/      (Express API routers: auth, booking, admin)
│       ├── auth.ts      (PBKDF2 hashing, OTP generation, JWT logic)
│       └── db.ts        (PostgreSQL connection pool handling)
├── schema.sql           (Production database schema)
├── server.ts            (Application server entrypoint)
└── vite.config.ts       (Frontend bundling config)

Quick Start

Clone and Install
git clone https://github.com/Shauryasharmacg/bawal-events.git
cd bawal-events
npm install

Environment Setup
Create a .env file in the project root:

NODE_ENV=development
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
JWT_SECRET=your_super_secret_jwt_key
ADMIN_DEFAULT_PASSWORD=your_admin_password
RESEND_API_KEY=re_your_resend_key

Database Initialization
psql $DATABASE_URL -f schema.sql

Run Locally
npm run dev

Security Highlights

Database credentials and secrets are excluded from source control via .gitignore.

Administrative endpoints strictly verify active account status and hashed cryptographic tokens on each request.

Plaintext credentials and client-side demo bypasses are completely eliminated in production builds.
