import pg from 'pg'
import { env } from './env.js'
import { logger } from '../infrastructure/logging/Logger.js'

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
})

pool.on('error', (err) => {
  logger.error('[db] Error inesperado en el pool', { error: err.message })
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
