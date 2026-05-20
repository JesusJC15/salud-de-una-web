#!/bin/bash
# Instalar Terraform en CloudShell y verificar credenciales AWS
# PREREQUISITO: el deploy del backend debe haberse completado antes que el web
set -euo pipefail

TERRAFORM_VERSION="1.9.8"
INSTALL_DIR="$HOME/.local/bin"
export PATH="$HOME/.local/bin:$PATH"

echo "=============================================="
echo " SaludDeUna Web — Setup CloudShell"
echo "=============================================="

[[ "$(uname)" != "Linux" ]] && { echo "ERROR: Usar en AWS CloudShell (Linux)."; exit 1; }

echo ">>> Verificando herramientas base..."
for tool in curl unzip python3; do
  command -v "$tool" &>/dev/null && echo "    $tool : OK" || { echo "ERROR: $tool no encontrado"; exit 1; }
done

if command -v jq &>/dev/null; then
  echo "    jq     : $(jq --version)"
else
  sudo dnf install -y jq 2>/dev/null || sudo yum install -y jq 2>/dev/null || \
    echo "    WARN: No se pudo instalar jq (opcional)"
fi

echo ""
echo ">>> Verificando credenciales AWS..."
IDENTITY=$(aws sts get-caller-identity --output json)
ACCOUNT_ID=$(echo "$IDENTITY" | python3 -c "import sys,json; print(json.load(sys.stdin)['Account'])")
USER_ARN=$(echo "$IDENTITY"  | python3 -c "import sys,json; print(json.load(sys.stdin)['Arn'])")
echo "    Account: $ACCOUNT_ID"
echo "    ARN    : $USER_ARN"

# Elegir región (hereda del backend si está disponible)
BACKEND_REGION=$(cat "$HOME/.sduna-be-region" 2>/dev/null || echo "")
CURRENT_REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || echo "$BACKEND_REGION")
DEFAULT_REGION="${CURRENT_REGION:-us-east-1}"

echo ""
read -rp "  Región AWS [$DEFAULT_REGION]: " INPUT_REGION
REGION="${INPUT_REGION:-$DEFAULT_REGION}"
echo "    Región : $REGION"

echo "$ACCOUNT_ID" > "$HOME/.sduna-web-account-id"
echo "$REGION"     > "$HOME/.sduna-web-region"

# Verificar que el backend está desplegado (prerequisito)
echo ""
echo ">>> Verificando que el backend está desplegado..."
ALB=$(aws ssm get-parameter --name "/salud-de-una/infra/alb-dns" \
  --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")
if [[ -z "$ALB" ]]; then
  echo ""
  echo "ERROR: No se encontró la infraestructura del backend en SSM."
  echo "       El deploy del web depende del backend."
  echo "       Ejecuta primero: bash salud-de-una-backend/deploy/deploy.sh"
  exit 1
fi
echo "    Backend ALB : $ALB ✅"

# Instalar / actualizar Terraform
echo ""
mkdir -p "$INSTALL_DIR"
if terraform --version &>/dev/null; then
  CURRENT_TF=$(terraform version | head -1 | grep -oP '\d+\.\d+\.\d+' || echo "desconocida")
  if [[ "$CURRENT_TF" == "$TERRAFORM_VERSION" ]]; then
    echo ">>> Terraform $CURRENT_TF ya instalado y actualizado"
  else
    echo ">>> Actualizando Terraform $CURRENT_TF → $TERRAFORM_VERSION..."
    curl -fsSL "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip" \
      -o /tmp/tf.zip
    unzip -q -o /tmp/tf.zip -d "$INSTALL_DIR" && rm /tmp/tf.zip
    chmod +x "$INSTALL_DIR/terraform"
  fi
else
  echo ">>> Instalando Terraform ${TERRAFORM_VERSION}..."
  curl -fsSL "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip" \
    -o /tmp/tf.zip
  unzip -q /tmp/tf.zip -d "$INSTALL_DIR" && rm /tmp/tf.zip
  chmod +x "$INSTALL_DIR/terraform"
fi

echo ""
echo "=============================================="
echo "  Resumen"
echo "=============================================="
echo "  Terraform : $(terraform version | head -1)"
echo "  AWS CLI   : $(aws --version 2>&1 | head -1)"
echo "  Cuenta    : $ACCOUNT_ID"
echo "  Región    : $REGION"
echo "  Backend   : http://$ALB"
echo "=============================================="
echo ""
echo "✅ Setup OK — SIGUIENTE: bash scripts/01-configure.sh"
