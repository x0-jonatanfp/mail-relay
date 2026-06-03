<div align="center">

# mail-relay

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18-blue)]()
[![TypeScript](https://img.shields.io/badge/built_with-TypeScript-3178C6)]()

**Multi-client SMTP relay for web contact forms. One service, unlimited projects.**

</div>


---

🌐 **Also available in:** [Spanish](README.es.md)

---
## Features

- **Multi-client** — Handle contact forms from multiple websites with a single service
- **YAML configuration** — Add a new client by copying one block
- **Secure SMTP** — Supports SSL/TLS (port 465) and STARTTLS (port 587)
- **Telegram notifications** — Get alerts when a form is submitted and receive periodic service status updates
- **Zero extra dependencies** — Uses Node.js native `fetch` for Telegram, no additional libraries
- **Production ready** — Includes a systemd service unit for deployment

---

## Quick start

### Prerequisites

- Node.js 18+
- pnpm

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

Configure your environment variables:

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 4001) |
| `BIND` | Bind address (`127.0.0.1` or `0.0.0.0`) |
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token |
| `TELEGRAM_CHAT_ID` | Chat or group ID for notifications |

> **Note:** `clients.yaml` and `.env` are in `.gitignore` to prevent accidental commits of sensitive data.

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

## Deployment

### Automated (deploy.sh)

```bash
pnpm deploy
```

Installs to `/srv/services/mail-relay` by default. Override with environment variables:

```bash
SERVICE_DIR=/opt/mail-relay RUN_USER=www-data ./deploy.sh
```

### Manual setup

```bash
pnpm build
sudo mkdir -p /srv/services/mail-relay
sudo cp -r dist/ templates/ /srv/services/mail-relay/
sudo cp clients.example.yaml /srv/services/mail-relay/clients.yaml
sudo cp .env.example /srv/services/mail-relay/.env

# Install and configure systemd service
sudo cp mail-relay.service /etc/systemd/system/mail-relay.service
sudo systemctl daemon-reload

# Edit User, WorkingDirectory, and ExecStart to match your setup
sudo systemctl edit --full mail-relay.service

sudo systemctl enable --now mail-relay
```

> **Note:** `mail-relay.service` uses `__USER__` and `__SERVICE_DIR__` placeholders. `deploy.sh` replaces them automatically. For manual install, use `sed`:
>
> ```bash
> sed -e 's/__USER__/your-user/g' \
>     -e 's|__SERVICE_DIR__|/path/to/mail-relay|g' \
>     mail-relay.service | sudo tee /etc/systemd/system/mail-relay.service
> ```

---

## Project structure

```
mail-relay/
├── src/
│   ├── application/services/   # Business logic
│   ├── config/                 # YAML and env config loaders
│   ├── domain/                 # Entities and ports
│   ├── infrastructure/
│   │   ├── http/               # Express server
│   │   ├── smtp/               # Nodemailer adapter
│   │   └── telegram/           # Telegram notifications
│   └── index.ts                # Entry point
├── templates/                  # HTML email templates
├── clients.example.yaml        # Client configuration template
├── .env.example                # Environment variables template
├── deploy.sh                   # Deployment script
├── mail-relay.service          # systemd unit template
└── LICENSE                     # MIT License
```

---

## Technology stack

| Component | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express |
| Email | Nodemailer |
| Configuration | js-yaml + dotenv |
| Notifications | Telegram Bot API |
| Init system | systemd |
