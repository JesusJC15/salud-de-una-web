#!/bin/bash
# Generar terraform.tfvars leyendo automáticamente la infra del backend desde SSM
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="$(dirname "$SCRIPT_DIR")/terraform"
ACCOUNT_ID=$(cat "$HOME/.sduna-web-account-id" 2>/dev/null || aws sts get-caller-identity --query Account --output text)
REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || echo "us-east-1")
PROJECT="salud-de-una"

ask() {
  local prompt="$1" default="$2"
  read -rp "  $prompt [$default]: " v
  echo "${v:-$default}"
}

echo "=============================================="
echo " SaludDeUna Web — Configuración"
echo "=============================================="
echo "  Cuenta : $ACCOUNT_ID"
echo "  Región : $REGION"
echo ""

# ── Leer infraestructura compartida del backend desde SSM ─────────────────────
echo ">>> Leyendo infraestructura del backend desde SSM..."
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
  echo "ERROR: No se encontró la infraestructura del backend en SSM."
  echo "       Asegúrate de haber ejecutado:"
  echo "       bash salud-de-una-backend/deploy/deploy.sh"
  exit 1
fi

echo "    ALB DNS       : $ALB_DNS"
echo "    ECS Cluster   : $CLUSTER"
echo "    Subnet A      : $SUBNET_A"
echo "    Subnet B      : $SUBNET_B"
echo "    Web TG ARN    : $WEB_TG_ARN"
echo "    Web SG ID     : $WEB_SG_ID"
echo ""

# ── GitHub ────────────────────────────────────────────────────────────────────
echo "--- Repositorio GitHub del web ---"
GITHUB_REPO=$(ask   "URL HTTPS del repo" "https://github.com/jesusjc15/salud-de-una-web")
GITHUB_BRANCH=$(ask "Rama de despliegue" "main")
echo ""

# ── Auth0 web SPA ─────────────────────────────────────────────────────────────
echo "--- Auth0 (SPA Web) ---"
echo "  Busca en Auth0 → Applications → tu Single Page Application"
AUTH0_DOMAIN=$(ask     "Domain (ej: tenant.us.auth0.com)"   "salud-de-una.us.auth0.com")
AUTH0_AUDIENCE=$(ask   "Audience / API Identifier"           "https://api.salud-de-una.com")
WEB_CLIENT_ID=$(ask    "SPA Client ID"                       "3NN7oWXQ8cm42AI8nsASi39rbHmbi1cR")
echo ""

# ── Capacidad de task (opcional) ──────────────────────────────────────────────
echo "--- Tamaño de task ECS Fargate Spot ---"
CONFIGURE_CAPACITY=$(ask "¿Personalizar tamaño? (s/N)" "n")
if [[ "${CONFIGURE_CAPACITY,,}" == "s" ]]; then
  WEB_CPU=$(ask "web CPU (256/512/1024)"         "256")
  WEB_MEM=$(ask "web Memoria MB (512/1024/2048)" "512")
else
  WEB_CPU=256
  WEB_MEM=512
fi
echo ""

# ── Generar terraform.tfvars ──────────────────────────────────────────────────
cat > "$TF_DIR/terraform.tfvars" << EOF
# Auto-generado por 01-configure.sh — NO subir a Git (.gitignore lo excluye)
# Generado: $(date -u '+%Y-%m-%dT%H:%M:%SZ')

aws_account_id = "$ACCOUNT_ID"
aws_region     = "$REGION"

github_repo   = "$GITHUB_REPO"
github_branch = "$GITHUB_BRANCH"

# Infraestructura compartida — leída automáticamente de SSM (backend-deploy)
alb_dns               = "$ALB_DNS"
ecs_cluster_name      = "$CLUSTER"
subnet_a_id           = "$SUBNET_A"
subnet_b_id           = "$SUBNET_B"
web_target_group_arn  = "$WEB_TG_ARN"
web_security_group_id = "$WEB_SG_ID"

# Auth0 web SPA (bakeado en la imagen Next.js durante CodeBuild)
auth0_domain       = "$AUTH0_DOMAIN"
auth0_audience     = "$AUTH0_AUDIENCE"
web_auth0_client_id = "$WEB_CLIENT_ID"

# Capacidad Fargate Spot
web_cpu    = $WEB_CPU
web_memory = $WEB_MEM
EOF

echo "✅ terraform.tfvars generado."
echo ""
echo "  Resumen:"
echo "    Auth0 Domain   : $AUTH0_DOMAIN"
echo "    SPA Client ID  : $WEB_CLIENT_ID"
echo "    GitHub Repo    : $GITHUB_REPO"
echo "    API base URL   : http://$ALB_DNS/v1"
echo "    Auth0 redirect : http://$ALB_DNS/callback"
echo ""
echo "SIGUIENTE: bash scripts/02-infra.sh"
