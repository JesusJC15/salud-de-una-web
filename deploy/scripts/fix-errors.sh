#!/bin/bash
# Diagnosticar y corregir errores comunes del web durante/después del deploy
set -euo pipefail

REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || echo "us-east-1")
OUTPUTS="$HOME/.sduna-web-tf-outputs.json"
TF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/terraform"
PROJECT_WEB="salud-de-una-web"
PROJECT_BE="salud-de-una"

get_cluster() {
  aws ssm get-parameter --name "/${PROJECT_BE}/infra/ecs-cluster-name" \
    --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo ""
}

get_svc() {
  [[ -f "$OUTPUTS" ]] && \
    python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['ecs_service_name']['value'])" 2>/dev/null \
    || echo ""
}

get_log() {
  [[ -f "$OUTPUTS" ]] && \
    python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['cloudwatch_log_group']['value'])" 2>/dev/null \
    || echo ""
}

get_repo_slug() {
  REPO=$(grep '^github_repo' "$TF_DIR/terraform.tfvars" 2>/dev/null | sed 's/.*= *"\(.*\)".*/\1/' || echo "")
  echo "$REPO" | sed 's|https://github.com/||'
}

get_gh_token() {
  aws ssm get-parameter --name "/${PROJECT_BE}/GITHUB_TOKEN" \
    --with-decryption --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo ""
}

echo "======================================================"
echo " SaludDeUna Web — Diagnóstico y corrección"
echo "======================================================"
echo "  Región : $REGION"
echo ""
echo "  --- Despliegue ---"
echo "  1) ECS task web se detiene (ExitCode / CannotPullContainerError)"
echo "  2) GitHub Actions deploy falló"
echo "  3) La web da error 502 Bad Gateway"
echo "  4) Auth0 no redirige correctamente"
echo ""
echo "  --- Datos ---"
echo "  5) JWT_SECRET del web no coincide con el backend"
echo "  6) Variables NEXT_PUBLIC_* incorrectas en la imagen"
echo ""
echo "  --- Operaciones ---"
echo "  7)  Ver logs del web en tiempo real"
echo "  8)  Forzar redeploy (sin rebuild)"
echo "  9)  Estado del ECS service web"
echo "  10) Últimas ejecuciones de GitHub Actions"
echo "  11) Disparar nuevo deploy desde aquí"
echo ""
echo "  --- Infraestructura ---"
echo "  12) Destruir infraestructura web  ⚠️  irreversible"
echo ""
read -rp "Elige [1-12]: " choice

case "$choice" in

  1)
    echo ""
    CL=$(get_cluster); SV=$(get_svc)
    [[ -z "$CL" || -z "$SV" ]] && { echo "  No se pudo obtener cluster/service."; exit 1; }
    TASK=$(aws ecs list-tasks \
      --cluster "$CL" --service-name "$SV" --desired-status STOPPED \
      --query 'taskArns[0]' --output text --region "$REGION" 2>/dev/null || echo "")
    if [[ -n "$TASK" && "$TASK" != "None" ]]; then
      aws ecs describe-tasks \
        --cluster "$CL" --tasks "$TASK" --region "$REGION" \
        --query 'tasks[0].{StopCode:stopCode,Reason:stoppedReason,Container:containers[0].{Name:name,ExitCode:exitCode,Reason:reason}}' \
        --output json 2>/dev/null
    else
      echo "  Sin tasks detenidas recientes."
    fi
    echo ""
    echo "  Causas comunes:"
    echo "    CannotPullContainerError → imagen no existe, ejecuta: opción 11"
    echo "    ExitCode 1  → error app, ver logs: opción 7"
    echo "    JWT_SECRET no encontrado → ejecuta: bash scripts/03-secrets.sh"
    ;;

  2)
    echo ""
    REPO_SLUG=$(get_repo_slug)
    echo "  El deploy del web lo hace GitHub Actions."
    echo "  Ver logs: https://github.com/${REPO_SLUG}/actions/workflows/deploy-aws.yml"
    echo ""
    GH_TOKEN=$(get_gh_token)
    if [[ -n "$GH_TOKEN" && "$GH_TOKEN" != "placeholder" ]]; then
      echo "  Últimas 3 ejecuciones:"
      curl -s \
        -H "Authorization: Bearer $GH_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/${REPO_SLUG}/actions/workflows/deploy-aws.yml/runs?per_page=3" \
        2>/dev/null | python3 -c "
import sys, json
d = json.load(sys.stdin)
for r in d.get('workflow_runs', []):
    status  = r.get('conclusion') or r.get('status', '?')
    created = r.get('created_at', '')[:19]
    url     = r.get('html_url', '')
    print(f'  {created}  {status:<12}  {url}')
