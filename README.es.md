<div align="center">

# mail-relay

[![MIT License](https://img.shields.io/badge/Licencia-MIT-green.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18-blue)]()
[![TypeScript](https://img.shields.io/badge/construido_con-TypeScript-3178C6)]()

**Relay SMTP multi-cliente para formularios de contacto web. Un servicio, proyectos ilimitados.**

</div>


---

🌐 **También disponible en:** [Inglés](README.md)

---
## Características

- **Multi-cliente** — Gestiona formularios de contacto de múltiples sitios web con un solo servicio
- **Configuración YAML** — Añade un nuevo cliente copiando un bloque
- **SMTP seguro** — Soporta SSL/TLS (puerto 465) y STARTTLS (puerto 587)
- **Notificaciones Telegram** — Recibe alertas cuando se envía un formulario y obtén actualizaciones periódicas del estado del servicio
- **Sin dependencias extra** — Usa `fetch` nativo de Node para Telegram, sin librerías adicionales
- **Listo para producción** — Incluye un unit de servicio systemd para despliegue

---

## Inicio rápido

### Requisitos previos

- Node.js 18+
- pnpm

### Instalación

```bash
git clone https://github.com/x0-jonatanfp/mail-relay.git
cd mail-relay
pnpm install
```

### Configuración

Comienza copiando los archivos de ejemplo:

```bash
cp clients.example.yaml clients.yaml
cp .env.example .env
```

Edita `clients.yaml` con tus credenciales SMTP:

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

Configura las variables de entorno:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (por defecto: 4001) |
| `BIND` | Dirección de escucha (`127.0.0.1` o `0.0.0.0`) |
| `TELEGRAM_BOT_TOKEN` | Token de tu bot de Telegram |
| `TELEGRAM_CHAT_ID` | ID del chat o grupo para notificaciones |

> **Nota:** `clients.yaml` y `.env` están en `.gitignore` para evitar commits accidentales de datos sensibles.

---

## Uso

```bash
# Desarrollo
pnpm dev

# Producción
pnpm build
pnpm serve
```

### Endpoints de la API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Health check del servicio |
| `POST` | `/api/send` | Enviar un formulario de contacto |

### Envío de un formulario

```bash
curl -X POST http://localhost:4001/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "mi-cliente",
    "from_name": "Juan Pérez",
    "from_email": "juan@example.com",
    "message": "Me gustaría recibir más información sobre sus productos."
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

## Despliegue

### Automático (deploy.sh)

```bash
pnpm deploy
```

Instala en `/srv/services/mail-relay` por defecto. Sobrescribe con variables de entorno:

```bash
SERVICE_DIR=/opt/mail-relay RUN_USER=www-data ./deploy.sh
```

### Instalación manual

```bash
pnpm build
sudo mkdir -p /srv/services/mail-relay
sudo cp -r dist/ templates/ /srv/services/mail-relay/
sudo cp clients.example.yaml /srv/services/mail-relay/clients.yaml
sudo cp .env.example /srv/services/mail-relay/.env

# Instalar y configurar el servicio systemd
sudo cp mail-relay.service /etc/systemd/system/mail-relay.service
sudo systemctl daemon-reload

# Edita User, WorkingDirectory y ExecStart según tu configuración
sudo systemctl edit --full mail-relay.service

sudo systemctl enable --now mail-relay
```

> **Nota:** `mail-relay.service` usa los placeholders `__USER__` y `__SERVICE_DIR__`. `deploy.sh` los reemplaza automáticamente. Para instalación manual, usa `sed`:
>
> ```bash
> sed -e 's/__USER__/tu-usuario/g' \
>     -e 's|__SERVICE_DIR__|/ruta/a/mail-relay|g' \
>     mail-relay.service | sudo tee /etc/systemd/system/mail-relay.service
> ```

---

## Estructura del proyecto

```
mail-relay/
├── src/
│   ├── application/services/   # Lógica de negocio
│   ├── config/                 # Cargadores de configuración YAML y env
│   ├── domain/                 # Entidades y puertos
│   ├── infrastructure/
│   │   ├── http/               # Servidor Express
│   │   ├── smtp/               # Adaptador Nodemailer
│   │   └── telegram/           # Notificaciones Telegram
│   └── index.ts                # Punto de entrada
├── templates/                  # Plantillas HTML de email
├── clients.example.yaml        # Plantilla de configuración de cliente
├── .env.example                # Plantilla de variables de entorno
├── deploy.sh                   # Script de despliegue
├── mail-relay.service          # Plantilla de unidad systemd
└── LICENSE                     # Licencia MIT
```

---

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express |
| Email | Nodemailer |
| Configuración | js-yaml + dotenv |
| Notificaciones | Telegram Bot API |
| Sistema de inicio | systemd |
