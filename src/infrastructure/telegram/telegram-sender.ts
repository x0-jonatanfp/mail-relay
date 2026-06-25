import type { ServiceStatus } from '../persistence/relay-store.js'

const GATEWAY_URL = process.env.TG_GATEWAY_URL || 'http://localhost:2025'

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
    const text = `<b>✅ ${escapeHtml(clientName)}</b>

<pre>📬 ${todayCount} envíos hoy | ❌ ${errorsToday} errores</pre>`
    await this.send(text)
  }

  async sendErrorNotification(clientName: string, error: string, host: string, port: number): Promise<void> {
    const text = `<b>❌ Error en ${escapeHtml(clientName)}</b>

<pre>📬 ${escapeHtml(error)}</pre>

${escapeHtml(host)}:${port}`
    await this.send(text)
  }

  async sendServiceStatus(status: ServiceStatus, intervalHours: number): Promise<void> {
    const text = `<b>📊 mail-relay · ${status.clientCount} clientes</b>

<pre>📬 ${status.todayCount} hoy · ${status.totalSent} total</pre>`
    await this.send(text)
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
