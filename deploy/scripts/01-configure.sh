#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="$(dirname "$SCRIPT_DIR")/terraform"
ACCOUNT_ID=$(cat "$HOME/.sduna-web-account-id" 2>/dev/null || aws sts get-caller-identity --query Account --output text)
REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || echo "us-east-1")
PROJECT="salud-de-una"

ask() { read -rp "  $1 [$2]: " v; echo "${v:-$2}"; }

echo "=============================================="
echo " SaludDeUna Web — Configuracion"
echo "=============================================="
echo ""
echo ">>> Leyendo infraestructura compartida del backend desde SSM..."

read_ssm() {
  aws ssm get-parameter --name "/${PROJECT}/infra/$1" \
    --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo ""
}

ALB_DNS=$(read_ssm alb-dns)
CLUSTER=$(read_ssm ecs-cluster-name)
SUBNET_A=$(read_ssm subnet-a-id)
SUBNET_B=$(read_ssm subnet-b-id)
WEB_TG_ARN=$(read_ssm web-target-group-arn)
WEB_SG_ID=$(read_ssm web-security-group-id)

if [[ -z "$ALB_DNS" || -z "$CLUSTER" ]]; then
  echo ""
  echo "ERROR: No se encontro la infraestructura del backend en SSM."
  echo "       Asegurate de haber ejecutado el deploy del backend primero:"
  echo "       salud-de-una-backend/deploy/scripts/02-infra.sh"
  exit 1
fi

echo "    ALB DNS      : $ALB_DNS"
echo "    ECS Cluster  : $CLUSTER"
echo "    Subnet A     : $SUBNET_A"
echo "    Subnet B     : $SUBNET_B"
echo "    Web TG ARN   : $WEB_TG_ARN"
echo "    Web SG ID    : $WEB_SG_ID"
echo ""

echo "--- Repositorio GitHub del web ---"
GITHUB_REPO=$(ask "URL repo web" "https://github.com/jesusjc15/salud-de-una-web")
GITHUB_BRANCH=$(ask "Rama" "main")
echo ""

echo "--- Auth0 (SPA web) ---"
AUTH0_DOMAIN=$(ask "Domain" "salud-de-una.us.auth0.com")
AUTH0_AUDIENCE=$(ask "Audience" "https://api.salud-de-una.com")
WEB_AUTH0_CLIENT_ID=$(ask "SPA Client ID" "3NN7oWXQ8cm42AI8nsASi39rbHmbi1cR")
echo ""

cat > "$TF_DIR/terraform.tfvars" << EOF
# Auto-generado — NO subir a Git
aws_account_id = "$ACCOUNT_ID"
aws_region     = "$REGION"

github_repo   = "$GITHUB_REPO"
github_branch = "$GITHUB_BRANCH"

# Infraestructura compartida leida de SSM (backend-deploy)
alb_dns              = "$ALB_DNS"
ecs_cluster_name     = "$CLUSTER"
subnet_a_id          = "$SUBNET_A"
subnet_b_id          = "$SUBNET_B"
web_target_group_arn = "$WEB_TG_ARN"
web_security_group_id = "$WEB_SG_ID"

# Auth0 web SPA
auth0_domain       = "$AUTH0_DOMAIN"
auth0_audience     = "$AUTH0_AUDIENCE"
web_auth0_client_id = "$WEB_AUTH0_CLIENT_ID"
EOF

echo "terraform.tfvars generado. SIGUIENTE: bash scripts/02-infra.sh"
