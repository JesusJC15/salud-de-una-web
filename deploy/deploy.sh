#!/bin/bash
# ============================================================
# SCRIPT MAESTRO — SaludDeUna Web
# PREREQUISITO: salud-de-una-backend/deploy/deploy.sh ya ejecutado
#
# USO:
#   bash deploy/deploy.sh                 # deploy completo (primera vez)
#   bash deploy/deploy.sh --only-build    # rebuild imagen + redeploy ECS
#   bash deploy/deploy.sh --verify        # verificar health de la app
#   bash deploy/deploy.sh --status        # estado ECS + últimas builds
#   bash deploy/deploy.sh --logs          # ver logs del web en vivo
#   bash deploy/deploy.sh --force-redeploy # ECS force new (sin rebuild)
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
  step "0/6" "Pre-flight checks"

  if ! aws sts get-caller-identity &>/dev/null; then
    error "AWS CLI sin credenciales activas."
    exit 1
  fi
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  ok "AWS CLI — Account: $ACCOUNT_ID"

  # Verificar que el backend fue desplegado primero
  ALB=$(aws ssm get-parameter --name "/salud-de-una/infra/alb-dns" \
    --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")
  if [[ -z "$ALB" ]]; then
    error "Infraestructura del backend NO encontrada en SSM."
    error "Ejecuta primero: bash salud-de-una-backend/deploy/deploy.sh"
    exit 1
  fi
  ok "Backend detectado en SSM — ALB: $ALB"

  command -v python3 &>/dev/null && ok "python3 disponible" || { error "python3 no disponible"; exit 1; }

  FREE_MB=$(df -m "$HOME" | tail -1 | awk '{print $4}')
  [[ "$FREE_MB" -lt 200 ]] \
    && warn "Espacio libre bajo: ${FREE_MB}MB" \
    || ok "Espacio libre: ${FREE_MB}MB"
}

echo ""
echo -e "${BOLD}================================================${RESET}"
echo -e "${BOLD}  SaludDeUna Web — Deploy a AWS${RESET}"
echo -e "${BOLD}  Modo : ${MODE}${RESET}"
echo -e "${BOLD}  PREREQUISITO: backend ya desplegado${RESET}"
echo -e "${BOLD}================================================${RESET}"

# ── Modos de operación ─────────────────────────────────────────────────────────

