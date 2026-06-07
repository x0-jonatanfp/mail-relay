import { env } from '../../config/env.js'
import type { ServiceStatus } from '../persistence/relay-store.js'

const TELEGRAM_API = 'https://api.telegram.org/bot'

export class TelegramSender {
  private token: string
  private chatId: string

  constructor() {
    this.token = env.TELEGRAM_BOT_TOKEN
    this.chatId = env.TELEGRAM_CHAT_ID
  }

  private get url() {
    return `${TELEGRAM_API}${this.token}/sendMessage`
  }

  /**
   * Envía un mensaje de texto al chat de Telegram.
   * Fire-and-forget: no lanza errores al caller.
   */
  private async send(text: string): Promise<void> {
    if (!this.token || !this.chatId) {
      console.warn('[telegram] Token o Chat ID no configurados')
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
        console.warn(`[telegram] Error ${res.status}: ${body}`)
      }
    } catch (err) {
      console.warn('[telegram] Error de conexión:', err instanceof Error ? err.message : String(err))
    }
  }

  async sendFormNotification(clientName: string, fromName: string, fromEmail: string, phone: string | undefined, subject: string): Promise<void> {
    const lines = [
      `📬 <b>Nuevo formulario · ${escapeHtml(clientName)}</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👤 ${escapeHtml(fromName)}`,
      `📧 ${escapeHtml(fromEmail)}`,
    ]
    if (phone) lines.push(`📞 ${escapeHtml(phone)}`)
    lines.push(`📝 ${escapeHtml(subject)}`)

    await this.send(lines.join('\n'))
  }

  async sendErrorNotification(clientName: string, error: string, host: string, port: number): Promise<void> {
    await this.send(
      `❌ <b>Error · ${escapeHtml(clientName)}</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `⚠️  ${escapeHtml(error)}\n` +
      `🔧 ${escapeHtml(host)}:${port}`,
    )
  }

  async sendServiceStatus(status: ServiceStatus, intervalHours: number): Promise<void> {
    const now = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const errorLine = status.errorsToday > 0
      ? `\n❌ Fallos hoy: ${status.errorsToday}`
      : ''

    await this.send(
      `📊 <b>mail-relay · Status ${now}</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👥 Clientes:     ${status.clientCount} activos\n` +
      `📬 Envíos hoy:   ${status.todayCount}\n` +
      `📈 Total acum.:  ${status.totalSent}\n` +
      `⏱  Último envío: ${status.lastSentAgo}` +
      `${errorLine}\n` +
      `━━━━━━━━━━━━━━━━━━`,
    )
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
