import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { initDb } from './src/server/db.js';
import { seedDatabase } from './src/server/seed.js';
import { authRouter } from './src/server/routes/auth.js';
import { eventsRouter } from './src/server/routes/events.js';
import { registrationsRouter } from './src/server/routes/registrations.js';
import { ticketsRouter } from './src/server/routes/tickets.js';
import { adminRouter } from './src/server/routes/admin.js';
import { publicRouter } from './src/server/routes/public.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable trust proxy for Cloud Run and reverse proxy ingress
  app.set('trust proxy', true);

  // Middlewares
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Initialize Database and Seed Data
  try {
    await initDb();
    await seedDatabase();
  } catch (err) {
    console.error('[SERVER] Database initialization error:', err);
  }

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'BAWAL Event Experience Platform API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Endpoints FIRST
  app.use('/api/auth', authRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/registrations', registrationsRouter);
  app.use('/api/payments', registrationsRouter);
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/public', publicRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BAWAL] Full-stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[FATAL] Failed to start server:', err);
});
