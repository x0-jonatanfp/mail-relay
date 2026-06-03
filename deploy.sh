#!/bin/bash
set -e

SERVICE_DIR="/srv/services/mail-relay"
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
    echo "   ⚠  clients.yaml no encontrado, usando clients.example.yaml"
    sudo cp clients.example.yaml "$SERVICE_DIR/clients.yaml"
fi

# 6. Copiar .env si existe
if [ -f ".env" ]; then
    sudo cp .env "$SERVICE_DIR/"
    echo "   ✔ .env"
fi

# 7. Instalar dependencias de producción
echo ""
echo "📦 Instalando dependencias de producción..."
PNPM="$(which pnpm 2>/dev/null || echo /home/cultofskaro/.local/share/pnpm/pnpm)"
sudo cp package.json pnpm-lock.yaml "$SERVICE_DIR/"
cd "$SERVICE_DIR" && sudo "$PNPM" install --prod --frozen-lockfile 2>&1 | tail -5
cd "$SCRIPT_DIR"

# 8. Actualizar e instalar servicio systemd
echo ""
echo "🔧 Actualizando servicio systemd..."
sudo cp mail-relay.service /etc/systemd/system/mail-relay.service
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
sudo systemctl status mail-relay --no-pager 2>&1 | head -15
