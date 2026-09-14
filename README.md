<div align="center">

# mail-relay

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18-blue)]()
[![TypeScript](https://img.shields.io/badge/built_with-TypeScript-3178C6)]()

**Multi-client SMTP relay for web contact forms. One service, unlimited projects.**

</div>


---

<p align="center">🌐 <strong>Also available in:</strong> <a href="README.es.md">Spanish</a></p>

---
## Features

- **Multi-client** — Handle contact forms from multiple websites with a single service
- **YAML configuration** — Add a new client by copying one block
- **Secure SMTP** — Supports SSL/TLS (port 465) and STARTTLS (port 587)
- **PostgreSQL persistence** — Every submission is recorded with date, client, status, and error details
- **Telegram notifications** — Get detailed alerts when a form is submitted, error reports on failures, and periodic service status every 2 hours
- **Custom HTML templates** — Per-client email templates with variable injection
- **Production ready** — Includes a systemd service unit for automated deployment

---

## Quick start

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL (running and accessible)

### Installation

```bash
git clone https://github.com/x0-jonatanfp/mail-relay.git
cd mail-relay
pnpm install
```

### Configuration

Start by copying the example files:

```bash
cp clients.example.yaml clients.yaml
cp .env.example .env
```

Edit `clients.yaml` with your SMTP credentials:

```yaml
clients:
  - id: my-client
    name: My Client
    domains:
      - myclient.com
    smtp:
      host: smtp.myclient.com
      port: 587
      secure: false
      user: forms@myclient.com
      pass: "your-password"
    from:
      name: My Client
      email: no-reply@myclient.com
    to: info@myclient.com
    template: default
```

Create the database and configure `.env`:

```bash
createdb mailrelay
```

Then set your environment variables:

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 4001) |
| `BIND` | Bind address (`127.0.0.1` or `0.0.0.0`) |
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token |
| `TELEGRAM_CHAT_ID` | Chat or group ID for notifications |
| `DATABASE_URL` | PostgreSQL connection string (`postgresql://user:pass@host:5432/mailrelay`) |

> **Note:** `clients.yaml` and `.env` are in `.gitignore` to prevent accidental commits of sensitive data.

The required database table is created automatically — or manually with:

```sql
CREATE TABLE sent_emails (
  id         SERIAL PRIMARY KEY,
  date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_id  VARCHAR(100) NOT NULL,
  client_name VARCHAR(200) NOT NULL,
  to_email   VARCHAR(255) NOT NULL,
  subject    VARCHAR(255),
  status     VARCHAR(20) NOT NULL,
  error_msg  TEXT
);
```

---

## Usage

```bash
# Development
pnpm dev

# Production
pnpm build
pnpm serve
```

### API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Service health check |
| `POST` | `/api/send` | Submit a contact form |

### Sending a form

```bash
curl -X POST http://localhost:4001/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "my-client",
    "from_name": "John Doe",
    "from_email": "john@example.com",
    "message": "I would like more information about your products."
  }'
```

Response:

```json
{
  "success": true,
  "method": "smtp",
  "message": "Message sent successfully"
}
```

---

## Telegram notifications

**Form received:**

```
📬 Nuevo formulario · My Client
━━━━━━━━━━━━━━━━━━
👤 John Doe
📧 john@example.com
📞 +1 234 567 890
📝 Product inquiry
```

**Error on send:**

```
❌ Error · My Client
━━━━━━━━━━━━━━━━━━
⚠️  Connection refused
🔧 smtp.myclient.com:587
```

**Periodic status (every 2h):**

```
📊 mail-relay · Status 14:30
━━━━━━━━━━━━━━━━━━
👥 Clientes:     3 activos
📬 Envíos hoy:   8
📈 Total acum.:  340
⏱  Último envío: hace 2 min
━━━━━━━━━━━━━━━━━━
```

---

## Deployment

The service runs as a **system systemd unit** (`deploy/mail-relay.service`,
code in `/srv/services/mail-relay`). Build, sync and restart in one step:

```bash
make deploy
```

The unit gets the DB credentials from `~/.secrets` through
`~/.secrets/bin/run`, writes `/var/log/mail-relay.log` (rotated by logrotate)
and keeps the journal (`journalctl -u mail-relay`).

Manual install of the unit:

```bash
sudo cp deploy/mail-relay.service /etc/systemd/system/mail-relay.service
sudo systemctl daemon-reload
sudo systemctl enable --now mail-relay.service
```

---

## Project structure

```
mail-relay/
├── src/
│   ├── application/services/   # Business logic
│   ├── config/                 # YAML, env, and DB config loaders
│   ├── domain/                 # Entities and ports
│   ├── infrastructure/
│   │   ├── http/               # Express server
│   │   ├── smtp/               # Nodemailer adapter
│   │   ├── telegram/           # Telegram notifications
│   │   └── persistence/        # PostgreSQL relay-store
│   └── index.ts                # Entry point
├── templates/                  # HTML email templates
├── clients.example.yaml        # Client configuration template
├── .env.example                # Environment variables template
├── deploy/mail-relay.service   # systemd unit (system)
├── Makefile                    # build + deploy + restart
└── LICENSE                     # MIT License
```

---

## Technology stack

| Component | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express |
| Email | Nodemailer |
| Database | PostgreSQL |
| Configuration | js-yaml + dotenv |
| Notifications | Telegram Bot API |
| Init system | systemd |
