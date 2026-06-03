#!/bin/bash
set -e

# =============================================================================
# Configuración — sobreescribe con variables de entorno si quieres personalizar
#   SERVICE_DIR=/opt/mail-relay ./deploy.sh
#   RUN_USER=www-data SERVICE_DIR=/var/www/mail-relay ./deploy.sh
# =============================================================================
SERVICE_DIR="${SERVICE_DIR:-/srv/services/mail-relay}"
RUN_USER="${RUN_USER:-$(whoami)}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

echo "=============================="
echo "  mail-relay — Deploy"
echo "=============================="

# 1. Compilar
echo ""
echo "📦 Compilando TypeScript..."
npm run build
echo ""

# 2. Crear directorio si no existe
echo "📁 Preparando $SERVICE_DIR..."
if [ ! -d "$SERVICE_DIR" ]; then
    sudo mkdir -p "$SERVICE_DIR"
    echo "   ✔ Directorio creado"
else
    echo "   ✔ Directorio existe"
fi

# 3. Copiar dist/
echo ""
echo "📋 Copiando archivos..."
sudo cp -r dist/ "$SERVICE_DIR/"

# 4. Copiar templates/
if [ -d "templates" ]; then
    sudo cp -r templates/ "$SERVICE_DIR/"
fi

# 5. Copiar clients.yaml (o el example si no existe)
if [ -f "clients.yaml" ]; then
    sudo cp clients.yaml "$SERVICE_DIR/"
    echo "   ✔ clients.yaml"
else
    echo "   ⚠  clients.yaml no encontrado, usando clients.example.yaml como base"
    sudo cp clients.example.yaml "$SERVICE_DIR/clients.yaml"
fi

# 6. Copiar .env si existe
if [ -f ".env" ]; then
    sudo cp .env "$SERVICE_DIR/"
    echo "   ✔ .env"
fi

# 6b. Copiar .env.example (referencia)
if [ -f ".env.example" ]; then
    sudo cp .env.example "$SERVICE_DIR/"
fi

# 7. Instalar dependencias de producción
echo ""
echo "📦 Instalando dependencias de producción..."
PNPM="$(which pnpm 2>/dev/null || command -v pnpm 2>/dev/null || echo '')"
if [ -z "$PNPM" ]; then
    echo "❌ pnpm no encontrado. Instálalo con: npm install -g pnpm"
    exit 1
fi
sudo cp package.json pnpm-lock.yaml "$SERVICE_DIR/"
cd "$SERVICE_DIR" && sudo "$PNPM" install --prod --frozen-lockfile 2>&1 | tail -5
cd "$SCRIPT_DIR"

# 8. Generar e instalar servicio systemd
echo ""
echo "🔧 Generando servicio systemd..."
sed -e "s/__USER__/$RUN_USER/g" \
    -e "s|__SERVICE_DIR__|$SERVICE_DIR|g" \
    mail-relay.service | sudo tee /etc/systemd/system/mail-relay.service > /dev/null
sudo systemctl daemon-reload
sudo systemctl enable mail-relay 2>/dev/null || true

# 9. Validar y reiniciar
echo ""
echo "🔄 Reiniciando servicio..."
if systemctl is-active --quiet mail-relay; then
    sudo systemctl restart mail-relay
else
    sudo systemctl start mail-relay
fi

sleep 1

echo ""
echo "=============================="
echo "  ✅ Deploy completado"
echo "=============================="
echo "  Directorio : $SERVICE_DIR"
echo "  Usuario    : $RUN_USER"
echo ""
sudo systemctl status mail-relay --no-pager 2>&1 | head -15
