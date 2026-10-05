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
#   --skip-verify        Salta la verificación SEO de producción (npm run seo:verify:production)
#                        que se ejecuta tras el deploy (v4.43.0).
#   --no-indexnow        No notifica a IndexNow las URL cambiadas tras el deploy (v4.43.0).
#   -y, --yes            No pide confirmación antes de sincronizar (--delete borra
#                        archivos huérfanos en producción; úsalo con cabeza).
#   --maintenance on     Activa el modo mantenimiento (sube el centinela .maintenance:
#                        el sitio devuelve 503 salvo a quien tenga el token de bypass).
#   --maintenance off    Desactiva el modo mantenimiento (borra el centinela).
#   -h, --help           Muestra esta ayuda.
#
# Nota: --maintenance NO construye ni sincroniza; solo enciende/apaga el centinela
# por SSH y verifica el resultado. El bloque que lo aplica vive en .htaccess.
#
# Configuración: los datos sensibles (SSH + token de mantenimiento) NO viven en
# este script. Se leen de tools/deploy.env (ignorado por git). Copia la plantilla
# tools/deploy.env.example a tools/deploy.env y rellénala. También se pueden pasar
# por variable de entorno: SSH_USER SSH_HOST SSH_PORT REMOTE_DIR LOCAL_DIR MAINT_TOKEN.
#
# Autenticación: configura una clave SSH una sola vez para deploy sin prompts:
#   ssh-copy-id -p "$SSH_PORT" "$SSH_USER@$SSH_HOST"

set -euo pipefail

# --- Localización del repo --------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# --- Config sensible desde tools/deploy.env (NO versionado) -----------------
# SSH_USER/HOST/etc. y el token de mantenimiento no se hardcodean en el repo:
# se leen de deploy.env (copia de deploy.env.example). Las var. de entorno ganan.
if [[ -f "$SCRIPT_DIR/deploy.env" ]]; then
  # Conservar los valores exportados por quien invoca el script.
  ENV_OVERRIDES=()
  for config_key in SSH_USER SSH_HOST SSH_PORT REMOTE_DIR LOCAL_DIR SITE_URL MAINT_TOKEN; do
    if printenv "$config_key" >/dev/null; then
      ENV_OVERRIDES+=("$config_key=${!config_key}")
    fi
  done
  set -a; . "$SCRIPT_DIR/deploy.env"; set +a
  # Bash 3.2 (macOS) trata un array vacío como no definido con set -u.
  if [[ ${#ENV_OVERRIDES[@]} -gt 0 ]]; then
    for config_entry in "${ENV_OVERRIDES[@]}"; do export "$config_entry"; done
  fi
  unset ENV_OVERRIDES config_key config_entry
fi

# --- Configuración ----------------------------------------------------------
SSH_USER="${SSH_USER:-}"                                   # obligatorio (deploy.env)
SSH_HOST="${SSH_HOST:-}"                                   # obligatorio (deploy.env)
SSH_PORT="${SSH_PORT:-65002}"
REMOTE_DIR="${REMOTE_DIR:-domains/fallasuissa.es/public_html}"
LOCAL_DIR="${LOCAL_DIR:-dist}"
SITE_URL="${SITE_URL:-https://fallasuissa.es}"
MAINT_TOKEN="${MAINT_TOKEN:-}"                             # token de bypass (deploy.env)

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

# No usar curl -f: HTTP 503 es precisamente el resultado válido en mantenimiento.
http_code() {
  local result
  if result="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$1")"; then
    printf '%s' "$result"
  else
    printf '000'
  fi
}

# Imprime el encabezado: líneas de comentario tras el shebang, hasta la primera no-comentario.
usage() { awk 'NR==1{next} /^#/{sub(/^# ?/,""); print; next} {exit}' "${BASH_SOURCE[0]}"; exit 0; }

# --- Parseo de flags --------------------------------------------------------
DRY_RUN=0
SKIP_BUILD=0
SKIP_VERIFY=0
NO_INDEXNOW=0
ASSUME_YES="${ASSUME_YES:-0}"
MAINTENANCE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)    DRY_RUN=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
    --skip-verify) SKIP_VERIFY=1 ;;
    --no-indexnow) NO_INDEXNOW=1 ;;
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

# --- Validación de config sensible ------------------------------------------
[[ -n "$SSH_USER" && -n "$SSH_HOST" ]] \
  || die "Faltan credenciales SSH. Copia tools/deploy.env.example a tools/deploy.env y rellénalo (o exporta SSH_USER/SSH_HOST)."

