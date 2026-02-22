#!/bin/bash
# =============================================================================
# OdontoPacientes - Script de Deploy a Producción
# =============================================================================
# Uso: ./deploy.sh [opciones]
#
# Opciones:
#   --all         Deploy completo (backend + web-admin)
#   --backend     Solo actualizar backend (git pull + composer)
#   --web-admin   Solo rebuildar y subir web-admin
#   --db-sync     Sincronizar base de datos local → producción
#   --ssh         Abrir sesión SSH al servidor
#
# Sin opciones: equivale a --all
# =============================================================================

set -e

# Configuración del servidor
SERVER_IP="200.58.105.211"
SERVER_PORT="5221"
SERVER_USER="root"
SERVER_PASS='S(2XZCwMnmYZIs'
REMOTE_PATH="/home/codexpy/odontopacientes"
PUBLIC_PATH="/home/codexpy/public_html/odontopacientes"
PHP="/opt/php8-3/bin/php-cli"

# Configuración local
LOCAL_PATH="$(cd "$(dirname "$0")" && pwd)"
WEB_ADMIN_PATH="$LOCAL_PATH/web-admin"
PRODUCTION_API_URL="https://codexpy.com/odontopacientes/api"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Función para ejecutar comandos SSH
ssh_exec() {
    sshpass -p "$SERVER_PASS" ssh -p$SERVER_PORT -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$1"
}

# Verificar que sshpass está instalado
check_deps() {
    if ! command -v sshpass &> /dev/null; then
        log_error "sshpass no está instalado. Instalar con: brew install hudochenkov/sshpass/sshpass"
        exit 1
    fi
}

# ---- DEPLOY BACKEND ----
deploy_backend() {
    log_info "=== Desplegando Backend ==="

    # 1. Git push local
    log_info "Haciendo git push..."
    cd "$LOCAL_PATH"
    git add -A
    if git diff --cached --quiet; then
        log_warn "No hay cambios para commitear"
    else
        read -p "Mensaje del commit: " COMMIT_MSG
        git commit -m "${COMMIT_MSG:-Update}"
        git push origin main
        log_ok "Push completado"
    fi

    # 2. Git pull en servidor
    log_info "Haciendo git pull en servidor..."
    ssh_exec "cd $REMOTE_PATH && git pull origin main"
    log_ok "Git pull completado"

    # 3. Composer install si cambió composer.json
    log_info "Verificando dependencias composer..."
    ssh_exec "cd $REMOTE_PATH/backend && $PHP /usr/local/bin/composer install --no-dev --optimize-autoloader --no-interaction --no-scripts 2>&1"
    log_ok "Dependencias actualizadas"

    # 4. Migraciones
    log_info "Ejecutando migraciones..."
    ssh_exec "cd $REMOTE_PATH/backend && $PHP artisan migrate --force 2>&1"
    log_ok "Migraciones ejecutadas"

    # 5. Limpiar caché
    log_info "Limpiando caché..."
    ssh_exec "cd $REMOTE_PATH/backend && $PHP artisan config:clear && $PHP artisan route:clear && $PHP artisan view:clear 2>&1"
    log_ok "Caché limpiada"

    # 6. Permisos
    ssh_exec "chown -R codexpy:codexpy $REMOTE_PATH"

    log_ok "=== Backend desplegado exitosamente ==="
}

# ---- DEPLOY WEB ADMIN ----
deploy_web_admin() {
    log_info "=== Desplegando Web Admin ==="

    # 1. Build con API de producción
    log_info "Construyendo web-admin..."
    cd "$WEB_ADMIN_PATH"
    VITE_API_URL=$PRODUCTION_API_URL npm run build
    log_ok "Build completado"

    # 2. Subir al servidor
    log_info "Subiendo archivos al servidor..."
    sshpass -p "$SERVER_PASS" rsync -avz --delete \
        -e "ssh -p$SERVER_PORT -o StrictHostKeyChecking=no" \
        "$WEB_ADMIN_PATH/dist/" \
        "$SERVER_USER@$SERVER_IP:$PUBLIC_PATH/web-admin/"
    log_ok "Archivos subidos"

    # 3. Restaurar .htaccess para SPA routing
    ssh_exec "cat > $PUBLIC_PATH/web-admin/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /odontopacientes/web-admin/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /odontopacientes/web-admin/index.html [L]
</IfModule>
EOF
chown codexpy:codexpy $PUBLIC_PATH/web-admin/.htaccess"
    log_ok "SPA routing configurado"

    log_ok "=== Web Admin desplegado exitosamente ==="
}

# ---- SYNC DATABASE ----
sync_database() {
    log_info "=== Sincronizando Base de Datos ==="
    log_warn "Esto reemplazará TODA la base de datos en producción con la local"
    read -p "¿Estás seguro? (s/N): " CONFIRM
    if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
        log_warn "Cancelado"
        return
    fi

    # 1. Exportar local
    log_info "Exportando base de datos local..."
    mysqldump -u root odontopacientes --no-tablespaces > /tmp/odonto_deploy_dump.sql
    log_ok "Exportación completada"

    # 2. Subir al servidor
    log_info "Subiendo dump al servidor..."
    sshpass -p "$SERVER_PASS" scp -P$SERVER_PORT -o StrictHostKeyChecking=no \
        /tmp/odonto_deploy_dump.sql \
        "$SERVER_USER@$SERVER_IP:/tmp/odonto_deploy_dump.sql"
    log_ok "Dump subido"

    # 3. Importar en producción
    log_info "Importando en producción..."
    ssh_exec "mysql -u codexpy_odonto -p'Z4u*91y0fL' codexpy_odonto < /tmp/odonto_deploy_dump.sql && rm /tmp/odonto_deploy_dump.sql"
    rm /tmp/odonto_deploy_dump.sql
    log_ok "Base de datos sincronizada"

    log_ok "=== Sincronización de BD completada ==="
}

# ---- OPEN SSH ----
open_ssh() {
    log_info "Conectando al servidor..."
    sshpass -p "$SERVER_PASS" ssh -p$SERVER_PORT -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP
}

# ---- TEST PRODUCCIÓN ----
test_production() {
    log_info "=== Verificando producción ==="

    log_info "Probando API..."
    HEALTH=$(ssh_exec "curl -s http://127.0.0.1/odontopacientes/api/health -H 'Host: codexpy.com'" 2>/dev/null)
    if echo "$HEALTH" | grep -q '"status":"OK"'; then
        log_ok "API: $HEALTH"
    else
        log_error "API no responde correctamente: $HEALTH"
    fi

    log_info "Probando Web Admin..."
    WEB=$(ssh_exec "curl -s http://127.0.0.1/odontopacientes/web-admin/ -H 'Host: codexpy.com'" 2>/dev/null | head -1)
    if echo "$WEB" | grep -q 'doctype'; then
        log_ok "Web Admin: OK"
    else
        log_error "Web Admin no responde correctamente"
    fi

    log_ok "=== Verificación completada ==="
}

# ---- MAIN ----
check_deps

case "${1:-}" in
    --backend)
        deploy_backend
        test_production
        ;;
    --web-admin)
        deploy_web_admin
        test_production
        ;;
    --db-sync)
        sync_database
        ;;
    --ssh)
        open_ssh
        ;;
    --test)
        test_production
        ;;
    --all|"")
        deploy_backend
        deploy_web_admin
        test_production
        ;;
    *)
        echo "Uso: $0 [--all|--backend|--web-admin|--db-sync|--ssh|--test]"
        exit 1
        ;;
esac
