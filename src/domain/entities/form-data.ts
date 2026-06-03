export interface FormData {
  /** ID del cliente (ej: "gmcshocks") */
  client_id: string
  /** Email del destinatario (opcional, sobreescribe el del cliente si se pasa) */
  to?: string
  /** Nombre de quien rellena */
  from_name: string
  /** Email de quien rellena */
  from_email: string
  /** Teléfono */
  phone?: string
  /** Asunto / producto */
  subject: string
  /** Mensaje */
  message: string
  /** Campos adicionales */
  extra?: Record<string, string>
}

export interface FormResult {
  success: boolean
  method: 'smtp' | 'none'
  message: string
  error?: string
}
