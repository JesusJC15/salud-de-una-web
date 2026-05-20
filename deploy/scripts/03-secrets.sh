#!/bin/bash
set -euo pipefail
REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || echo "us-east-1")
OUTPUTS="$HOME/.sduna-web-tf-outputs.json"
PROJECT_WEB="salud-de-una-web"
PROJECT_BE="salud-de-una"
echo "=============================================="
echo " SaludDeUna Web — Configurar secrets"
echo "=============================================="
echo ""
echo "--- JWT_SECRET para middleware Next.js ---"
echo "  Mismo valor que backend JWT_SECRET"
CURRENT=$(aws ssm get-parameter --name "/${PROJECT_WEB}/JWT_SECRET" --with-decryption \
  --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")
if [[ "$CURRENT" == "placeholder" || -z "$CURRENT" ]]; then
  read -rsp "  JWT_SECRET: " JVAL; echo ""
  if [[ -n "$JVAL" ]]; then
    aws ssm put-parameter --name "/${PROJECT_WEB}/JWT_SECRET" --value "$JVAL" \
      --type SecureString --overwrite --region "$REGION" --no-cli-pager --output text > /dev/null
    echo "  Guardado"
  fi
else
  echo "  JWT_SECRET ya configurado"
fi
echo ""
echo "--- GitHub token para CodeBuild ---"
GH=$(aws ssm get-parameter --name "/${PROJECT_BE}/GITHUB_TOKEN" --with-decryption \
  --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")
if [[ -n "$GH" && "$GH" != "placeholder" ]]; then
  echo "  Token del backend encontrado en SSM -> actualizando CodeBuild..."
  aws codebuild import-source-credentials \
    --token "$GH" --server-type GITHUB --auth-type PERSONAL_ACCESS_TOKEN \
    --region "$REGION" --no-cli-pager > /dev/null
  echo "  Credencial OK"
else
  read -rsp "  GITHUB_TOKEN (scope: repo): " GH_NEW; echo ""
  if [[ -n "$GH_NEW" ]]; then
    aws codebuild import-source-credentials \
      --token "$GH_NEW" --server-type GITHUB --auth-type PERSONAL_ACCESS_TOKEN \
      --region "$REGION" --no-cli-pager > /dev/null
    echo "  Credencial OK"
  fi
fi
if [[ -f "$OUTPUTS" ]]; then
  CB=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['codebuild_web_project']['value'])" 2>/dev/null || echo "")
  if [[ -n "$CB" ]]; then
    echo ""
    echo ">>> Configurando webhook (auto-build en push a main)..."
    FILTER='[[{"type":"EVENT","pattern":"PUSH"},{"type":"HEAD_REF","pattern":"^refs/heads/main$"}]]'
    aws codebuild create-webhook --project-name "$CB" \
      --filter-groups "$FILTER" --region "$REGION" --no-cli-pager > /dev/null 2>&1 \
      && echo "    Webhook creado" || echo "    Webhook ya existe"
  fi
fi
echo ""
echo "Secrets OK. SIGUIENTE: bash scripts/04-build.sh"
