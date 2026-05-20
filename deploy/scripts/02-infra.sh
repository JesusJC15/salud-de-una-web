#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="$(dirname "$SCRIPT_DIR")/terraform"
export PATH="$HOME/.local/bin:$PATH"
[[ ! -f "$TF_DIR/terraform.tfvars" ]] && { echo "ERROR: Ejecuta primero 01-configure.sh"; exit 1; }
echo "=============================================="
echo " SaludDeUna Web — Crear infraestructura web"
echo "=============================================="
cd "$TF_DIR"
terraform init -upgrade
terraform plan -out=tfplan
echo ""
read -rp "Aplicar? (s/N): " c
[[ "${c,,}" != "s" ]] && { echo "Cancelado."; exit 0; }
terraform apply tfplan
echo ""
ALB=$(terraform output -raw app_url 2>/dev/null || echo "")
echo "App: $ALB"
terraform output -json > "$HOME/.sduna-web-tf-outputs.json"
echo "SIGUIENTE: bash scripts/03-secrets.sh"
