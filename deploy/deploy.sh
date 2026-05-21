#!/bin/bash
# ============================================================
# SCRIPT MAESTRO — SaludDeUna Web
# PREREQUISITO: salud-de-una-backend/deploy/deploy.sh ya ejecutado
#
# USO:
#   bash deploy/deploy.sh                 # deploy completo (primera vez)
#   bash deploy/deploy.sh --only-build    # disparar GitHub Actions deploy
#   bash deploy/deploy.sh --verify        # verificar health
#   bash deploy/deploy.sh --status        # estado ECS
#   bash deploy/deploy.sh --logs          # logs en vivo
#   bash deploy/deploy.sh --force-redeploy # ECS force new (imagen actual)
#   bash deploy/deploy.sh --destroy       # destruir infraestructura web
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scripts"
TF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/terraform"
OUTPUTS="$HOME/.sduna-web-tf-outputs.json"
MODE="${1:-full}"
export PATH="$HOME/.local/bin:$PATH"

REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || \
         cat "$HOME/.sduna-be-region"  2>/dev/null || echo "us-east-1")

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'

step()  { echo -e "\n${BLUE}${BOLD}[$1]${RESET} $2"; }
ok()    { echo -e "    ${GREEN}✓${RESET} $1"; }
warn()  { echo -e "    ${YELLOW}⚠${RESET}  $1"; }
error() { echo -e "    ${RED}✗${RESET}  $1"; }

preflight() {
  step "0/5" "Pre-flight checks"

  if ! aws sts get-caller-identity &>/dev/null; then
    error "AWS CLI sin credenciales activas."
    exit 1
  fi
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  ok "AWS CLI — Account: $ACCOUNT_ID"

  ALB=$(aws ssm get-parameter --name "/salud-de-una/infra/alb-dns" \
    --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")
  if [[ -z "$ALB" ]]; then
    error "Backend no encontrado en SSM. Ejecuta:"
    error "  bash salud-de-una-backend/deploy/deploy.sh"
    exit 1
  fi
  ok "Backend detectado — ALB: $ALB"

  command -v python3 &>/dev/null && ok "python3 disponible" || { error "python3 no disponible"; exit 1; }

  FREE_MB=$(df -m "$HOME" | tail -1 | awk '{print $4}')
  [[ "$FREE_MB" -lt 200 ]] && warn "Espacio libre bajo: ${FREE_MB}MB" || ok "Espacio libre: ${FREE_MB}MB"
}

echo ""
echo -e "${BOLD}================================================${RESET}"
echo -e "${BOLD}  SaludDeUna Web — Deploy a AWS${RESET}"
echo -e "${BOLD}  Modo : ${MODE}${RESET}"
echo -e "${BOLD}================================================${RESET}"

case "$MODE" in

  --verify|verify)
    bash "$SCRIPT_DIR/05-verify.sh"
    exit 0
    ;;

  --only-build|build)
    step "1/1" "Disparar GitHub Actions deploy-aws.yml"
    bash "$SCRIPT_DIR/04-build.sh"
    exit 0
    ;;

  --force-redeploy|force-redeploy)
    [[ ! -f "$OUTPUTS" ]] && { error "Ejecuta el deploy completo primero."; exit 1; }
    CLUSTER=$(aws ssm get-parameter --name "/salud-de-una/infra/ecs-cluster-name" \
      --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")
    SVC=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['ecs_service_name']['value'])")
    echo ""
    echo ">>> Forzando redeploy ECS web (imagen actual en ECR)..."
    aws ecs update-service \
      --cluster "$CLUSTER" --service "$SVC" \
      --force-new-deployment --region "$REGION" \
      --no-cli-pager --output text > /dev/null
    ok "web → force-new-deployment"
    echo "    Espera ~3-5 min y verifica: bash deploy/deploy.sh --verify"
    exit 0
    ;;

  --status|status)
    if [[ ! -f "$OUTPUTS" ]]; then
      warn "tf-outputs.json no encontrado."
      exit 0
    fi
    APP=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['app_url']['value'])")
    SVC=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['ecs_service_name']['value'])")
    CLUSTER=$(aws ssm get-parameter --name "/salud-de-una/infra/ecs-cluster-name" \
      --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")
    TF_VARS="$TF_DIR/terraform.tfvars"
    REPO=$(grep '^github_repo' "$TF_VARS" 2>/dev/null | sed 's/.*= *"\(.*\)".*/\1/' || echo "")
    REPO_SLUG=$(echo "$REPO" | sed 's|https://github.com/||')
    echo ""
    echo "--- ECS Service ---"
    aws ecs describe-services \
      --cluster "$CLUSTER" --services "$SVC" --region "$REGION" \
      --query 'services[0].{Service:serviceName,Desired:desiredCount,Running:runningCount,Rollout:deployments[0].rolloutState}' \
      --output table 2>/dev/null || echo "  (no se pudo consultar)"
    echo ""
    echo "  App : $APP"
    [[ -n "$REPO_SLUG" ]] && echo "  GitHub Actions: https://github.com/${REPO_SLUG}/actions"
    exit 0
    ;;

  --logs|logs)
    [[ ! -f "$OUTPUTS" ]] && { error "tf-outputs.json no encontrado."; exit 1; }
    LOG=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['cloudwatch_log_group']['value'])")
    echo ""
    echo "Logs en vivo del web (Ctrl+C para salir):"
    aws logs tail "$LOG" --follow --region "$REGION"
    exit 0
    ;;

  --destroy|destroy)
    echo ""
    echo -e "${RED}${BOLD}⚠️  DESTRUCCIÓN INFRAESTRUCTURA WEB${RESET}"
    echo "    Elimina: ECS service web, ECR web, IAM refs..."
    echo "    El ALB y VPC del backend NO se verán afectados."
    echo ""
    read -rp "    Escribe 'DESTRUIR' para confirmar: " confirm
    if [[ "$confirm" == "DESTRUIR" ]]; then
      cd "$TF_DIR"
      terraform destroy
      ok "Infraestructura web destruida."
    else
      echo "    Cancelado."
    fi
    exit 0
    ;;

  full|--full)
    ;;

  *)
    echo "Modo no reconocido: $MODE"
    echo "Modos: (ninguno) | --only-build | --verify | --status | --logs | --force-redeploy | --destroy"
    exit 1
    ;;
