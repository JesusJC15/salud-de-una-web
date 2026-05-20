#!/bin/bash
set -euo pipefail
TERRAFORM_VERSION="1.9.8"; INSTALL_DIR="$HOME/.local/bin"
export PATH="$HOME/.local/bin:$PATH"
echo "=============================================="
echo " SaludDeUna Web — Setup CloudShell"
echo "=============================================="
[[ "$(uname)" != "Linux" ]] && { echo "ERROR: Usar en AWS CloudShell."; exit 1; }
echo ">>> Verificando credenciales AWS..."
IDENTITY=$(aws sts get-caller-identity --output json)
ACCOUNT_ID=$(echo "$IDENTITY" | python3 -c "import sys,json; print(json.load(sys.stdin)['Account'])")
echo "    Account: $ACCOUNT_ID"
echo "$ACCOUNT_ID" > "$HOME/.sduna-web-account-id"
echo "us-east-1" > "$HOME/.sduna-web-region"
mkdir -p "$INSTALL_DIR"
if terraform --version &>/dev/null; then
  echo ">>> Terraform ya instalado"
else
  echo ">>> Instalando Terraform ${TERRAFORM_VERSION}..."
  curl -fsSL "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip" -o /tmp/tf.zip
  unzip -q /tmp/tf.zip -d "$INSTALL_DIR" && rm /tmp/tf.zip
  chmod +x "$INSTALL_DIR/terraform"
fi
command -v jq &>/dev/null || sudo dnf install -y jq 2>/dev/null || true
echo ""
echo "PREREQUISITO: backend-deploy debe haberse ejecutado primero."
echo "              (publica infra compartida en SSM /salud-de-una/infra/)"
echo ""
echo "Setup OK. SIGUIENTE: bash scripts/01-configure.sh"
