#!/bin/bash
set -euo pipefail
REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || echo "us-east-1")
OUTPUTS="$HOME/.sduna-web-tf-outputs.json"
[[ ! -f "$OUTPUTS" ]] && { echo "ERROR: Ejecuta primero 02-infra.sh"; exit 1; }
APP=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['app_url']['value'])")
LOG=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['cloudwatch_log_group']['value'])")
echo "=============================================="
echo " SaludDeUna Web — Verificacion"
echo "=============================================="
echo ""
echo -n "  /api/health -> "
curl -sf --max-time 10 "${APP}/api/health" -o /dev/null && echo "OK" || echo "NO RESPONDE"
echo -n "  Raiz        -> "
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$APP/")
echo "HTTP $CODE"
echo ""
echo "App : $APP"
echo "Log : aws logs tail $LOG --follow --region $REGION"
