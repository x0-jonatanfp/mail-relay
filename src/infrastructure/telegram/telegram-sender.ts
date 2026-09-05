import type { ServiceStatus } from '../persistence/relay-store.js'

const GATEWAY_URL = process.env.TG_GATEWAY_URL || 'http://localhost:2025'

/** Resultado de la comprobación SMTP de un cliente (para el self-test). */
export interface SelfTestClientResult {
  client: string
  name: string
  smtp: string
  ok: boolean
  error?: string
}

/** Resumen completo del self-test (BD + clientes). */
export interface SelfTestSummary {
  dbOk: boolean
  dbError?: string
  clients: SelfTestClientResult[]
  durationMs: number
}

export class TelegramSender {
  private chatId: string

  constructor() {
    this.chatId = process.env.TELEGRAM_CHAT_ID || ''
  }

  private get url() {
    return `${GATEWAY_URL}/api/send`
  }

  private async send(text: string): Promise<void> {
    if (!this.chatId) {
      console.warn('[telegram] Chat ID no configurado')
      return
    }

    try {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: 'HTML',
        }),
      })

      if (!res.ok) {
        const body = await res.text()
        console.warn(`[telegram] Gateway error ${res.status}: ${body}`)
      }
    } catch (err) {
      console.warn('[telegram] Error de conexión con gateway:', err instanceof Error ? err.message : String(err))
    }
  }

  async sendFormNotification(clientName: string, todayCount: number, errorsToday: number): Promise<void> {
    const errors = errorsToday > 0 ? ` · ${errorsToday} ${errorsToday === 1 ? 'error' : 'errores'} hoy` : ''
    const text = `📬 <b>${escapeHtml(clientName)}</b> · formulario recibido · ${todayCount} hoy${errors}`
    await this.send(text)
  }

  async sendErrorNotification(clientName: string, error: string, host: string, port: number): Promise<void> {
    const text = `❌ <b>${escapeHtml(clientName)}</b> · no se pudo enviar el correo · ${escapeHtml(host)}:${port}`
    await this.send(text)
  }

  async sendServiceStatus(status: ServiceStatus): Promise<void> {
    const text = `📊 <b>mail-relay</b> · ${status.clientCount} clientes · ${status.todayCount} hoy · ${status.totalSent} en total`
    await this.send(text)
  }

  async sendSelfTestResult(summary: SelfTestSummary): Promise<void> {
    const allOk = summary.dbOk && summary.clients.length > 0 && summary.clients.every((c) => c.ok)
    const head = `${allOk ? '🟢' : '🔴'} <b>Self-test mail-relay</b> · ${allOk ? 'todo OK' : 'hay fallos'} · ${summary.durationMs} ms`

    const lines = summary.clients.map((c) => {
      const icon = c.ok ? '✅' : '❌'
      const detail = c.ok ? 'auth OK' : oneLine(c.error || 'error desconocido')
      return `${icon} ${escapeHtml(c.name)} · ${detail} · ${escapeHtml(c.smtp)}`
    })
    if (summary.clients.length === 0) {
      lines.push('⚠️ ningún cliente configurado/comprobado')
    }
    if (summary.dbError) {
      lines.push(`❌ PostgreSQL · ${oneLine(summary.dbError)}`)
    }

    const text = [head, `${summary.dbOk ? '✅' : '❌'} PostgreSQL`, ...lines].join('\n')
    await this.send(text)
  }
}

/** Normaliza un error a una sola línea (HTML-escapeada y truncada) para Telegram. */
function oneLine(str: string): string {
  return escapeHtml(str).replace(/\s+/g, ' ').trim().slice(0, 140)
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
