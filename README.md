# mail-relay

Relay SMTP multi-cliente para formularios de contacto web. Reutilizable para múltiples proyectos con configuración YAML.

## Características

- **Multi-cliente**: un solo servicio maneja formularios de varios sitios web
- **Configuración YAML**: fácil de mantener, solo añadir un bloque por cliente
- **SMTP seguro**: soporta SSL/TLS (puerto 465) y STARTTLS (puerto 587)
- **Notificaciones Telegram**: alertas al recibir formularios y estado del servicio cada 4h
- **Sin dependencias extra**: usa `fetch` nativo de Node para Telegram
- **Listo para systemd**: service unit incluido para despliegue en producción

## Requisitos

- Node.js 18+
- pnpm
- Un servidor SMTP saliente (por cliente)

## Instalación

```bash
pnpm install
```

## Configuración

### Variables de entorno (`.env`)

```env
PORT=4001
BIND=127.0.0.1
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

### Clientes (`clients.yaml`)

```yaml
clients:
  - id: mi-cliente
    name: Mi Cliente
    domains:
      - micliente.com
      - www.micliente.com
    smtp:
      host: smtp.micliente.com
      port: 587
      secure: false
      user: formularios@micliente.com
      pass: contraseña
    from:
      name: Mi Cliente
      email: formularios@micliente.com
    to: info@micliente.com
    template: default
```

## Uso

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
| `POST` | `/api/send` | Enviar formulario |

### Ejemplo de envío

```bash
curl -X POST http://localhost:4001/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "mi-cliente",
    "from_name": "Juan Pérez",
    "from_email": "juan@example.com",
    "message": "Consulta sobre productos"
  }'
```

## Despliegue

### Rápido (usando deploy.sh)

```bash
pnpm deploy
```

Por defecto instala en `/srv/services/mail-relay` con tu usuario actual. Puedes personalizar:

```bash
# Cambiar ruta y usuario
SERVICE_DIR=/opt/mail-relay RUN_USER=www-data ./deploy.sh
```

### Manual

```bash
pnpm build

# Crear directorio
sudo mkdir -p /srv/services/mail-relay

# Copiar archivos
sudo cp -r dist/ templates/ /srv/services/mail-relay/
sudo cp clients.example.yaml /srv/services/mail-relay/clients.yaml
sudo cp .env.example /srv/services/mail-relay/.env  # y editar con tus credenciales

# Editar servicio systemd
sudo cp mail-relay.service /etc/systemd/system/mail-relay.service
sudo systemctl daemon-reload

# Antes de arrancar, edita el service unit:
sudo systemctl edit --full mail-relay.service
#   - Cambia User por el usuario que ejecutará el proceso
#   - Ajusta WorkingDirectory y ExecStart a tu ruta

sudo systemctl enable --now mail-relay
```

> **Nota:** `mail-relay.service` usa los placeholders `__USER__` y `__SERVICE_DIR__`.
> `deploy.sh` los reemplaza automáticamente. Si instalas a mano, sustitúyelos
> por los valores de tu sistema o usa `sed`:
> ```bash
> sed -e 's/__USER__/midusuario/g' -e 's|__SERVICE_DIR__|/ruta/a/mail-relay|g' mail-relay.service | sudo tee /etc/systemd/system/mail-relay.service

## Variables de entorno

Copia `.env.example` como `.env` y rellena tus datos:

```bash
cp .env.example .env
```

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (4001) |
| `BIND` | IP de escucha (`127.0.0.1` para local, `0.0.0.0` para público) |
| `TELEGRAM_BOT_TOKEN` | Token de tu bot de Telegram (dejar vacío si no usas notificaciones) |
| `TELEGRAM_CHAT_ID` | ID del chat/grupo para las notificaciones |

## Licencia

MIT — ver [LICENSE](LICENSE)
