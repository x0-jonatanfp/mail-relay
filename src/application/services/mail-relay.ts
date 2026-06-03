import type { MailSender } from '../../domain/ports/mail-sender.js'
import type { FormData, FormResult } from '../../domain/entities/form-data.js'
import type { ClientConfig } from '../../domain/entities/client-config.js'

/**
 * Servicio de aplicación: envía emails via SMTP.
 */
export class MailRelayService {
  /** Contador de envíos exitosos desde el último reseteo */
  sentCount = 0

  constructor(
    private readonly smtpSender: MailSender,
  ) {}

  async send(data: FormData, client: ClientConfig): Promise<FormResult> {
    const result = await this.smtpSender.send(data, client)
    if (result.success) {
      this.sentCount++
    }
    return result
  }

  resetSentCount(): void {
    this.sentCount = 0
  }
}
