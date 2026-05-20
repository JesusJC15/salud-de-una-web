#!/bin/bash
# Trigger CodeBuild: build Next.js → push ECR → deploy ECS
set -euo pipefail

REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || echo "us-east-1")
OUTPUTS="$HOME/.sduna-web-tf-outputs.json"

[[ ! -f "$OUTPUTS" ]] && {
  echo "ERROR: tf-outputs.json no encontrado."
  echo "       Ejecuta primero: bash scripts/02-infra.sh"
  exit 1
}

CB=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['codebuild_web_project']['value'])")

echo "=============================================="
echo " SaludDeUna Web — Build + Deploy"
echo "=============================================="
echo "  CodeBuild  : $CB"
echo "  Región     : $REGION"
echo "  (Next.js puede tardar 15-20 min)"
echo ""

BUILD_ID=$(aws codebuild start-build \
  --project-name "$CB" \
  --region "$REGION" \
  --query build.id \
  --output text)

echo "  Build ID   : $BUILD_ID"
echo ""
echo "  Console (logs en tiempo real):"
echo "  https://${REGION}.console.aws.amazon.com/codesuite/codebuild/projects/${CB}/build/${BUILD_ID}/log?region=${REGION}"
echo ""
echo "Esperando resultado (máx ~25 min)..."
echo ""

START_TS=$(date +%s)
for i in $(seq 1 50); do
  BUILD_INFO=$(aws codebuild batch-get-builds \
    --ids "$BUILD_ID" --region "$REGION" \
    --query 'builds[0].{status:buildStatus,phase:currentPhase}' \
    --output json 2>/dev/null || echo '{"status":"UNKNOWN","phase":""}')

  STATUS=$(echo "$BUILD_INFO" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "UNKNOWN")
  PHASE=$(echo "$BUILD_INFO"  | python3 -c "import sys,json; print(json.load(sys.stdin).get('phase',''))" 2>/dev/null || echo "")
  ELAPSED=$(( $(date +%s) - START_TS ))

  printf "  [%02d/50] %s  %-20s  %-18s  %ds\n" \
    "$i" "$(date +%H:%M:%S)" "$STATUS" "$PHASE" "$ELAPSED"

  case "$STATUS" in
    SUCCEEDED)
      echo ""
      echo "✅ Build completado en ${ELAPSED}s"
      echo ""
      echo "  ECS está reemplazando las tasks (~3-5 min más)."
      echo "  Console ECS:"
      echo "  https://${REGION}.console.aws.amazon.com/ecs/v2/clusters?region=${REGION}"
      exit 0
      ;;
    FAILED|FAULT|TIMED_OUT|STOPPED)
      echo ""
      echo "❌ Build falló con status: $STATUS"
      echo ""
      LOG_INFO=$(aws codebuild batch-get-builds \
        --ids "$BUILD_ID" --region "$REGION" \
        --query 'builds[0].logs.{group:groupName,stream:streamName}' \
        --output json 2>/dev/null || echo '{}')
      LOG_GROUP=$(echo "$LOG_INFO"  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('group',''))"  2>/dev/null || echo "")
      LOG_STREAM=$(echo "$LOG_INFO" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('stream',''))" 2>/dev/null || echo "")

      if [[ -n "$LOG_GROUP" && "$LOG_GROUP" != "null" ]]; then
        echo "  --- Últimas 30 líneas del build ---"
        aws logs get-log-events \
          --log-group-name "$LOG_GROUP" \
          --log-stream-name "$LOG_STREAM" \
          --limit 30 --region "$REGION" \
          --query 'events[*].message' --output text 2>/dev/null | tail -30 || true
        echo ""
        echo "  Log completo:"
        echo "  aws logs get-log-events --log-group-name '$LOG_GROUP' --log-stream-name '$LOG_STREAM' --region $REGION --output text --query 'events[*].message'"
      fi

      echo ""
      echo "  Diagnóstico: bash scripts/fix-errors.sh → opción 2"
      exit 1
      ;;
  esac
  sleep 30
done

echo ""
echo "❌ Timeout (25 min). El build sigue corriendo en background."
echo "   Verifica en:"
echo "   https://${REGION}.console.aws.amazon.com/codesuite/codebuild/projects/${CB}/history?region=${REGION}"
exit 1
