import express, { type Express } from 'express'
import type { MailRelayService } from '../../application/services/mail-relay.js'
import type { FormData } from '../../domain/entities/form-data.js'
import type { ClientConfig } from '../../domain/entities/client-config.js'
import { env } from '../../config/env.js'
import { findClient } from '../../config/clients.js'
import { getServiceStatus, pingDatabase } from '../persistence/relay-store.js'
import type { TelegramSender, SelfTestClientResult } from '../telegram/telegram-sender.js'

export function createServer(
  mailRelay: MailRelayService,
  clients: Map<string, ClientConfig>,
  clientCount: number,
  telegram: TelegramSender,
): express.Express {
  const app = express()

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Liveness en la raíz, sin tocar la BD ni Telegram: responde mientras el
  // proceso esté en pie. El detalle con clientes está en /api/health.
  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'mail-relay', uptime: process.uptime() })
  })

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

      // Enviar por SMTP + registrar en BD
      const result = await mailRelay.send(formData, client)

      // Notificar a Telegram (fire-and-forget)
      getServiceStatus(clientCount).then(async (status) => {
        if (result.success) {
          await telegram.sendFormNotification(client.name, status.todayCount, status.errorsToday)
        } else {
          await telegram.sendErrorNotification(client.name, result.error || 'Error desconocido', client.smtp.host, client.smtp.port)
        }
      }).catch(() => {})

      res.json({
        success: result.success,
        method: result.method,
        message: result.message,
      })
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

  // Self-test periódico: comprueba BD + SMTP de cada cliente SIN enviar correos.
  // Uso: GET /api/selftest?secret=...  (opcional: &client=gmcshocks para uno solo)
  app.get('/api/selftest', async (req, res) => {
    const started = Date.now()
    try {
      const secret = typeof req.query.secret === 'string' ? req.query.secret : ''
      if (!env.SELF_TEST_SECRET) {
        res.status(503).json({ success: false, message: 'Self-test desactivado: falta SELF_TEST_SECRET en .env' })
        return
      }
      if (secret !== env.SELF_TEST_SECRET) {
        res.status(403).json({ success: false, message: 'Secreto inválido' })
        return
      }

      // 1) PostgreSQL responde
      let dbOk = false
      let dbError: string | undefined
      try {
        await pingDatabase()
        dbOk = true
      } catch (error) {
        dbError = error instanceof Error ? error.message : String(error)
      }

      // 2) Clientes a comprobar: todos por defecto, o uno concreto con ?client=
      const only = typeof req.query.client === 'string' ? req.query.client.trim() : ''
      const ids = only
        ? (clients.has(only) ? [only] : [])
        : [...clients.keys()].filter((k) => !k.includes('.')) // claves sin dominio = ids de cliente

      const results: SelfTestClientResult[] = []
      for (const id of ids) {
        const client = clients.get(id)
        if (!client) continue
        const check = await mailRelay.selfTestClient(client)
        results.push({
          client: client.id,
          name: client.name,
          smtp: `${client.smtp.host}:${client.smtp.port}`,
          ok: check.ok,
          error: check.error,
        })
      }

      const okAll = dbOk && results.length > 0 && results.every((r) => r.ok)

      // 3) Aviso por Telegram (fire-and-forget)
      telegram.sendSelfTestResult({
        dbOk,
        dbError,
        clients: results,
        durationMs: Date.now() - started,
      }).catch(() => {})

      res.status(okAll ? 200 : 500).json({
        success: okAll,
        date: new Date().toISOString(),
        durationMs: Date.now() - started,
        db: { ok: dbOk, error: dbError },
        clients: results,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[selftest] Error interno:', message)
      res.status(500).json({ success: false, message: 'Error interno del servidor', error: message })
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
