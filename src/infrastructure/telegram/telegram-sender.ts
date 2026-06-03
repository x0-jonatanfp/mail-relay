import { env } from '../../config/env.js'

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
  async send(text: string): Promise<void> {
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

  async sendFormNotification(clientName: string): Promise<void> {
    await this.send(`📬 Formulario procesado: ${clientName}`)
  }

  async sendServiceStatus(
    clientCount: number,
    memoryMB: string,
    sentCount: number,
    intervalHours: number,
  ): Promise<void> {
    await this.send(`✅ Service status: mail-relay — ${clientCount} clientes, ${memoryMB} MB, ${sentCount} envíos (últ. ${intervalHours}h)`)
  }
}
