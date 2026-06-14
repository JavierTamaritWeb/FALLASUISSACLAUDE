#!/usr/bin/env bash
#
# deploy.sh — Deploy rápido de fallasuissa.es a Hostinger vía SSH.
#
# Construye el sitio (npm run build) y sincroniza dist/ con la raíz web del
# servidor usando rsync sobre SSH. Deja el servidor idéntico a dist/ (espejo).
#
# Uso:
#   tools/deploy.sh [opciones]
#
# Opciones:
#   --dry-run            Ensayo: muestra qué haría rsync SIN tocar el servidor.
#   --skip-build         Salta "npm run build" (sube el dist/ actual tal cual).
#   -y, --yes            No pide confirmación antes de sincronizar (--delete borra
#                        archivos huérfanos en producción; úsalo con cabeza).
#   --maintenance on     Activa el modo mantenimiento (sube el centinela .maintenance:
#                        el sitio devuelve 503 a todos menos a la IP del equipo).
#   --maintenance off    Desactiva el modo mantenimiento (borra el centinela).
#   -h, --help           Muestra esta ayuda.
#
# Nota: --maintenance NO construye ni sincroniza; solo enciende/apaga el centinela
# por SSH y verifica el resultado. El bloque que lo aplica vive en .htaccess.
#
# Variables de entorno (override opcional):
#   SSH_USER SSH_HOST SSH_PORT REMOTE_DIR LOCAL_DIR ASSUME_YES
#
# Autenticación: Hostinger usa contraseña SSH por defecto, así que ssh/rsync
# la pedirán. Para deploy sin prompts, configura una clave una sola vez:
#   ssh-copy-id -p 65002 REDACTED_USER@REDACTED_HOST

set -euo pipefail

# --- Configuración ----------------------------------------------------------
SSH_USER="${SSH_USER:-REDACTED_USER}"
SSH_HOST="${SSH_HOST:-REDACTED_HOST}"
SSH_PORT="${SSH_PORT:-65002}"
# Ruta relativa a $HOME del usuario SSH (raíz web del dominio en Hostinger).
REMOTE_DIR="${REMOTE_DIR:-domains/fallasuissa.es/public_html}"
LOCAL_DIR="${LOCAL_DIR:-dist}"
SITE_URL="https://fallasuissa.es"

# --- Localización del repo --------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# --- Colores / helpers ------------------------------------------------------
if [[ -t 1 ]]; then
  C_OK=$'\033[0;32m'; C_ERR=$'\033[0;31m'; C_INFO=$'\033[0;36m'; C_RST=$'\033[0m'
else
  C_OK=""; C_ERR=""; C_INFO=""; C_RST=""
fi
info()  { printf '%s==>%s %s\n' "$C_INFO" "$C_RST" "$*"; }
ok()    { printf '%s✓%s %s\n'  "$C_OK"   "$C_RST" "$*"; }
fail()  { printf '%s✗ %s%s\n'  "$C_ERR" "$*" "$C_RST" >&2; }
die()   { fail "$*"; exit 1; }

# Imprime el encabezado: líneas de comentario tras el shebang, hasta la primera no-comentario.
usage() { awk 'NR==1{next} /^#/{sub(/^# ?/,""); print; next} {exit}' "${BASH_SOURCE[0]}"; exit 0; }

# --- Parseo de flags --------------------------------------------------------
DRY_RUN=0
SKIP_BUILD=0
ASSUME_YES="${ASSUME_YES:-0}"
MAINTENANCE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)    DRY_RUN=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
    -y|--yes)     ASSUME_YES=1 ;;
    --maintenance)
      shift
      MAINTENANCE="${1:-}"
      [[ "$MAINTENANCE" == "on" || "$MAINTENANCE" == "off" ]] || die "Uso: --maintenance on|off"
      ;;
    -h|--help)    usage ;;
    *) die "Opción desconocida: $1 (usa --help)" ;;
  esac
  shift
done

SSH_CMD="ssh -p $SSH_PORT"
MAINT_FILE="$REMOTE_DIR/.maintenance"

