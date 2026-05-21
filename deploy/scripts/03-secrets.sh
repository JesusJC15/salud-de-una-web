#!/bin/bash
# Configurar JWT_SECRET del web en SSM
set -euo pipefail

REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || echo "us-east-1")
PROJECT_WEB="salud-de-una-web"
PROJECT_BE="salud-de-una"

echo "=============================================="
echo " SaludDeUna Web — Configurar Secrets"
echo "=============================================="
echo "  Región : $REGION"
echo "  Entrada en modo silencioso."
echo ""

get_ssm() {
  aws ssm get-parameter --name "$1" --with-decryption \
    --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo ""
}

put_ssm() {
  aws ssm put-parameter --name "$1" --value "$2" \
    --type SecureString --overwrite --region "$REGION" --no-cli-pager --output text > /dev/null
}

# ── JWT_SECRET (mismo que el backend) ────────────────────────────────────────
echo "--- JWT_SECRET para middleware Next.js ---"
echo "  Debe ser el MISMO valor que el backend JWT_SECRET."
CURRENT_JWT=$(get_ssm "/${PROJECT_WEB}/JWT_SECRET")

if [[ "$CURRENT_JWT" != "placeholder" && -n "$CURRENT_JWT" ]]; then
  echo "  JWT_SECRET -> ya configurado ✓ (${#CURRENT_JWT} chars)"
else
  BE_JWT=$(get_ssm "/${PROJECT_BE}/JWT_SECRET")
  if [[ "$BE_JWT" != "placeholder" && -n "$BE_JWT" ]]; then
    echo "  Copiando JWT_SECRET del backend automáticamente..."
    put_ssm "/${PROJECT_WEB}/JWT_SECRET" "$BE_JWT"
    echo "  JWT_SECRET copiado del backend ✓"
  else
    echo "  (No se encontró en el backend — ingresando manualmente)"
    if command -v openssl &>/dev/null; then
      read -rp "  ¿Generar uno nuevo? (S/n): " gen
      if [[ "${gen,,}" != "n" ]]; then
        NEW_JWT=$(openssl rand -hex 32)
        put_ssm "/${PROJECT_WEB}/JWT_SECRET" "$NEW_JWT"
        echo "  Auto-generado ✓  (primeros 8: ${NEW_JWT:0:8}...)"
        echo ""
        echo "  ⚠️  Actualiza el backend con el mismo valor:"
        echo "  aws ssm put-parameter --name /${PROJECT_BE}/JWT_SECRET \\"
        echo "    --value '$NEW_JWT' --type SecureString --overwrite --region $REGION"
      else
        read -rsp "  JWT_SECRET (mín 32 chars): " JWT_VAL; echo ""
        [[ -n "$JWT_VAL" ]] && { put_ssm "/${PROJECT_WEB}/JWT_SECRET" "$JWT_VAL"; echo "  Guardado ✓"; }
      fi
    else
      read -rsp "  JWT_SECRET: " JWT_VAL; echo ""
      [[ -n "$JWT_VAL" ]] && { put_ssm "/${PROJECT_WEB}/JWT_SECRET" "$JWT_VAL"; echo "  Guardado ✓"; }
    fi
  fi
fi

# ── Validar ───────────────────────────────────────────────────────────────────
echo ""
JWT_CHECK=$(get_ssm "/${PROJECT_WEB}/JWT_SECRET")
if [[ "$JWT_CHECK" == "placeholder" || -z "$JWT_CHECK" ]]; then
  echo "  ⚠️  JWT_SECRET sigue vacío — el middleware Next.js fallará."
else
  echo "  ✅ JWT_SECRET configurado (${#JWT_CHECK} chars)"
fi

echo ""
echo "--- Recordatorio para GitHub Actions ---"
echo "  Configura en: https://github.com/<usuario>/salud-de-una-web → Settings"
echo ""
echo "  Secrets (renovar cada sesión Vocareum):"
echo "    AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN"
echo ""
echo "  Variables (una sola vez):"
echo "    AWS_REGION          = us-east-1"
echo "    ECS_CLUSTER         = salud-de-una-dev"
echo "    AUTH0_DOMAIN        = <tu-tenant>.us.auth0.com"
echo "    AUTH0_AUDIENCE      = https://api.salud-de-una.com"
echo "    WEB_AUTH0_CLIENT_ID = <client_id_spa>"
echo ""
echo "SIGUIENTE: bash scripts/04-build.sh"
