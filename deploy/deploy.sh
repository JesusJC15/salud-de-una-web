#!/bin/bash
# ============================================================
# SCRIPT MAESTRO — SaludDeUna Web
# PREREQUISITO: salud-de-una-backend/deploy/deploy.sh ya ejecutado
#
# USO:
#   bash deploy/deploy.sh              # deploy completo (primera vez)
#   bash deploy/deploy.sh --only-build # solo rebuild imagen (redeploy)
#   bash deploy/deploy.sh --verify     # solo verificar health
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scripts"
TF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/terraform"
MODE="${1:-full}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'
step()  { echo -e "\n${BLUE}${BOLD}[$1]${RESET} $2"; }
ok()    { echo -e "    ${GREEN}✓${RESET} $1"; }
warn()  { echo -e "    ${YELLOW}⚠${RESET}  $1"; }
error() { echo -e "    ${RED}✗${RESET}  $1"; }

preflight() {
  step "0/6" "Pre-flight checks"

  if ! aws sts get-caller-identity &>/dev/null; then
    error "AWS CLI sin credenciales activas."
    exit 1
  fi
  ok "AWS CLI con credenciales activas"

  # Verificar que el backend fue desplegado (busca SSM del backend)
  ALB=$(aws ssm get-parameter --name "/salud-de-una/infra/alb-dns" \
    --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")
  if [[ -z "$ALB" ]]; then
    error "Infraestructura del backend no encontrada en SSM."
    error "Ejecuta primero: salud-de-una-backend/deploy/deploy.sh"
    exit 1
  fi
  ok "Backend infraestructura detectada en SSM (ALB: $ALB)"

  command -v python3 &>/dev/null && ok "python3 disponible" || { error "python3 no disponible"; exit 1; }
}

echo ""
echo -e "${BOLD}================================================${RESET}"
echo -e "${BOLD}  SaludDeUna Web — Deploy a AWS${RESET}"
echo -e "${BOLD}  Modo: ${MODE}${RESET}"
echo -e "${BOLD}================================================${RESET}"

if [[ "$MODE" == "--verify" || "$MODE" == "verify" ]]; then
  bash "$SCRIPT_DIR/05-verify.sh"; exit 0
fi

if [[ "$MODE" == "--only-build" || "$MODE" == "build" ]]; then
  step "1/1" "Rebuild y redeploy imagen Docker web"
  bash "$SCRIPT_DIR/04-build.sh"
  sleep 5
  bash "$SCRIPT_DIR/05-verify.sh"
  exit 0
fi

preflight

step "1/6" "Instalando herramientas"
bash "$SCRIPT_DIR/00-setup.sh"

if [[ -f "$TF_DIR/terraform.tfvars" ]]; then
  step "2/6" "Configuracion"
  warn "terraform.tfvars ya existe. Para reconfigurar borralo."
else
  step "2/6" "Configuracion (leyendo SSM del backend automaticamente)"
  bash "$SCRIPT_DIR/01-configure.sh"
fi

step "3/6" "Creando infraestructura web (ECR, ECS service, CodeBuild)"
bash "$SCRIPT_DIR/02-infra.sh"

step "4/6" "Configurando secrets"
bash "$SCRIPT_DIR/03-secrets.sh"

step "5/6" "Build Next.js + Push ECR + Deploy ECS (~18 min)"
bash "$SCRIPT_DIR/04-build.sh"

step "6/6" "Verificando deployment"
echo "    Esperando 30 segundos..."
sleep 30
bash "$SCRIPT_DIR/05-verify.sh"

echo ""
echo -e "${GREEN}${BOLD}================================================${RESET}"
echo -e "${GREEN}${BOLD}  Web desplegado exitosamente${RESET}"
echo -e "${GREEN}${BOLD}================================================${RESET}"
echo ""
echo "Redeploy rapido:"
echo "  bash deploy/deploy.sh --only-build"
echo ""
