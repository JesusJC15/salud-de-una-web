#!/bin/bash
# Dispara el workflow deploy-aws.yml del web en GitHub Actions
# GitHub Actions hace: docker build Next.js → push ECR → ECS force-new-deployment
#
# PREREQUISITO: configurar en GitHub → Settings → Secrets:
#   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
#   (de Vocareum → AWS Details → Show — expiran cada ~4 horas)
#
# PREREQUISITO: configurar en GitHub → Settings → Variables:
#   AWS_REGION, ECS_CLUSTER, AUTH0_DOMAIN, AUTH0_AUDIENCE, WEB_AUTH0_CLIENT_ID
set -euo pipefail

REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || echo "us-east-1")
PROJECT_BE="salud-de-una"
TF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/terraform"

echo "=============================================="
echo " SaludDeUna Web — Disparar Deploy"
echo "=============================================="
echo ""

# ── Leer token GitHub (del backend — compartido) ──────────────────────────────
GH_TOKEN=$(aws ssm get-parameter --name "/${PROJECT_BE}/GITHUB_TOKEN" \
  --with-decryption --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")

if [[ -z "$GH_TOKEN" || "$GH_TOKEN" == "placeholder" ]]; then
  echo "ERROR: GITHUB_TOKEN no configurado."
  echo "       Ejecuta en el backend: bash deploy/scripts/03-secrets.sh"
  exit 1
fi

# ── Leer repo GitHub desde terraform.tfvars del web ──────────────────────────
GITHUB_REPO=$(grep '^github_repo' "$TF_DIR/terraform.tfvars" 2>/dev/null | \
  sed 's/.*= *"\(.*\)".*/\1/' || echo "")

if [[ -z "$GITHUB_REPO" ]]; then
  echo "ERROR: github_repo no encontrado en terraform.tfvars."
  exit 1
fi

REPO_SLUG=$(echo "$GITHUB_REPO" | sed 's|https://github.com/||')
ALB_DNS=$(aws ssm get-parameter --name "/${PROJECT_BE}/infra/alb-dns" \
  --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")

echo "  Repo       : $REPO_SLUG"
echo "  Workflow   : .github/workflows/deploy-aws.yml"
echo "  API URL    : http://$ALB_DNS/v1"
echo "  Callback   : http://$ALB_DNS/callback"
echo ""
echo "  El workflow bakes las variables NEXT_PUBLIC_* en la imagen."
echo ""
echo "  ⚠️  VERIFICA antes de continuar que GitHub tiene configurado:"
echo "    Secrets: AWS_ACCESS_KEY_ID / SECRET / SESSION_TOKEN"
echo "    Variables: AWS_REGION, ECS_CLUSTER, AUTH0_DOMAIN, AUTH0_AUDIENCE, WEB_AUTH0_CLIENT_ID"
echo ""

read -rp "¿Disparar workflow de deploy? (S/n): " confirm
[[ "${confirm,,}" == "n" ]] && { echo "Cancelado."; exit 0; }

echo ""
echo ">>> Disparando workflow deploy-aws.yml..."

HTTP_CODE=$(curl -s -o /tmp/gh-dispatch-web.json -w "%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/${REPO_SLUG}/actions/workflows/deploy-aws.yml/dispatches" \
  -d '{"ref":"main"}')

case "$HTTP_CODE" in
  204)
    echo "✅ Workflow disparado."
    echo ""
    echo "  Ver progreso (Next.js tarda ~18-20 min):"
    echo "  https://github.com/${REPO_SLUG}/actions/workflows/deploy-aws.yml"
    echo ""
    echo "  Cuando termine, verifica: bash scripts/05-verify.sh"
    ;;
  401)
    echo "❌ HTTP 401 — Token inválido. Actualiza GITHUB_TOKEN en el backend."
    exit 1
    ;;
  404)
    echo "❌ HTTP 404 — Workflow no encontrado en el repo."
    echo "   Repo: $GITHUB_REPO"
    exit 1
    ;;
  422)
    echo "❌ HTTP 422 — Rama 'main' no existe o workflow no está en main."
    cat /tmp/gh-dispatch-web.json 2>/dev/null || true
    exit 1
    ;;
  *)
    echo "❌ HTTP $HTTP_CODE"
    cat /tmp/gh-dispatch-web.json 2>/dev/null || true
    exit 1
    ;;
esac
