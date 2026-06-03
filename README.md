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

```bash
pnpm deploy
```

O manualmente:

```bash
pnpm build
sudo cp -r dist/ /srv/services/mail-relay/
sudo systemctl restart mail-relay
```

## Licencia

MIT
