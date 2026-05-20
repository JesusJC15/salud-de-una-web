#!/bin/bash
# Health checks, estado ECS y diagnóstico post-deploy del web
set -euo pipefail

REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || echo "us-east-1")
OUTPUTS="$HOME/.sduna-web-tf-outputs.json"

[[ ! -f "$OUTPUTS" ]] && {
  echo "ERROR: tf-outputs.json no encontrado."
  echo "       Ejecuta primero: bash scripts/02-infra.sh"
  exit 1
}

APP=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['app_url']['value'])")
LOG=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['cloudwatch_log_group']['value'])")
SVC=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['ecs_service_name']['value'])")
CLUSTER=$(aws ssm get-parameter --name "/salud-de-una/infra/ecs-cluster-name" \
  --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")

echo "=============================================="
echo " SaludDeUna Web — Verificación"
echo "=============================================="
echo "  App : $APP"
echo ""

CHECKS_FAILED=0

check_endpoint() {
  local label="$1" url="$2" expected="${3:-200}"
  printf "  %-20s -> " "$label"
  HTTP_CODE=$(curl -sf --max-time 10 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  if [[ "$HTTP_CODE" == "$expected" ]]; then
    echo "HTTP $HTTP_CODE ✅"
  elif [[ "$HTTP_CODE" == "000" ]]; then
    echo "SIN RESPUESTA ❌"
    CHECKS_FAILED=$(( CHECKS_FAILED + 1 ))
  else
    echo "HTTP $HTTP_CODE ❌  (esperado $expected)"
    CHECKS_FAILED=$(( CHECKS_FAILED + 1 ))
  fi
}

echo "--- Endpoints HTTP ---"
check_endpoint "/api/health" "${APP}/api/health"
check_endpoint "Raiz /"      "${APP}/"
check_endpoint "/login"      "${APP}/login"

echo ""

# Estado del ECS service web
if [[ -n "$CLUSTER" ]]; then
  echo "--- ECS Service ---"
  aws ecs describe-services \
    --cluster "$CLUSTER" \
    --services "$SVC" \
    --region "$REGION" \
    --query 'services[0].{Service:serviceName,Desired:desiredCount,Running:runningCount,Pending:pendingCount,Rollout:deployments[0].rolloutState}' \
    --output table 2>/dev/null || echo "  (no se pudo consultar ECS)"
  echo ""

  # Tasks detenidas del web
  STOPPED=$(aws ecs list-tasks \
    --cluster "$CLUSTER" \
    --service-name "$SVC" \
    --desired-status STOPPED \
    --region "$REGION" \
    --query 'taskArns[0:2]' \
    --output text 2>/dev/null | tr '\t' ' ' || echo "")

  if [[ -n "$STOPPED" && "$STOPPED" != "None" ]]; then
    echo "--- Tasks detenidas ---"
    # shellcheck disable=SC2086
    aws ecs describe-tasks \
      --cluster "$CLUSTER" \
      --tasks $STOPPED \
      --region "$REGION" \
      --query 'tasks[*].{StopCode:stopCode,Reason:stoppedReason,ExitCode:containers[0].exitCode}' \
      --output table 2>/dev/null || true
    echo ""
  fi
fi

# Logs recientes si hay fallos
if [[ "$CHECKS_FAILED" -gt 0 ]]; then
  echo "--- Últimos logs del web (5 min) ---"
  aws logs tail "$LOG" --since 5m --region "$REGION" 2>/dev/null | head -20 \
    || echo "  (sin entradas recientes)"
  echo ""
fi

echo "=============================================="
echo "  URLs"
echo "=============================================="
echo "  App    : $APP"
echo "  Health : ${APP}/api/health"
echo "  Login  : ${APP}/login"
echo ""
echo "  Logs en vivo:"
echo "  aws logs tail $LOG --follow --region $REGION"
echo ""

if [[ "$CHECKS_FAILED" -eq 0 ]]; then
  echo "✅ Todos los endpoints responden correctamente."
else
  echo "⚠️  $CHECKS_FAILED endpoint(s) no responden."
  echo "   Si ECS muestra tasks PENDING, espera 2-3 min más."
  echo "   Diagnóstico: bash scripts/fix-errors.sh"
fi

echo ""
echo "--- Recordatorio post-deploy ---"
echo "  En Auth0 → Applications → tu SPA → Settings:"
echo "    Allowed Callback URLs : ${APP}/callback"
echo "    Allowed Logout URLs   : $APP"
echo "    Allowed Web Origins   : $APP"
