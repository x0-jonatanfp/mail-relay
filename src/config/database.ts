import pg from 'pg'
import { env } from './env.js'

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
})

pool.on('error', (err) => {
  console.error('[db] Error inesperado en el pool:', err.message)
})

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params)
}

export async function closePool(): Promise<void> {
  await pool.end()
}
