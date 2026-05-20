#!/bin/bash
# Diagnosticar y corregir errores comunes del web durante/después del deploy
set -euo pipefail

REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || echo "us-east-1")
OUTPUTS="$HOME/.sduna-web-tf-outputs.json"
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

get_cb() {
  [[ -f "$OUTPUTS" ]] && \
    python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['codebuild_web_project']['value'])" 2>/dev/null \
    || echo ""
}

echo "======================================================"
echo " SaludDeUna Web — Diagnóstico y corrección"
echo "======================================================"
echo "  Región : $REGION"
echo ""
echo "  --- Despliegue ---"
echo "  1) ECS task web se detiene (ExitCode / CannotPullContainerError)"
echo "  2) CodeBuild del web falla"
echo "  3) La web da error 502 Bad Gateway"
echo "  4) Auth0 no redirige correctamente (callback URL incorrecta)"
echo ""
echo "  --- Datos ---"
echo "  5) JWT_SECRET del web no coincide con el backend"
echo "  6) NEXT_PUBLIC_* variables incorrectas en la imagen"
echo ""
echo "  --- Operaciones ---"
echo "  7)  Ver logs del web en tiempo real"
echo "  8)  Forzar redeploy (sin rebuild)"
echo "  9)  Estado del ECS service web"
echo "  10) Historial de builds CodeBuild del web"
echo ""
echo "  --- Infraestructura ---"
echo "  11) Destruir infraestructura web  ⚠️  irreversible"
echo ""
read -rp "Elige [1-11]: " choice

