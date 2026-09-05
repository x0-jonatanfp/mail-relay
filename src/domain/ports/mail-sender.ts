import type { FormData, FormResult } from '../entities/form-data.js'
import type { ClientConfig } from '../entities/client-config.js'

/** Resultado de una comprobación de conexión SMTP (verify). */
export interface SmtpVerifyResult {
  ok: boolean
  error?: string
}

/** Puerto: cualquier adaptador de envio debe implementar esta interfaz */
export interface MailSender {
  send(data: FormData, client: ClientConfig): Promise<FormResult>
  /**
   * Comprueba conexión TCP + TLS + autenticación contra el SMTP del cliente.
   * NO envía ningún mensaje (solo EHLO + AUTH y cierra).
   */
  verify(client: ClientConfig): Promise<SmtpVerifyResult>
}