# Inyecta el token de bypass real en el .htaccess del servidor, sustituyendo el
# placeholder __MAINT_TOKEN__. El repo nunca contiene el token; el rsync sube el
# .htaccess con el placeholder, así que esto debe correr DESPUÉS de cada rsync.
inject_maint_token() {
  [[ -n "$MAINT_TOKEN" ]] || { info "MAINT_TOKEN vacío — no se inyecta token de bypass."; return 0; }
  if $SSH_CMD "$SSH_USER@$SSH_HOST" "f='$REMOTE_DIR/.htaccess'; [ -f \"\$f\" ] && sed -i 's/__MAINT_TOKEN__/$MAINT_TOKEN/g' \"\$f\""; then
    ok "Token de bypass inyectado en el .htaccess del servidor."
  else
    die "No se pudo inyectar el token en el .htaccess del servidor (revisa SSH)."
  fi
}

# --- Modo mantenimiento (cortocircuita: no construye ni sincroniza) ---------
if [[ -n "$MAINTENANCE" ]]; then
  if [[ "$DRY_RUN" -eq 1 ]]; then
    info "DRY-RUN: se solicitaría mantenimiento $MAINTENANCE; no se ejecutan cambios remotos."
    exit 0
  fi
  if [[ "$MAINTENANCE" == "on" ]]; then
    info "Activando modo mantenimiento…"
    inject_maint_token   # garantiza el token en el .htaccess antes de cortar el acceso
    $SSH_CMD "$SSH_USER@$SSH_HOST" "touch '$MAINT_FILE'" || die "No se pudo crear el centinela por SSH."
    info "Verificando $SITE_URL …"
    code="$(http_code "$SITE_URL")"
    [[ "$code" == "503" ]] \
      && ok "Mantenimiento ACTIVO — el sitio responde 503 para los visitantes." \
      || die "Centinela creado, pero el sitio devolvió HTTP $code (esperado 503; revisa el .htaccess)."
    if [[ -n "$MAINT_TOKEN" ]]; then
      bcode="$(http_code "$SITE_URL/?preview=$MAINT_TOKEN")"
      [[ "$bcode" == "200" ]] \
        && ok "Bypass OK — con el token el equipo ve la web real (200)." \
        || die "El bypass con token devolvió HTTP $bcode (esperado 200)."
      info "Enlace de previsualización para el equipo (no compartir públicamente):"
      printf '   %s/?preview=%s\n' "$SITE_URL" "$MAINT_TOKEN"
    fi
  else
    info "Desactivando modo mantenimiento (borrando centinela)…"
    $SSH_CMD "$SSH_USER@$SSH_HOST" "rm -f '$MAINT_FILE'" || die "No se pudo borrar el centinela por SSH."
    info "Verificando $SITE_URL …"
    code="$(http_code "$SITE_URL")"
    [[ "$code" == "200" ]] \
      && ok "Mantenimiento DESACTIVADO — el sitio responde 200." \
      || die "Centinela borrado, pero el sitio devolvió HTTP $code (esperado 200; revisa manualmente)."
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
if ! $SSH_CMD "$SSH_USER@$SSH_HOST" "command -v rsync >/dev/null 2>&1"; then
  die "Fallo SSH: o no hay conexión, o el servidor no tiene rsync."
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
# Crear el destino solo tras la confirmación y fuera del modo de simulación.
if [[ "$DRY_RUN" -eq 0 ]]; then
  $SSH_CMD "$SSH_USER@$SSH_HOST" "mkdir -p '$REMOTE_DIR'" || die "No se pudo crear $REMOTE_DIR."
fi
# --exclude='.maintenance': el centinela del modo mantenimiento vive en el
# servidor (no en dist/); sin esta exclusión, --delete lo borraría y un deploy
# normal durante el mantenimiento apagaría el 503 sin querer.
# --checksum (v4.26.2): gulp conserva en dist/ la fecha del archivo fuente y
# el token ?v=hash de los assets no cambia el tamaño del HTML, así que la
# comparación por fecha+tamaño de rsync NO subía las páginas cuyo fuente no
# había cambiado: seguían apuntando al CSS/JS con el token antiguo (cacheado
# un año como immutable) y los cambios de estilo no se veían. Comparar por
# contenido cuesta unos segundos más y garantiza el espejo.
# SIN -t (v4.26.3): -a incluye -t, que copiaba al servidor la fecha antigua del
# fuente; Apache respondía 304 Not Modified a la revalidación de la CDN de
# Hostinger (mismo Last-Modified/ETag) y esta seguía sirviendo el HTML viejo
# aunque el archivo ya fuera nuevo. Sin -t, cada archivo transferido recibe la
# fecha del momento y la CDN obtiene el cuerpo nuevo. -rlpgoD = -a menos -t.
RSYNC_FLAGS=(-rlpgoDvz --checksum --delete --exclude='.DS_Store' --exclude='.maintenance')
[[ "$DRY_RUN" -eq 1 ]] && { RSYNC_FLAGS+=(-n); info "DRY-RUN: no se modificará el servidor."; }

