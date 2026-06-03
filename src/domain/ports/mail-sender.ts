import type { FormData, FormResult } from '../entities/form-data.js'
import type { ClientConfig } from '../entities/client-config.js'

/** Puerto: cualquier adaptador de envio debe implementar esta interfaz */
export interface MailSender {
  send(data: FormData, client: ClientConfig): Promise<FormResult>
}
