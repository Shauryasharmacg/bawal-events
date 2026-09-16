// Standalone Database Seeder for BAWAL Event Platform
// Can be executed via: `npm run db:seed` or `npx tsx seed.ts`
import 'dotenv/config';
import { initDb } from './src/server/db.js';
import { seedDatabase } from './src/server/seed.js';

async function runSeed() {
  console.log('[SEED CLI] Starting database initialization and seeding...');
  await initDb();
  await seedDatabase();
  console.log('[SEED CLI] Seeding completed successfully.');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('[SEED CLI] Error seeding database:', err);
  process.exit(1);
});