info "Sincronizando con rsync…"
rsync "${RSYNC_FLAGS[@]}" \
  -e "$SSH_CMD" \
  "$REPO_ROOT/$LOCAL_DIR/" \
  "$SSH_USER@$SSH_HOST:$REMOTE_DIR/"

if [[ "$DRY_RUN" -eq 1 ]]; then
  ok "Dry-run terminado (no se subió nada). Revisa la lista de cambios arriba."
  info "DRY-RUN: tras un deploy real se verificaría producción (seo:verify:production) y se notificarían por IndexNow las URL cambiadas:"
  if [[ "$NO_INDEXNOW" -eq 0 && -f "$REPO_ROOT/scripts/indexnow-submit.mjs" ]]; then
    ( cd "$REPO_ROOT" && node scripts/indexnow-submit.mjs --changed --dry-run ) || true
  fi
  exit 0
fi
ok "Archivos sincronizados."

# El rsync acaba de subir el .htaccess con el placeholder __MAINT_TOKEN__;
# reinyectamos el token real (de deploy.env) para no dejarlo en el repo.
inject_maint_token

# --- 5. Verificación post-deploy --------------------------------------------
info "Verificando $SITE_URL …"
code="$(http_code "$SITE_URL")"
if [[ "$code" == "200" ]]; then
  ok "Deploy correcto — $SITE_URL responde 200."
else
  fail "Deploy subido, pero $SITE_URL devolvió HTTP $code (revisa manualmente)."
  exit 1
fi

# --- 6. Verificación SEO de producción (v4.43.0) ----------------------------
# Compara lo publicado con dist/ (sitemaps, robots, llms, páginas, assets, 301).
# Si falla, no se avisa a los buscadores: la CDN aún podría servir la versión
# anterior. Repite con --skip-build cuando la CDN haya refrescado.
if [[ "$SKIP_VERIFY" -eq 0 && -f "$REPO_ROOT/scripts/verify-seo-production.mjs" ]]; then
  info "Verificando el SEO publicado (npm run seo:verify:production)…"
  if ( cd "$REPO_ROOT" && node scripts/verify-seo-production.mjs ); then
    ok "Producción idéntica a dist/ (sitemaps, robots, páginas y redirecciones)."
  else
    die "La verificación SEO de producción falló: no se notifica a IndexNow. Revisa la CDN y relanza con --skip-build (o --skip-verify)."
  fi
fi

# --- 7. IndexNow: solo las URL cuyo contenido cambió desde el último deploy ---
# El snapshot del seo-history desplegado vive en .cache/ (ignorado por git). Sin
# snapshot (primer deploy con IndexNow) se envían todas las URL del sitemap.
# Google no participa en IndexNow: descubre por robots.txt y Search Console.
DEPLOYED_HISTORY="$REPO_ROOT/.cache/seo-history.deployed.json"
if [[ "$NO_INDEXNOW" -eq 0 && -f "$REPO_ROOT/scripts/indexnow-submit.mjs" ]]; then
  info "Notificando los cambios a IndexNow…"
  if [[ -f "$DEPLOYED_HISTORY" ]]; then
    ( cd "$REPO_ROOT" && node scripts/indexnow-submit.mjs --changed --previous "$DEPLOYED_HISTORY" ) \
      || fail "IndexNow devolvió un aviso (ver arriba); el deploy es correcto. Relanza con: npm run seo:indexnow -- --changed --previous .cache/seo-history.deployed.json"
  else
    info "Primer deploy con IndexNow: se envían todas las URL del sitemap."
    ( cd "$REPO_ROOT" && node scripts/indexnow-submit.mjs --all ) \
      || fail "IndexNow devolvió un aviso (ver arriba); el deploy es correcto. Relanza con: npm run seo:indexnow -- --all"
  fi
  mkdir -p "$REPO_ROOT/.cache" && cp "$REPO_ROOT/src/data/seo-history.json" "$DEPLOYED_HISTORY"
  ok "Snapshot del historial desplegado guardado en .cache/seo-history.deployed.json."
fi
