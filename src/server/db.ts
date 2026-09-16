import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

let pgliteInstance: PGlite | null = null;
let pgPoolInstance: pg.Pool | null = null;
let isInitialized = false;

// Helper to sanitize connection URL for logging
function maskDatabaseUrl(url: string): string {
  try {
    return url.replace(/:([^:@]+)@/, ':****@');
  } catch {
    return '[CONFIGURED]';
  }
}

export function isExternalDb(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

export async function getDbClient() {
  if (process.env.DATABASE_URL) {
    if (!pgPoolInstance) {
      const dbUrl = process.env.DATABASE_URL.trim();
      const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
      const isSslDisabled = dbUrl.includes('sslmode=disable') || isLocal;

      console.log(`[DB] Connecting to external PostgreSQL database: ${maskDatabaseUrl(dbUrl)}`);

      pgPoolInstance = new pg.Pool({
        connectionString: dbUrl,
        ssl: isSslDisabled ? false : { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      pgPoolInstance.on('error', (err) => {
        console.error('[DB] Unexpected error on idle PostgreSQL pool client:', err.message);
      });
    }

    return {
      query: async (sql: string, params: any[] = []) => {
        return await pgPoolInstance!.query(sql, params);
      },
    };
  }

  // Use embedded persistent PGlite
  if (!pgliteInstance) {
    const dataDir = path.join(process.cwd(), 'data', 'bawal-pgdata');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    pgliteInstance = new PGlite(dataDir);
  }

  return {
    query: async (sql: string, params: any[] = []) => {
      const res = await pgliteInstance!.query(sql, params);
      return {
        rows: res.rows as any[],
        rowCount: res.affectedRows ?? res.rows.length,
      };
    },
  };
}

export async function initDb() {
  if (isInitialized) return;
  const client = await getDbClient();

  // Look for schema.sql at project root or src/server/schema.sql
  const candidatePaths = [
    path.join(process.cwd(), 'schema.sql'),
    path.join(process.cwd(), 'src', 'server', 'schema.sql'),
  ];

  let schemaSql = '';
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      schemaSql = fs.readFileSync(p, 'utf8');
      break;
    }
  }

  if (schemaSql) {
    // Execute SQL statements
    const statements = schemaSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      try {
        await client.query(stmt);
      } catch (err: any) {
        // Ignore duplicate table/index notices
        if (!err?.message?.includes('already exists')) {
          console.error('[DB Schema Notice]:', stmt.slice(0, 50), err?.message || err);
        }
      }
    }

    // Ensure PayU columns exist on payments table
    const payuMigrations = [
      'ALTER TABLE payments ADD COLUMN IF NOT EXISTS payu_txnid TEXT',
      'ALTER TABLE payments ADD COLUMN IF NOT EXISTS payu_mihpayid TEXT',
      'ALTER TABLE payments ADD COLUMN IF NOT EXISTS payu_hash TEXT',
      'ALTER TABLE payments ADD COLUMN IF NOT EXISTS payu_mode TEXT',
      'ALTER TABLE payments ADD COLUMN IF NOT EXISTS bank_ref_num TEXT',
      'ALTER TABLE payments ADD COLUMN IF NOT EXISTS raw_response JSONB',
    ];
    for (const migration of payuMigrations) {
      try {
        await client.query(migration);
      } catch {
        // column may already exist
      }
    }
  }

  isInitialized = true;
  if (process.env.DATABASE_URL) {
    console.log('[DB] External PostgreSQL database schema initialized successfully.');
  } else {
    console.log('[DB] Local embedded PostgreSQL database initialized successfully.');
  }
}

// Transaction wrapper with safe pool checkout and release
export async function withTransaction<T>(
  callback: (client: { query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount?: number }> }) => Promise<T>
): Promise<T> {
  if (process.env.DATABASE_URL) {
    await getDbClient(); // Ensure pgPoolInstance is created
    const poolClient = await pgPoolInstance!.connect();
    try {
      await poolClient.query('BEGIN');
      const result = await callback({
        query: async (sql: string, params: any[] = []) => {
          return await poolClient.query(sql, params);
        },
      });
      await poolClient.query('COMMIT');
      return result;
    } catch (err) {
      await poolClient.query('ROLLBACK');
      throw err;
    } finally {
      poolClient.release();
    }
  }

  // PGlite fallback
  const client = await getDbClient();
  await client.query('BEGIN');
  try {
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

