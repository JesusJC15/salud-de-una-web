#!/bin/bash
# Configurar secrets del web en SSM + credencial GitHub para CodeBuild + webhook
set -euo pipefail

REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || echo "us-east-1")
OUTPUTS="$HOME/.sduna-web-tf-outputs.json"
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
  # Intentar leer del backend automáticamente
  BE_JWT=$(get_ssm "/${PROJECT_BE}/JWT_SECRET")
  if [[ "$BE_JWT" != "placeholder" && -n "$BE_JWT" ]]; then
    echo "  Copiando JWT_SECRET del backend automáticamente..."
    put_ssm "/${PROJECT_WEB}/JWT_SECRET" "$BE_JWT"
    echo "  JWT_SECRET copiado del backend ✓"
  else
    # Pedir manualmente
    echo "  (No se encontró en el backend — ingresa el mismo valor)"
    if command -v openssl &>/dev/null; then
      read -rp "  ¿Generar uno nuevo con openssl? (S/n): " gen
      if [[ "${gen,,}" != "n" ]]; then
        NEW_JWT=$(openssl rand -hex 32)
        put_ssm "/${PROJECT_WEB}/JWT_SECRET" "$NEW_JWT"
        echo "  Auto-generado y guardado ✓  (primeros 8: ${NEW_JWT:0:8}...)"
        echo ""
        echo "  ⚠️  IMPORTANTE: actualiza también el backend con este mismo valor:"
        echo "  aws ssm put-parameter --name /${PROJECT_BE}/JWT_SECRET --value '$NEW_JWT' --type SecureString --overwrite --region $REGION"
      else
        read -rsp "  JWT_SECRET (min 32 chars): " JWT_VAL; echo ""
        [[ -n "$JWT_VAL" ]] && { put_ssm "/${PROJECT_WEB}/JWT_SECRET" "$JWT_VAL"; echo "  Guardado ✓"; }
      fi
    else
      read -rsp "  JWT_SECRET: " JWT_VAL; echo ""
      [[ -n "$JWT_VAL" ]] && { put_ssm "/${PROJECT_WEB}/JWT_SECRET" "$JWT_VAL"; echo "  Guardado ✓"; }
    fi
  fi
fi

echo ""
echo "--- GitHub Token para CodeBuild ---"

# Intentar reutilizar el token del backend (ya registrado en CodeBuild)
GH_FROM_BE=$(get_ssm "/${PROJECT_BE}/GITHUB_TOKEN")
if [[ -n "$GH_FROM_BE" && "$GH_FROM_BE" != "placeholder" ]]; then
  echo "  Token del backend encontrado → re-registrando en CodeBuild..."
  aws codebuild import-source-credentials \
    --token "$GH_FROM_BE" --server-type GITHUB --auth-type PERSONAL_ACCESS_TOKEN \
    --region "$REGION" --no-cli-pager > /dev/null
  echo "  Credencial GitHub OK ✓"
  TOKEN_USE="$GH_FROM_BE"
else
  echo "  No se encontró token del backend. Ingresa uno nuevo:"
  read -rsp "  GITHUB_TOKEN (scope: repo): " TOKEN_USE; echo ""
  if [[ -n "$TOKEN_USE" ]]; then
    aws codebuild import-source-credentials \
      --token "$TOKEN_USE" --server-type GITHUB --auth-type PERSONAL_ACCESS_TOKEN \
      --region "$REGION" --no-cli-pager > /dev/null
    echo "  Credencial registrada ✓"
  fi
fi

# Crear webhook si el proyecto CodeBuild del web existe
if [[ -n "${TOKEN_USE:-}" && -f "$OUTPUTS" ]]; then
  CB_WEB=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['codebuild_web_project']['value'])" 2>/dev/null || echo "")
  if [[ -n "$CB_WEB" ]]; then
    echo ""
    echo ">>> Configurando webhook (auto-build al hacer push a main)..."
    FILTER='[[{"type":"EVENT","pattern":"PUSH"},{"type":"HEAD_REF","pattern":"^refs/heads/main$"}]]'
    aws codebuild create-webhook \
      --project-name "$CB_WEB" \
      --filter-groups "$FILTER" \
      --region "$REGION" \
      --no-cli-pager > /dev/null 2>&1 \
      && echo "    Webhook creado ✓" \
      || echo "    Webhook ya existe ✓"
  fi
fi

# ── Validar JWT_SECRET ────────────────────────────────────────────────────────
echo ""
echo ">>> Validando secrets web..."
JWT_CHECK=$(get_ssm "/${PROJECT_WEB}/JWT_SECRET")
if [[ "$JWT_CHECK" == "placeholder" || -z "$JWT_CHECK" ]]; then
  echo "  ⚠️  JWT_SECRET sigue en placeholder — el middleware Next.js fallará"
else
  echo "  ✅ JWT_SECRET configurado (${#JWT_CHECK} chars)"
fi

echo ""
echo "SIGUIENTE: bash scripts/04-build.sh"