" 2>/dev/null || echo "  (no se pudo leer vía API)"
    fi
    echo ""
    echo "  Causas comunes de fallo:"
    echo "    Secrets AWS expirados  → renovar AWS_ACCESS_KEY_ID/SECRET/SESSION_TOKEN"
    echo "    Variable faltante      → verificar AWS_REGION, ECS_CLUSTER, AUTH0_*, WEB_AUTH0_CLIENT_ID"
    echo "    Error next build       → revisar errores TypeScript o dependencias"
    echo "    ALB DNS cambió         → re-ejecutar: bash scripts/01-configure.sh"
    ;;

  3)
    echo ""
    echo "Error 502 = la task web no responde al ALB health check (/api/health)"
    echo ""
    TG_ARN=$(aws elbv2 describe-target-groups \
      --names "salud-de-una-dev-web" \
      --query 'TargetGroups[0].TargetGroupArn' \
      --output text --region "$REGION" 2>/dev/null || echo "")
    if [[ -n "$TG_ARN" && "$TG_ARN" != "None" ]]; then
      echo "  Estado del target group web:"
      aws elbv2 describe-target-health \
        --target-group-arn "$TG_ARN" --region "$REGION" \
        --query 'TargetHealthDescriptions[*].{IP:Target.Id,Port:Target.Port,State:TargetHealth.State,Reason:TargetHealth.Reason}' \
        --output table 2>/dev/null || echo "  (no se pudo consultar)"
    fi
    echo ""
    echo "  Pasos de diagnóstico:"
    echo "  1. ¿/api/health responde? → opción 7 para ver logs"
    echo "  2. ¿La task está en RUNNING? → opción 9"
    echo "  3. La ruta /api/health debe existir: app/api/health/route.ts en Next.js"
    ;;

  4)
    echo ""
    if [[ -f "$OUTPUTS" ]]; then
      APP=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['app_url']['value'])" 2>/dev/null || echo "")
    fi
    echo "  URLs que deben estar configuradas en Auth0 → Applications → tu SPA → Settings:"
    echo "    Allowed Callback URLs : ${APP:-http://<ALB-DNS>}/callback"
    echo "    Allowed Logout URLs   : ${APP:-http://<ALB-DNS>}"
    echo "    Allowed Web Origins   : ${APP:-http://<ALB-DNS>}"
    echo ""
    echo "  Variables de GitHub Actions que afectan el build:"
    REPO_SLUG=$(get_repo_slug)
    echo "    https://github.com/${REPO_SLUG}/settings/variables/actions"
    echo "    AUTH0_DOMAIN, AUTH0_AUDIENCE, WEB_AUTH0_CLIENT_ID"
    echo ""
    echo "  Si el ALB DNS o las URLs de Auth0 cambiaron → re-deploy:"
    echo "  bash scripts/04-build.sh"
    ;;

  5)
    echo ""
    WEB_JWT=$(aws ssm get-parameter --name "/${PROJECT_WEB}/JWT_SECRET" --with-decryption \
      --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")
    BE_JWT=$(aws ssm get-parameter --name "/${PROJECT_BE}/JWT_SECRET" --with-decryption \
      --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")

    if [[ -z "$WEB_JWT" || "$WEB_JWT" == "placeholder" ]]; then
      echo "  ❌ /${PROJECT_WEB}/JWT_SECRET = placeholder"
      echo "     Ejecuta: bash scripts/03-secrets.sh"
    elif [[ -z "$BE_JWT" || "$BE_JWT" == "placeholder" ]]; then
      echo "  ⚠️  Backend JWT_SECRET = placeholder — configura el backend primero"
    elif [[ "$WEB_JWT" == "$BE_JWT" ]]; then
      echo "  ✅ JWT_SECRET del web y backend coinciden."
    else
      echo "  ❌ JWT_SECRET no coinciden — el middleware Next.js fallará."
      echo ""
      echo "  Para sincronizar (copia del backend al web):"
      echo "  aws ssm put-parameter --name /${PROJECT_WEB}/JWT_SECRET \\"
      echo "    --value \"\$(aws ssm get-parameter --name /${PROJECT_BE}/JWT_SECRET \\"
      echo "      --with-decryption --query Parameter.Value --output text --region $REGION)\" \\"
      echo "    --type SecureString --overwrite --region $REGION"
      echo ""
      echo "  Luego fuerza redeploy: opción 8"
    fi
    ;;

  6)
    echo ""
    REPO_SLUG=$(get_repo_slug)
    echo "  Variables NEXT_PUBLIC_* se configuran como GitHub Variables y se bakean en la imagen."
    echo ""
    echo "  Variables actuales en GitHub:"
    echo "  https://github.com/${REPO_SLUG}/settings/variables/actions"
    echo ""
    echo "  Verifica que estén configuradas:"
    echo "    AUTH0_DOMAIN, AUTH0_AUDIENCE, WEB_AUTH0_CLIENT_ID"
    echo "    AWS_REGION, ECS_CLUSTER"
    echo ""
    echo "  El ALB DNS se lee automáticamente desde SSM en cada deploy."
    ALB=$(aws ssm get-parameter --name "/${PROJECT_BE}/infra/alb-dns" \
      --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")
    [[ -n "$ALB" ]] && echo "  ALB actual: $ALB (NEXT_PUBLIC_API_BASE_URL = http://$ALB/v1)"
    echo ""
    echo "  Si algún valor cambió → re-deploy: bash scripts/04-build.sh"
    ;;

  7)
    echo ""
    LG=$(get_log)
    [[ -z "$LG" ]] && { echo "  Log group no encontrado."; exit 1; }
    echo "  ¿Cuánto tiempo hacia atrás?"
    echo "  1) 5 min    2) 30 min    3) En vivo (Ctrl+C para salir)"
    read -rp "  Elige [1-3]: " log_time
    case "$log_time" in
      1) aws logs tail "$LG" --since 5m  --region "$REGION" ;;
      2) aws logs tail "$LG" --since 30m --region "$REGION" ;;
      3) aws logs tail "$LG" --follow    --region "$REGION" ;;
      *) echo "  Opción inválida" ;;
    esac
    ;;

  8)
    echo ""
    CL=$(get_cluster); SV=$(get_svc)
    [[ -z "$CL" || -z "$SV" ]] && { echo "  No se pudo obtener cluster/service."; exit 1; }
    aws ecs update-service \
      --cluster "$CL" --service "$SV" \
      --force-new-deployment \
      --region "$REGION" --no-cli-pager --output text > /dev/null \
      && echo "  ✅ Force new deployment iniciado. Espera ~3-5 min." \
      || echo "  ❌ Error al forzar deploy."
    ;;

  9)
    echo ""
    CL=$(get_cluster); SV=$(get_svc)
    [[ -z "$CL" || -z "$SV" ]] && { echo "  No se pudo obtener cluster/service."; exit 1; }
    aws ecs describe-services \
      --cluster "$CL" --services "$SV" \
      --region "$REGION" \
      --query 'services[0].{Service:serviceName,Desired:desiredCount,Running:runningCount,Pending:pendingCount,Rollout:deployments[0].rolloutState}' \
      --output table 2>/dev/null || echo "  (no se pudo consultar)"
    ;;

  10)
    echo ""
    REPO_SLUG=$(get_repo_slug)
    echo "  GitHub Actions — últimas ejecuciones:"
    echo "  https://github.com/${REPO_SLUG}/actions/workflows/deploy-aws.yml"
    echo ""
    GH_TOKEN=$(get_gh_token)
    if [[ -n "$GH_TOKEN" && "$GH_TOKEN" != "placeholder" ]]; then
      curl -s \
        -H "Authorization: Bearer $GH_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/${REPO_SLUG}/actions/workflows/deploy-aws.yml/runs?per_page=5" \
        2>/dev/null | python3 -c "
import sys, json
d = json.load(sys.stdin)
for r in d.get('workflow_runs', []):
    status  = r.get('conclusion') or r.get('status', '?')
    created = r.get('created_at', '')[:19]
    url     = r.get('html_url', '')
    print(f'  {created}  {status:<12}  {url}')
" 2>/dev/null || echo "  (no se pudo leer vía API)"
    fi
    ;;

  11)
    echo ""
    bash "$(dirname "${BASH_SOURCE[0]}")/04-build.sh"
    ;;

  12)
    echo ""
    echo "⚠️  DESTRUCCIÓN INFRAESTRUCTURA WEB"
    echo "    Elimina: ECS service web, ECR web, IAM refs..."
    echo "    El ALB y VPC del backend NO se verán afectados."
    echo ""
    read -rp "  Escribe 'DESTRUIR' para confirmar: " confirm
    if [[ "$confirm" == "DESTRUIR" ]]; then
      export PATH="$HOME/.local/bin:$PATH"
      cd "$TF_DIR"
      terraform destroy
      echo "  ✅ Infraestructura web destruida."
    else
      echo "  Cancelado."
    fi
    ;;

  *)
    echo "  Opción no válida."
    ;;
esac