# --- Modo mantenimiento (cortocircuita: no construye ni sincroniza) ---------
if [[ -n "$MAINTENANCE" ]]; then
  if [[ "$MAINTENANCE" == "on" ]]; then
    info "Activando modo mantenimiento (centinela .maintenance)…"
    $SSH_CMD "$SSH_USER@$SSH_HOST" "touch '$MAINT_FILE'" || die "No se pudo crear el centinela por SSH."
  else
    info "Desactivando modo mantenimiento (borrando centinela)…"
    $SSH_CMD "$SSH_USER@$SSH_HOST" "rm -f '$MAINT_FILE'" || die "No se pudo borrar el centinela por SSH."
  fi
  info "Verificando $SITE_URL …"
  code="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 20 "$SITE_URL" || echo "000")"
  if [[ "$MAINTENANCE" == "on" ]]; then
    case "$code" in
      503) ok "Mantenimiento ACTIVO — el sitio responde 503 para los visitantes." ;;
      200) ok "Mantenimiento ACTIVO (centinela creado)."
           info "Tu IP está en el bypass del .htaccess, por eso ves 200 desde aquí; el resto de visitantes recibe 503."
           info "Para confirmar el 503 real, abre $SITE_URL desde otra red (p. ej. el móvil con datos)." ;;
      *)   fail "Centinela creado, pero el sitio devolvió HTTP $code (esperado 503/200; revisa el .htaccess)." ;;
    esac
  else
    [[ "$code" == "200" ]] \
      && ok "Mantenimiento DESACTIVADO — el sitio responde 200." \
      || fail "Centinela borrado, pero el sitio devolvió HTTP $code (esperado 200; revisa manualmente)."
  fi
  exit 0
fi

# --- 1. Build ---------------------------------------------------------------
if [[ "$SKIP_BUILD" -eq 1 ]]; then
  info "Saltando build (--skip-build)."
else
  info "Construyendo el sitio (npm run build)…"
  ( cd "$REPO_ROOT" && npm run build )
  ok "Build completado."
fi

[[ -d "$REPO_ROOT/$LOCAL_DIR" ]] || die "No existe $LOCAL_DIR/ — ejecuta sin --skip-build."
[[ -f "$REPO_ROOT/$LOCAL_DIR/index.html" ]] || die "$LOCAL_DIR/index.html no encontrado — ¿build incompleto?"

# --- 2. Comprobación previa SSH ---------------------------------------------
info "Comprobando conexión SSH y rsync remoto…"
if ! $SSH_CMD "$SSH_USER@$SSH_HOST" "command -v rsync >/dev/null 2>&1 && mkdir -p '$REMOTE_DIR'"; then
  die "Fallo SSH: o no hay conexión, o el servidor no tiene rsync, o no se pudo crear $REMOTE_DIR."
fi
ok "Servidor accesible y rsync disponible. Destino: $REMOTE_DIR/"

# --- 3. Confirmación (--delete borra en producción) -------------------------
if [[ "$DRY_RUN" -eq 0 && "$ASSUME_YES" -eq 0 ]]; then
  printf '%s\n' "Vas a sincronizar (espejo con --delete):"
  printf '   local : %s\n' "$REPO_ROOT/$LOCAL_DIR/"
  printf '   remoto: %s@%s:%s/  (puerto %s)\n' "$SSH_USER" "$SSH_HOST" "$REMOTE_DIR" "$SSH_PORT"
  printf '   %s⚠ se borrarán en el servidor los archivos que no estén en %s/%s\n' "$C_ERR" "$LOCAL_DIR" "$C_RST"
  read -r -p "¿Continuar? [s/N] " resp
  [[ "$resp" =~ ^[sSyY]$ ]] || die "Cancelado por el usuario."
fi

# --- 4. Sincronización rsync ------------------------------------------------
# --exclude='.maintenance': el centinela del modo mantenimiento vive en el
# servidor (no en dist/); sin esta exclusión, --delete lo borraría y un deploy
# normal durante el mantenimiento apagaría el 503 sin querer.
RSYNC_FLAGS=(-avz --delete --exclude='.DS_Store' --exclude='.maintenance')
[[ "$DRY_RUN" -eq 1 ]] && { RSYNC_FLAGS+=(-n); info "DRY-RUN: no se modificará el servidor."; }

info "Sincronizando con rsync…"
rsync "${RSYNC_FLAGS[@]}" \
  -e "$SSH_CMD" \
  "$REPO_ROOT/$LOCAL_DIR/" \
  "$SSH_USER@$SSH_HOST:$REMOTE_DIR/"

if [[ "$DRY_RUN" -eq 1 ]]; then
  ok "Dry-run terminado (no se subió nada). Revisa la lista de cambios arriba."
  exit 0
fi
ok "Archivos sincronizados."

# --- 5. Verificación post-deploy --------------------------------------------
info "Verificando $SITE_URL …"
code="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 20 "$SITE_URL" || echo "000")"
if [[ "$code" == "200" ]]; then
  ok "Deploy correcto — $SITE_URL responde 200."
else
  fail "Deploy subido, pero $SITE_URL devolvió HTTP $code (revisa manualmente)."
  exit 1
fi
