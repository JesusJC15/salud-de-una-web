#!/bin/bash
# Terraform init + plan + apply para la infraestructura del web
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="$(dirname "$SCRIPT_DIR")/terraform"
export PATH="$HOME/.local/bin:$PATH"
AUTO_APPROVE="${1:-}"

[[ ! -f "$TF_DIR/terraform.tfvars" ]] && {
  echo "ERROR: terraform.tfvars no encontrado."
  echo "       Ejecuta primero: bash scripts/01-configure.sh"
  exit 1
}

echo "=============================================="
echo " SaludDeUna Web — Infraestructura AWS"
echo "=============================================="
echo "  Directorio : $TF_DIR"
echo ""

cd "$TF_DIR"

echo ">>> terraform init..."
terraform init -upgrade
echo ""

echo ">>> terraform plan..."
set +e
terraform plan -out=tfplan -detailed-exitcode
PLAN_EXIT=$?
set -e

if [[ "$PLAN_EXIT" -eq 1 ]]; then
  echo "ERROR: terraform plan falló."; exit 1
fi

if [[ "$PLAN_EXIT" -eq 0 ]]; then
  echo ""
  echo "INFO: No hay cambios pendientes."
  terraform output -json > "$HOME/.sduna-web-tf-outputs.json" 2>/dev/null || true
  echo "SIGUIENTE: bash scripts/03-secrets.sh"
  exit 0
fi

echo ""
if [[ "$AUTO_APPROVE" == "--auto-approve" ]]; then
  echo ">>> --auto-approve: aplicando..."
else
  read -rp "¿Aplicar el plan? (s/N): " c
  [[ "${c,,}" != "s" ]] && { echo "Cancelado."; exit 0; }
fi

echo ""
echo ">>> terraform apply..."
START_TS=$(date +%s)
terraform apply tfplan
END_TS=$(date +%s)
DURATION=$(( END_TS - START_TS ))

echo ""
terraform output -json > "$HOME/.sduna-web-tf-outputs.json"

APP_URL=$(terraform output -raw app_url 2>/dev/null || echo "")

echo ""
echo "=============================================="
echo "✅ Infraestructura web creada/actualizada."
echo "   Duración : ${DURATION}s"
echo "   App      : $APP_URL"
echo "=============================================="
echo ""
echo "SIGUIENTE: bash scripts/03-secrets.sh"
