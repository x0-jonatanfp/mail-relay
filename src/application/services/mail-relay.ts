import type { MailSender } from '../../domain/ports/mail-sender.js'
import type { FormData, FormResult } from '../../domain/entities/form-data.js'
import type { ClientConfig } from '../../domain/entities/client-config.js'
import { recordSent } from '../../infrastructure/persistence/relay-store.js'

/**
 * Servicio de aplicación: envía emails via SMTP y persiste cada intento.
 */
export class MailRelayService {
  /** Contador de envíos exitosos desde el último reseteo (solo para status) */
  sentCount = 0

  constructor(
    private readonly smtpSender: MailSender,
  ) {}

  async send(data: FormData, client: ClientConfig): Promise<FormResult> {
    const result = await this.smtpSender.send(data, client)

    // Persistir en PostgreSQL
    await recordSent({
      clientId: client.id,
      clientName: client.name,
      toEmail: data.to || client.to,
      subject: data.subject,
      status: result.success ? 'success' : 'error',
      errorMsg: result.error,
    })

    if (result.success) {
      this.sentCount++
    }

    return result
  }

  resetSentCount(): void {
    this.sentCount = 0
  }
}
