#!/bin/bash
# Disparar el deploy del web en GitHub Actions.
#
# Los repos son PÚBLICOS — dos maneras de activar el deploy:
#
#   A) AUTOMÁTICO (recomendado): hacer git push a main.
#      GitHub Actions se activa solo con el workflow_run trigger.
#
#   B) MANUAL desde CloudShell (este script):
#      Requiere un GitHub Token con scope 'workflow' guardado en SSM.
set -euo pipefail

REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || echo "us-east-1")
PROJECT_BE="salud-de-una"
TF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/terraform"

GITHUB_REPO=$(grep '^github_repo' "$TF_DIR/terraform.tfvars" 2>/dev/null | \
  sed 's/.*= *"\(.*\)".*/\1/' || echo "")
[[ -z "$GITHUB_REPO" ]] && { echo "ERROR: github_repo no en terraform.tfvars"; exit 1; }
REPO_SLUG=$(echo "$GITHUB_REPO" | sed 's|https://github.com/||')

ALB_DNS=$(aws ssm get-parameter --name "/${PROJECT_BE}/infra/alb-dns" \
  --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")

echo "=============================================="
echo " SaludDeUna Web — Activar Deploy"
echo "=============================================="
echo ""
echo "  Repo   : $REPO_SLUG (público)"
echo "  API URL: http://$ALB_DNS/v1  (bakeado en imagen)"
echo ""

GH_TOKEN=$(aws ssm get-parameter --name "/${PROJECT_BE}/GITHUB_TOKEN" \
  --with-decryption --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")

if [[ -z "$GH_TOKEN" || "$GH_TOKEN" == "placeholder" ]]; then
  echo "  No hay GitHub Token configurado."
  echo ""
  echo "  Para activar el deploy:"
  echo ""
  echo "  1) Hacer push a main (recomendado):"
  echo "     git push origin main"
  echo "     → GitHub Actions se activa automáticamente"
  echo ""
  echo "  2) Guardar token y usar este script:"
  echo "     cd ../salud-de-una-backend && bash deploy/scripts/03-secrets.sh"
  echo "     Scope requerido: workflow"
  echo ""
  echo "  Ver estado de deploys:"
  echo "  https://github.com/${REPO_SLUG}/actions/workflows/deploy-aws.yml"
  exit 0
fi

echo "  ⚠️  Verifica que GitHub tiene configurados:"
echo "    Secrets : AWS_ACCESS_KEY_ID / SECRET / SESSION_TOKEN"
echo "    Variables: AWS_REGION, ECS_CLUSTER, AUTH0_DOMAIN, AUTH0_AUDIENCE, WEB_AUTH0_CLIENT_ID"
echo ""

read -rp "¿Disparar workflow deploy-aws.yml? (S/n): " confirm
[[ "${confirm,,}" == "n" ]] && { echo "Cancelado."; exit 0; }

HTTP_CODE=$(curl -s -o /tmp/gh-dispatch-web.json -w "%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/${REPO_SLUG}/actions/workflows/deploy-aws.yml/dispatches" \
  -d '{"ref":"main"}')

case "$HTTP_CODE" in
  204)
    echo "✅ Workflow disparado."
    echo "  https://github.com/${REPO_SLUG}/actions/workflows/deploy-aws.yml"
    echo "  (~18-20 min para Next.js)"
    ;;
  401|403)
    echo "❌ HTTP $HTTP_CODE — Token inválido o sin scope 'workflow'."
    exit 1
    ;;
  *)
    echo "❌ HTTP $HTTP_CODE"
    cat /tmp/gh-dispatch-web.json 2>/dev/null || true
    exit 1
    ;;
esac
