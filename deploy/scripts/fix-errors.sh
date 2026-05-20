#!/bin/bash
REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || echo "us-east-1")
OUTPUTS="$HOME/.sduna-web-tf-outputs.json"
PROJECT_WEB="salud-de-una-web"
echo "=============================================="
echo " SaludDeUna Web — Diagnostico"
echo "=============================================="
echo "1) Tasks stopped  2) Ultimos logs  3) Verificar JWT_SECRET"
echo "4) Forzar redeploy  5) Estado CodeBuild  q) Salir"
read -rp "Opcion: " OPT
get_cluster() { aws ssm get-parameter --name /salud-de-una/infra/ecs-cluster-name \
  --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo ""; }
get_svc() { python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['ecs_service_name']['value'])" 2>/dev/null || echo ""; }
get_log() { python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['cloudwatch_log_group']['value'])" 2>/dev/null || echo ""; }
case "$OPT" in
  1)
    CL=$(get_cluster); SV=$(get_svc)
    TKS=$(aws ecs list-tasks --cluster "$CL" --service-name "$SV" --desired-status STOPPED \
      --region "$REGION" --query taskArns --output text 2>/dev/null || echo "")
    if [[ -n "$TKS" ]]; then
      aws ecs describe-tasks --cluster "$CL" --tasks $TKS --region "$REGION" \
        --query "tasks[*].{Status:lastStatus,Razon:stoppedReason}" --output table 2>/dev/null
    else
      echo "No hay tasks paradas."
    fi ;;
  2)
    LG=$(get_log)
    aws logs tail "$LG" --since 5m --region "$REGION" 2>/dev/null || echo "Sin logs." ;;
  3)
    V=$(aws ssm get-parameter --name "/${PROJECT_WEB}/JWT_SECRET" --with-decryption \
      --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "NO_EXISTE")
    [[ "$V" == "placeholder" || "$V" == "NO_EXISTE" ]] && echo "FALTA JWT_SECRET" || echo "JWT_SECRET OK" ;;
  4)
    CL=$(get_cluster); SV=$(get_svc)
    aws ecs update-service --cluster "$CL" --service "$SV" \
      --force-new-deployment --region "$REGION" --no-cli-pager --output text > /dev/null
    echo "Redeploy iniciado. Espera ~3 min." ;;
  5)
    CB=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['codebuild_web_project']['value'])" 2>/dev/null || echo "")
    IDS=$(aws codebuild list-builds-for-project --project-name "$CB" \
      --region "$REGION" --query "ids[0:5]" --output text 2>/dev/null | tr '\t' ' ')
    [[ -n "$IDS" ]] && aws codebuild batch-get-builds --ids $IDS --region "$REGION" \
      --query "builds[*].{ID:id,Status:buildStatus}" --output table 2>/dev/null ;;
  q|Q) echo "Saliendo." ;;
  *) echo "Invalido." ;;
esac
