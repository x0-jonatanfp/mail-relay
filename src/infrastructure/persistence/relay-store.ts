import { query } from '../../config/database.js'

export interface SentEntry {
  clientId: string
  clientName: string
  toEmail: string
  subject: string
  status: 'success' | 'error'
  errorMsg?: string
}

export interface ServiceStatus {
  clientCount: number
  todayCount: number
  totalSent: number
  lastSentDate: string | null
  lastSentAgo: string
  errorsToday: number
}

/**
 * Guarda un registro de envío en PostgreSQL.
 */
export async function recordSent(entry: SentEntry): Promise<void> {
  await query(
    `INSERT INTO sent_emails (client_id, client_name, to_email, subject, status, error_msg)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [entry.clientId, entry.clientName, entry.toEmail, entry.subject, entry.status, entry.errorMsg ?? null],
  )
}

/**
 * Obtiene estadísticas para el mensaje de status.
 */
export async function getServiceStatus(clientCount: number): Promise<ServiceStatus> {
  const today = await query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM sent_emails WHERE date >= CURRENT_DATE AND status = 'success'",
  )
  const total = await query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM sent_emails WHERE status = 'success'",
  )
  const last = await query<{ date: string | null }>(
    'SELECT TO_CHAR(date, \'YYYY-MM-DD HH24:MI:SS\') AS date FROM sent_emails WHERE status = \'success\' ORDER BY date DESC LIMIT 1',
  )
  const errors = await query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM sent_emails WHERE date >= CURRENT_DATE AND status = 'error'",
  )

  const lastDate = last.rows[0]?.date ?? null
  const lastAgo = lastDate ? timeAgo(lastDate) : '—'

  return {
    clientCount,
    todayCount: Number(today.rows[0]?.count ?? 0),
    totalSent: Number(total.rows[0]?.count ?? 0),
    lastSentDate: lastDate,
    lastSentAgo: lastAgo,
    errorsToday: Number(errors.rows[0]?.count ?? 0),
  }
}

function timeAgo(iso: string): string {
  const then = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - then.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}
