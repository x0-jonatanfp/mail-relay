import { MailRelayService } from './application/services/mail-relay.js'
import { SmtpSender } from './infrastructure/smtp/smtp-sender.js'
import { createServer, startServer } from './infrastructure/http/server.js'
import { TelegramSender } from './infrastructure/telegram/telegram-sender.js'
import { loadClients } from './config/clients.js'
import { env } from './config/env.js'

const SERVICE_STATUS_INTERVAL_HOURS = 4

function main() {
  // 1. Cargar clientes
  const { map: clients, count: clientCount } = loadClients()

  // 2. Adaptador SMTP
  const smtpSender = new SmtpSender()

  // 3. Servicio de aplicación
  const mailRelay = new MailRelayService(smtpSender)

  // 4. Telegram
  const telegram = new TelegramSender()

  // 5. Servidor HTTP
  const app = createServer(mailRelay, clients, clientCount, telegram)
  startServer(app)

  // 6. Service status periódico (fire-and-forget)
  startServiceStatus(telegram, clientCount, mailRelay)

  console.log(`[mail-relay] 🚀 Listo en ${env.BIND}:${env.PORT}`)
  console.log(`[mail-relay] Clientes: ${[...clients.keys()].filter(k => !k.includes('.')).join(', ')}`)
  console.log(`[mail-relay] Service status cada ${SERVICE_STATUS_INTERVAL_HOURS}h`)
}

function startServiceStatus(telegram: TelegramSender, clientCount: number, mailRelay: MailRelayService): void {
  const intervalMs = SERVICE_STATUS_INTERVAL_HOURS * 60 * 60 * 1000

  const sendStatus = () => {
    const memMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1)
    const sent = mailRelay.sentCount
    telegram.sendServiceStatus(clientCount, memMB, sent, SERVICE_STATUS_INTERVAL_HOURS)
    mailRelay.resetSentCount()
  }

  // Primer envío a los 10 segundos de arrancar (para dar tiempo a que todo esté listo)
  setTimeout(() => {
    sendStatus()
    setInterval(sendStatus, intervalMs)
  }, 10_000)
}

main()
