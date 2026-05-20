#!/bin/bash
set -euo pipefail
REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || echo "us-east-1")
OUTPUTS="$HOME/.sduna-web-tf-outputs.json"
[[ ! -f "$OUTPUTS" ]] && { echo "ERROR: Ejecuta primero 02-infra.sh"; exit 1; }
CB=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['codebuild_web_project']['value'])")
echo "=============================================="
echo " SaludDeUna Web — Build + Deploy"
echo "=============================================="
echo "Proyecto: $CB"
BUILD_ID=$(aws codebuild start-build --project-name "$CB" --region "$REGION" --query build.id --output text)
echo "Build ID: $BUILD_ID"
echo "(Next.js puede tardar 15-20 min)"
echo ""
for i in $(seq 1 50); do
  STATUS=$(aws codebuild batch-get-builds --ids "$BUILD_ID" --region "$REGION" \
    --query builds[0].buildStatus --output text)
  PHASE=$(aws codebuild batch-get-builds --ids "$BUILD_ID" --region "$REGION" \
    --query builds[0].currentPhase --output text 2>/dev/null || echo "")
  echo "  [$i/50] $(date +%H:%M:%S) | $STATUS | $PHASE"
  case "$STATUS" in
    SUCCEEDED) echo ""; echo "Build OK. ECS desplegando."; echo "SIGUIENTE: 05-verify.sh (espera ~3 min)"; exit 0 ;;
    FAILED|FAULT|TIMED_OUT|STOPPED) echo "Build fallo: $STATUS"; exit 1 ;;
  esac
  sleep 30
done
echo "Timeout."; exit 1