esac

# ── Deploy completo ────────────────────────────────────────────────────────────

preflight

step "1/5" "Setup CloudShell"
bash "$SCRIPT_DIR/00-setup.sh"

if [[ -f "$TF_DIR/terraform.tfvars" ]]; then
  step "2/5" "Configuración"
  warn "terraform.tfvars ya existe. Para reconfigurar: rm $TF_DIR/terraform.tfvars"
else
  step "2/5" "Configuración (lee infra del backend desde SSM)"
  bash "$SCRIPT_DIR/01-configure.sh"
fi

step "3/5" "Infraestructura web (ECR, ECS service)"
bash "$SCRIPT_DIR/02-infra.sh"

step "4/5" "Secrets en SSM (JWT_SECRET)"
bash "$SCRIPT_DIR/03-secrets.sh"

step "5/5" "Disparar deploy con GitHub Actions"
bash "$SCRIPT_DIR/04-build.sh"

APP_URL=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['app_url']['value'])" 2>/dev/null || echo "")
TF_VARS="$TF_DIR/terraform.tfvars"
REPO=$(grep '^github_repo' "$TF_VARS" 2>/dev/null | sed 's/.*= *"\(.*\)".*/\1/' || echo "")
REPO_SLUG=$(echo "$REPO" | sed 's|https://github.com/||')

echo ""
echo -e "${GREEN}${BOLD}================================================${RESET}"
echo -e "${GREEN}${BOLD}  ✅ Infraestructura lista. Deploy iniciado.${RESET}"
echo -e "${GREEN}${BOLD}================================================${RESET}"
echo ""
echo "  URL : $APP_URL"
echo ""
echo "  Monitorear deploy (~18-20 min):"
echo "    https://github.com/${REPO_SLUG}/actions"
echo ""
echo "  Configura en Auth0 → Applications → tu SPA:"
echo "    Allowed Callback URLs : ${APP_URL}/callback"
echo "    Allowed Logout URLs   : $APP_URL"
echo "    Allowed Web Origins   : $APP_URL"
echo ""
echo "  Verificar cuando termine:"
echo "    bash deploy/deploy.sh --verify"