case "$MODE" in

  --verify|verify)
    bash "$SCRIPT_DIR/05-verify.sh"
    exit 0
    ;;

  --only-build|build)
    step "1/2" "Rebuild imagen Next.js + push ECR + deploy ECS"
    bash "$SCRIPT_DIR/04-build.sh"
    step "2/2" "Verificación (esperando 60s que ECS estabilice)"
    sleep 60
    bash "$SCRIPT_DIR/05-verify.sh"
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
      --cluster "$CLUSTER" \
      --service "$SVC" \
      --force-new-deployment \
      --region "$REGION" \
      --no-cli-pager --output text > /dev/null
    ok "web → force-new-deployment"
    echo ""
    echo "    Espera ~3-5 min y verifica: bash deploy/deploy.sh --verify"
    exit 0
    ;;

  --status|status)
    if [[ ! -f "$OUTPUTS" ]]; then
      warn "tf-outputs.json no encontrado."
      exit 0
    fi
    CB=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['codebuild_web_project']['value'])")
    APP=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['app_url']['value'])")
    SVC=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['ecs_service_name']['value'])")
    CLUSTER=$(aws ssm get-parameter --name "/salud-de-una/infra/ecs-cluster-name" \
      --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")
    echo ""
    echo "--- ECS Service ---"
    aws ecs describe-services \
      --cluster "$CLUSTER" --services "$SVC" --region "$REGION" \
      --query 'services[0].{Service:serviceName,Desired:desiredCount,Running:runningCount,Rollout:deployments[0].rolloutState}' \
      --output table 2>/dev/null || echo "  (no se pudo consultar)"
    echo ""
    echo "--- Últimas 3 builds ---"
    IDS=$(aws codebuild list-builds-for-project \
      --project-name "$CB" --sort-order DESCENDING \
      --region "$REGION" --query 'ids[0:3]' --output text 2>/dev/null | tr '\t' ' ')
    if [[ -n "$IDS" && "$IDS" != "None" ]]; then
      # shellcheck disable=SC2086
      aws codebuild batch-get-builds --ids $IDS --region "$REGION" \
        --query 'builds[*].{ID:id,Status:buildStatus,Start:startTime}' \
        --output table 2>/dev/null
    fi
    echo ""
    echo "  App : $APP"
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
    echo -e "${RED}${BOLD}⚠️  DESTRUCCIÓN DE INFRAESTRUCTURA WEB${RESET}"
    echo "    Elimina: ECS service web, ECR web, CodeBuild web, IAM roles web..."
    echo "    El ALB y la VPC del backend NO se verán afectados."
    echo ""
    read -rp "    Escribe 'DESTRUIR' para confirmar: " confirm
    if [[ "$confirm" == "DESTRUIR" ]]; then
      cd "$TF_DIR"
      terraform destroy
      echo ""
      ok "Infraestructura web destruida."
    else
      echo "    Cancelado."
    fi
    exit 0
    ;;

  full|--full)
    ;;  # continúa al deploy completo

  *)
    echo "Modo no reconocido: $MODE"
    echo ""
    echo "Modos disponibles:"
    echo "  (ninguno)          deploy completo"
    echo "  --only-build       rebuild + redeploy ECS"
    echo "  --verify           health check"
    echo "  --status           estado ECS + historial builds"
    echo "  --logs             logs en vivo"
    echo "  --force-redeploy   ECS force new deployment (sin rebuild)"
    echo "  --destroy          destruir infraestructura web"
    exit 1
    ;;
esac

# ── Deploy completo ────────────────────────────────────────────────────────────

preflight

step "1/6" "Setup CloudShell (Terraform + verificar backend)"
bash "$SCRIPT_DIR/00-setup.sh"

if [[ -f "$TF_DIR/terraform.tfvars" ]]; then
  step "2/6" "Configuración"
  warn "terraform.tfvars ya existe — reutilizando valores previos."
  warn "Para reconfigurar: rm $TF_DIR/terraform.tfvars && bash deploy/deploy.sh"
else
  step "2/6" "Configuración (lee infra del backend desde SSM automáticamente)"
  bash "$SCRIPT_DIR/01-configure.sh"
fi

step "3/6" "Infraestructura web (ECR, ECS service, CodeBuild)"
bash "$SCRIPT_DIR/02-infra.sh"

step "4/6" "Secrets en SSM (JWT_SECRET)"
bash "$SCRIPT_DIR/03-secrets.sh"

step "5/6" "Build Next.js + Push ECR + Deploy ECS (~18 min)"
bash "$SCRIPT_DIR/04-build.sh"

step "6/6" "Verificación del deployment"
echo "    Esperando 60 segundos que ECS estabilice las tasks..."
sleep 60
bash "$SCRIPT_DIR/05-verify.sh"

# ── Banner de éxito ────────────────────────────────────────────────────────────
APP_URL=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['app_url']['value'])" 2>/dev/null || echo "")

echo ""
echo -e "${GREEN}${BOLD}================================================${RESET}"
echo -e "${GREEN}${BOLD}  ✅ Web desplegado exitosamente${RESET}"
echo -e "${GREEN}${BOLD}================================================${RESET}"
echo ""
echo "  URL : $APP_URL"
echo ""
echo "  Próximos pasos obligatorios en Auth0:"
echo "    Applications → tu SPA → Settings:"
echo "      Allowed Callback URLs : ${APP_URL}/callback"
echo "      Allowed Logout URLs   : $APP_URL"
echo "      Allowed Web Origins   : $APP_URL"
echo ""
echo "  Redeploy rápido:"
echo "    bash deploy/deploy.sh --only-build"
