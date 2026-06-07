import express, { type Express } from 'express'
import type { MailRelayService } from '../../application/services/mail-relay.js'
import type { FormData } from '../../domain/entities/form-data.js'
import type { ClientConfig } from '../../domain/entities/client-config.js'
import { env } from '../../config/env.js'
import { findClient } from '../../config/clients.js'
import type { TelegramSender } from '../telegram/telegram-sender.js'

export function createServer(
  mailRelay: MailRelayService,
  clients: Map<string, ClientConfig>,
  clientCount: number,
  telegram: TelegramSender,
): express.Express {
  const app = express()

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'mail-relay',
      clients: clientCount,
    })
  })

  // Envío de formularios
  app.post('/api/send', async (req, res) => {
    try {
      const body = req.body as Record<string, string>

      // Campos obligatorios
      const missing: string[] = []
      if (!body.client_id) missing.push('client_id')
      if (!body.from_name) missing.push('from_name')
      if (!body.from_email) missing.push('from_email')
      if (!body.message) missing.push('message')

      if (missing.length > 0) {
        res.status(400).json({
          success: false,
          message: `Faltan campos obligatorios: ${missing.join(', ')}`,
        })
        return
      }

      // Buscar cliente por ID
      const client = findClient(clients, body.client_id!)
      if (!client) {
        res.status(404).json({
          success: false,
          message: `Cliente no encontrado: ${body.client_id}`,
        })
        return
      }

      // Construir formData
      const standard = new Set([
        'client_id', 'to', 'from_name', 'from_email',
        'phone', 'subject', 'message',
      ])
      const extra: Record<string, string> = {}
      for (const [key, val] of Object.entries(body)) {
        if (!standard.has(key) && val) extra[key] = val
      }

      const formData: FormData = {
        client_id: body.client_id!,
        to: body.to || client.to,
        from_name: body.from_name!,
        from_email: body.from_email!,
        phone: body.phone || undefined,
        subject: body.subject || 'Consulta general',
        message: body.message!,
        extra: Object.keys(extra).length > 0 ? extra : undefined,
      }

      const result = await mailRelay.send(formData, client)

      // Notificar a Telegram (fire-and-forget)
      if (result.success) {
        telegram.sendFormNotification(
          client.name,
          formData.from_name,
          formData.from_email,
          formData.phone,
          formData.subject,
        ).catch(() => {})
      } else {
        telegram.sendErrorNotification(
          client.name,
          result.error || 'Error desconocido',
          client.smtp.host,
          client.smtp.port,
        ).catch(() => {})
      }

      res.status(result.success ? 200 : 502).json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[http] Error interno:', message)
      res.status(500).json({
        success: false,
        method: 'none',
        message: 'Error interno del servidor',
        error: message,
      })
    }
  })

  return app
}

export function startServer(app: ReturnType<typeof createServer>) {
  return new Promise<void>((resolve, reject) => {
    app.listen(env.PORT, env.BIND, () => {
      console.log(`[mail-relay] Servidor escuchando en ${env.BIND}:${env.PORT}`)
      resolve()
    })
  })
}
