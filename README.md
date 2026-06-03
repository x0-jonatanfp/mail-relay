# mail-relay

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Relay SMTP multi-cliente para formularios de contacto web. Un solo servicio, múltiples proyectos, zero complicación.

---

## ✨ Características

- **Multi-cliente** — Un solo servicio maneja formularios de todos tus sitios web
- **Configuración YAML** — Añadir un nuevo cliente es copiar y pegar un bloque
- **SMTP seguro** — Soporta SSL/TLS (465) y STARTTLS (587)
- **Notificaciones Telegram** — Te avisa al recibir un formulario y te manda el estado del servicio cada 4h
- **Sin dependencias extra** — Usa `fetch` nativo de Node, nada de librerías raras
- **Listo para producción** — Service unit systemd incluido

---

## 🧱 Stack

| Componente | Tecnología |
|------------|------------|
| Runtime | Node.js 18+ |
| Framework | Express |
| Email | Nodemailer |
| Config | js-yaml + dotenv |
| Notificaciones | Telegram Bot API (fetch nativo) |
| Init | systemd |

---

## ⚙️ Configuración rápida

### 1. Clonar e instalar

```bash
git clone https://github.com/x0-jonatanfp/mail-relay.git
cd mail-relay
pnpm install
```

### 2. Configurar clientes

```bash
cp clients.example.yaml clients.yaml
```

Edita `clients.yaml` con los datos de tus clientes:

```yaml
clients:
  - id: mi-cliente
    name: Mi Cliente
    domains:
      - micliente.com
    smtp:
      host: smtp.micliente.com
      port: 587
      secure: false
      user: formularios@micliente.com
      pass: "tu-contraseña"
    from:
      name: Mi Cliente
      email: no-reply@micliente.com
    to: info@micliente.com
    template: default
```

### 3. Variables de entorno

```bash
cp .env.example .env
```

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (4001) |
| `BIND` | IP de escucha (`127.0.0.1` o `0.0.0.0`) |
| `TELEGRAM_BOT_TOKEN` | Token de tu bot de Telegram |
| `TELEGRAM_CHAT_ID` | ID del chat/grupo para notificaciones |

---

## 🚀 Uso

```bash
# Desarrollo
pnpm dev

# Producción
pnpm build
pnpm serve
```

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/health` | Health check del servicio |
| `POST` | `/api/send` | Enviar un formulario |

### Ejemplo de envío

```bash
curl -X POST http://localhost:4001/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "mi-cliente",
    "from_name": "Juan Pérez",
    "from_email": "juan@example.com",
    "message": "Quiero información sobre sus productos"
  }'
```

Respuesta:

```json
{
  "success": true,
  "method": "smtp",
  "message": "Mensaje enviado correctamente"
}
```

---

## 🏠 Despliegue

### Automático (deploy.sh)

```bash
pnpm deploy
```

Por defecto instala en `/srv/services/mail-relay` con tu usuario actual. Puedes personalizar:

```bash
SERVICE_DIR=/opt/mail-relay RUN_USER=www-data ./deploy.sh
```

### Manual

```bash
pnpm build
sudo mkdir -p /srv/services/mail-relay
sudo cp -r dist/ templates/ /srv/services/mail-relay/
sudo cp clients.example.yaml /srv/services/mail-relay/clients.yaml
sudo cp .env.example /srv/services/mail-relay/.env
```

Luego configura el servicio systemd:

```bash
sudo cp mail-relay.service /etc/systemd/system/mail-relay.service
sudo systemctl daemon-reload

# Edita User, WorkingDirectory y ExecStart con tus datos
sudo systemctl edit --full mail-relay.service

sudo systemctl enable --now mail-relay
```

> **Nota:** El archivo `mail-relay.service` usa los placeholders `__USER__` y `__SERVICE_DIR__`.
> `deploy.sh` los reemplaza automáticamente. Si instalas a mano, hazlo con `sed`:
> ```bash
> sed -e 's/__USER__/midusuario/g' \
>     -e 's|__SERVICE_DIR__|/ruta/a/mail-relay|g' \
>     mail-relay.service | sudo tee /etc/systemd/system/mail-relay.service
> ```

---

## 📁 Estructura

```
mail-relay/
├── src/
│   ├── application/services/   # Lógica de negocio
│   ├── config/                 # Carga de YAML y env vars
│   ├── domain/                 # Entidades y puertos
│   ├── infrastructure/
│   │   ├── http/               # Servidor Express
│   │   ├── smtp/               # Adaptador Nodemailer
│   │   └── telegram/           # Notificaciones Telegram
│   └── index.ts                # Punto de entrada
├── templates/                  # Plantillas HTML por cliente
├── clients.example.yaml        # Template de configuración
├── .env.example                # Template de variables de entorno
├── deploy.sh                   # Script de deploy
├── mail-relay.service          # Template systemd
└── LICENSE
```

---

## 📄 Licencia

MIT — ver [LICENSE](LICENSE) para más detalles.

---

Hecho con ❤️ para no tener que gestionar 20 formularios de contacto manualmente.