case "$choice" in

  1)
    echo ""
    CL=$(get_cluster); SV=$(get_svc)
    if [[ -z "$CL" || -z "$SV" ]]; then echo "  No se pudo obtener cluster/service."; exit 1; fi
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
    echo "    CannotPullContainerError → imagen no existe, ejecuta: bash scripts/04-build.sh"
    echo "    ExitCode 1 → error app, ver logs: opción 7"
    echo "    JWT_SECRET no encontrado → ejecuta: bash scripts/03-secrets.sh"
    ;;

  2)
    echo ""
    CB=$(get_cb)
    [[ -z "$CB" ]] && { read -rp "  Nombre del proyecto CodeBuild web: " CB; }
    BUILD_ID=$(aws codebuild list-builds-for-project \
      --project-name "$CB" --sort-order DESCENDING \
      --query 'ids[0]' --output text --region "$REGION" 2>/dev/null || echo "")
    [[ -z "$BUILD_ID" || "$BUILD_ID" == "None" ]] && { echo "  Sin builds encontrados."; exit 1; }
    STATUS=$(aws codebuild batch-get-builds \
      --ids "$BUILD_ID" --region "$REGION" \
      --query 'builds[0].buildStatus' --output text 2>/dev/null || echo "?")
    echo "  Último build: $BUILD_ID → $STATUS"
    echo ""
    LOGS=$(aws codebuild batch-get-builds \
      --ids "$BUILD_ID" --region "$REGION" \
      --query 'builds[0].logs.{group:groupName,stream:streamName}' \
      --output json 2>/dev/null || echo '{}')
    LOG_GROUP=$(echo "$LOGS"  | python3 -c "import sys,json; print(json.load(sys.stdin).get('group',''))"  2>/dev/null || echo "")
    LOG_STREAM=$(echo "$LOGS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('stream',''))" 2>/dev/null || echo "")
    if [[ -n "$LOG_GROUP" && "$LOG_GROUP" != "null" ]]; then
      echo "  --- Últimas 40 líneas ---"
      aws logs get-log-events \
        --log-group-name "$LOG_GROUP" --log-stream-name "$LOG_STREAM" \
        --limit 40 --region "$REGION" \
        --query 'events[*].message' --output text 2>/dev/null | tail -40 || true
    fi
    echo ""
    echo "  Causas comunes del web:"
    echo "    next build falla → verifica errores TypeScript o dependencias"
    echo "    Timeout → Next.js tarda mucho, el build_timeout en codebuild.tf puede necesitar aumentar"
    echo "    Error de Auth0 build-time → verifica las variables NEXT_PUBLIC_AUTH0_* en codebuild.tf"
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
    echo "  Pasos:"
    echo "  1. ¿/api/health responde en producción? → opción 7 para ver logs"
    echo "  2. ¿La task está en RUNNING? → opción 9"
    echo "  3. La ruta /api/health debe existir en Next.js (app/api/health/route.ts)"
    ;;

  4)
    echo ""
    if [[ -f "$OUTPUTS" ]]; then
      APP=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['app_url']['value'])" 2>/dev/null || echo "")
    fi
    echo "  URLs configuradas en Auth0 que deben coincidir exactamente:"
    echo "    Allowed Callback URLs : ${APP:-http://<ALB-DNS>}/callback"
    echo "    Allowed Logout URLs   : ${APP:-http://<ALB-DNS>}"
    echo "    Allowed Web Origins   : ${APP:-http://<ALB-DNS>}"
    echo ""
    echo "  Ve a: Auth0 → Applications → tu SPA → Settings"
    echo ""
    echo "  En Next.js el NEXT_PUBLIC_AUTH0_REDIRECT_URI bakeado en la imagen debe ser:"
    echo "    ${APP:-http://<ALB-DNS>}/callback"
    echo "  Si cambió el ALB DNS → rebuildea con: bash scripts/04-build.sh"
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
      echo "  ⚠️  Backend JWT_SECRET = placeholder — configura primero el backend"
    elif [[ "$WEB_JWT" == "$BE_JWT" ]]; then
      echo "  ✅ JWT_SECRET del web y del backend coinciden."
    else
      echo "  ❌ JWT_SECRET del web y del backend NO coinciden."
      echo "     El middleware Next.js no podrá verificar tokens del backend."
      echo ""
      echo "  Para sincronizarlos (copia el del backend al web):"
      echo "  aws ssm put-parameter --name /${PROJECT_WEB}/JWT_SECRET \\"
      echo "    --value \"\$(aws ssm get-parameter --name /${PROJECT_BE}/JWT_SECRET --with-decryption --query Parameter.Value --output text --region $REGION)\" \\"
      echo "    --type SecureString --overwrite --region $REGION"
      echo ""
      echo "  Luego fuerza redeploy: opción 8"
    fi
    ;;

  6)
    echo ""
    CB=$(get_cb)
    [[ -z "$CB" ]] && { echo "  CodeBuild project no encontrado."; exit 1; }
    echo "  Variables NEXT_PUBLIC_* bakeadas en el CodeBuild project $CB:"
    aws codebuild batch-get-projects \
      --names "$CB" --region "$REGION" \
      --query 'projects[0].environment.environmentVariables[?starts_with(name, `NEXT_PUBLIC_`)].{Name:name,Value:value}' \
      --output table 2>/dev/null || echo "  (no se pudo consultar)"
    echo ""
    echo "  Si algún valor es incorrecto, actualiza terraform.tfvars y re-aplica:"
    echo "  bash scripts/02-infra.sh && bash scripts/04-build.sh"
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
    CB=$(get_cb)
    [[ -z "$CB" ]] && { echo "  CodeBuild project no encontrado."; exit 1; }
    IDS=$(aws codebuild list-builds-for-project \
      --project-name "$CB" --sort-order DESCENDING \
      --region "$REGION" --query 'ids[0:5]' --output text 2>/dev/null | tr '\t' ' ')
    if [[ -n "$IDS" && "$IDS" != "None" ]]; then
      echo "  Últimos 5 builds de $CB:"
      # shellcheck disable=SC2086
      aws codebuild batch-get-builds --ids $IDS --region "$REGION" \
        --query 'builds[*].{ID:id,Status:buildStatus,Start:startTime}' \
        --output table 2>/dev/null
    fi
    ;;

  11)
    echo ""
    echo "⚠️  DESTRUCCIÓN DE INFRAESTRUCTURA WEB"
    echo ""
    echo "  Elimina: ECS service web, ECR repo web, CodeBuild web, IAM roles web..."
    echo "  El ALB y la red compartida (creados por el backend) NO se ven afectados."
    echo ""
    read -rp "  Escribe 'DESTRUIR' para confirmar: " confirm
    if [[ "$confirm" == "DESTRUIR" ]]; then
      TF_DIR="$(dirname "${BASH_SOURCE[0]}")/../terraform"
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
