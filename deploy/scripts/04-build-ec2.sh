#!/bin/bash
# ============================================================
# Build Next.js via EC2 temporal (cuando GitHub Actions no está disponible).
#
# Lanza un t2.micro que:
#   1. Clona el repo público salud-de-una-web
#   2. Construye la imagen Docker con las variables NEXT_PUBLIC_* bakeadas
#   3. Sube la imagen a ECR
#   4. Fuerza redeploy en ECS
#   5. Se auto-termina
#
# USO: bash deploy/scripts/04-build-ec2.sh
# ============================================================
set -euo pipefail

REGION=$(cat "$HOME/.sduna-web-region" 2>/dev/null || echo "us-east-1")
OUTPUTS="$HOME/.sduna-web-tf-outputs.json"
TF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/terraform"
PROJECT_BE="salud-de-una"
export PATH="$HOME/.local/bin:$PATH"

[[ ! -f "$OUTPUTS" ]] && {
  echo "ERROR: tf-outputs.json no encontrado. Ejecuta primero 02-infra.sh"
  exit 1
}

# Leer valores de terraform.tfvars
read_tfvar() {
  grep "^${1}" "$TF_DIR/terraform.tfvars" 2>/dev/null | \
    sed 's/.*= *"\(.*\)".*/\1/' | head -1 || echo ""
}

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_BASE="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
GITHUB_REPO=$(read_tfvar github_repo)
AUTH0_DOMAIN=$(read_tfvar auth0_domain)
AUTH0_AUDIENCE=$(read_tfvar auth0_audience)
AUTH0_CLIENT_ID=$(read_tfvar web_auth0_client_id)
ALB_DNS=$(aws ssm get-parameter --name "/${PROJECT_BE}/infra/alb-dns" \
  --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")
SVC_NAME=$(python3 -c "import json; d=json.load(open('$OUTPUTS')); print(d['ecs_service_name']['value'])" 2>/dev/null || echo "salud-de-una-dev-web")
CLUSTER="salud-de-una-dev"
VPC_ID=$(aws ssm get-parameter --name "/${PROJECT_BE}/infra/vpc-id" \
  --query Parameter.Value --output text --region "$REGION" 2>/dev/null || "")
SUBNET_ID=$(aws ssm get-parameter --name "/${PROJECT_BE}/infra/subnet-a-id" \
  --query Parameter.Value --output text --region "$REGION" 2>/dev/null || "")

echo "=============================================="
echo " SaludDeUna Web — Build via EC2 temporal"
echo "=============================================="
echo "  Repo          : $GITHUB_REPO"
echo "  ECR           : $ECR_BASE/salud-de-una/web"
echo "  ALB           : $ALB_DNS"
echo "  Auth0 Domain  : $AUTH0_DOMAIN"
echo "  Auth0 Client  : $AUTH0_CLIENT_ID"
echo "  Auth0 Audience: $AUTH0_AUDIENCE"
echo "  ECS Service   : $SVC_NAME"
echo ""
echo "  Las variables NEXT_PUBLIC_* se bakean en la imagen durante el build."
echo "  Tiempo estimado: ~20-25 minutos."
echo ""
read -rp "¿Continuar? (s/N): " confirm
[[ "${confirm,,}" != "s" ]] && { echo "Cancelado."; exit 0; }

[[ -z "$VPC_ID" || -z "$SUBNET_ID" ]] && {
  echo "ERROR: No se pudo leer VPC o subnet desde SSM."
  exit 1
}

AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023*" "Name=architecture,Values=x86_64" "Name=state,Values=available" \
  --query "sort_by(Images, &CreationDate)[-1].ImageId" \
  --output text --region "$REGION")
echo "  AMI : $AMI_ID"

SG_ID=$(aws ec2 create-security-group \
  --group-name "sduna-web-builder-$(date +%s)" \
  --description "Temporal: build Docker web" \
  --vpc-id "$VPC_ID" \
  --query 'GroupId' --output text --region "$REGION")

aws ec2 authorize-security-group-egress \
  --group-id "$SG_ID" \
  --ip-permissions '[{"IpProtocol":"-1","IpRanges":[{"CidrIp":"0.0.0.0/0"}]}]' \
  --region "$REGION" 2>/dev/null || true

USER_DATA=$(cat <<USERDATA
#!/bin/bash
exec > >(tee /var/log/sduna-web-build.log 2>&1) 2>&1
set -euo pipefail
echo "=== SaludDeUna Web Build - \$(date) ==="
TOKEN=\$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
EC2_REGION=\$(curl -s -H "X-aws-ec2-metadata-token: \$TOKEN" http://169.254.169.254/latest/meta-data/placement/region)
INSTANCE_ID=\$(curl -s -H "X-aws-ec2-metadata-token: \$TOKEN" http://169.254.169.254/latest/meta-data/instance-id)
echo "Región: \$EC2_REGION | Instancia: \$INSTANCE_ID"
dnf install -y docker git
systemctl start docker
aws ecr get-login-password --region \$EC2_REGION | docker login --username AWS --password-stdin ${ECR_BASE}
echo ">>> Clonando ${GITHUB_REPO}..."
git clone --depth 1 ${GITHUB_REPO} /tmp/web
echo ">>> Construyendo imagen Next.js (puede tardar 10-15 min)..."
docker build --target runner \
  --build-arg NEXT_OUTPUT=standalone \
  --build-arg "NEXT_PUBLIC_API_BASE_URL=https://${ALB_DNS}/v1" \
  --build-arg "NEXT_PUBLIC_AUTH0_DOMAIN=${AUTH0_DOMAIN}" \
  --build-arg "NEXT_PUBLIC_AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID}" \
  --build-arg "NEXT_PUBLIC_AUTH0_AUDIENCE=${AUTH0_AUDIENCE}" \
  --build-arg "NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://${ALB_DNS}/callback" \
  -t ${ECR_BASE}/salud-de-una/web:latest \
  /tmp/web
echo ">>> Subiendo imagen a ECR..."
docker push ${ECR_BASE}/salud-de-una/web:latest
echo ">>> Forzando redeploy en ECS..."
aws ecs update-service \
  --cluster ${CLUSTER} \
  --service ${SVC_NAME} \
  --force-new-deployment \
  --region \$EC2_REGION \
  --no-cli-pager
echo "ALL_DONE"
sleep 10
aws ec2 terminate-instances --instance-ids \$INSTANCE_ID --region \$EC2_REGION > /dev/null
USERDATA
)

echo ""
echo ">>> Lanzando EC2 t2.micro..."
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --instance-type "t2.medium" \
  --iam-instance-profile Name=LabInstanceProfile \
  --security-group-ids "$SG_ID" \
  --subnet-id "$SUBNET_ID" \
  --associate-public-ip-address \
  --user-data "$USER_DATA" \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=sduna-web-builder},{Key=Project,Value=salud-de-una}]" \
  --query 'Instances[0].InstanceId' \
  --output text --region "$REGION")

echo "    Instancia: $INSTANCE_ID"
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"
echo ""
echo "Monitoreando build... (máx 40 min, Ctrl+C para salir — el build sigue en background)"

DONE=false; ELAPSED=0
while [[ "$DONE" == "false" && $ELAPSED -lt 2400 ]]; do
  sleep 30; ELAPSED=$((ELAPSED + 30))
  OUTPUT=$(aws ec2 get-console-output --instance-id "$INSTANCE_ID" --region "$REGION" \
    --query 'Output' --output text 2>/dev/null | base64 --decode 2>/dev/null || echo "")
  [[ -n "$OUTPUT" ]] && echo "$OUTPUT" | grep -E "(>>>|ALL_DONE|[Ee]rror)" | tail -3 || true
  echo "  [$(date '+%H:%M:%S')] ${ELAPSED}s..."
  INST_STATE=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" \
    --query 'Reservations[0].Instances[0].State.Name' --output text --region "$REGION" 2>/dev/null || echo "unknown")
  [[ "$INST_STATE" == "terminated" || "$INST_STATE" == "shutting-down" ]] && DONE=true
  echo "$OUTPUT" | grep -q "ALL_DONE" && DONE=true
done

aws ec2 delete-security-group --group-id "$SG_ID" --region "$REGION" 2>/dev/null || true

echo ""
if [[ "$DONE" == "true" ]]; then
  echo "✅ Build completado. ECS desplegando nueva imagen."
  echo "   Verifica con: bash scripts/05-verify.sh (espera ~3 min)"
else
  echo "⚠️  Timeout. Verifica en AWS Console → EC2 → $INSTANCE_ID → System Log"
fi
