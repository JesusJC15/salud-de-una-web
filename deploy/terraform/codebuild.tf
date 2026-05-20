# aws_codebuild_source_credential NO esta aqui — es a nivel de cuenta.
# 03-secrets.sh lo actualiza con: aws codebuild import-source-credentials

locals {
  buildspec_web = yamlencode({
    version = "0.2"
    phases = {
      pre_build = { commands = [
        "aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY",
        "COMMIT_SHA=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c1-7)",
        "IMAGE_TAG=${COMMIT_SHA:-latest}"
      ] }
      build = { commands = [
        "echo Building web...",
        "docker build --target runner --build-arg NEXT_OUTPUT=standalone --build-arg NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL --build-arg NEXT_PUBLIC_AUTH0_DOMAIN=$NEXT_PUBLIC_AUTH0_DOMAIN --build-arg NEXT_PUBLIC_AUTH0_CLIENT_ID=$NEXT_PUBLIC_AUTH0_CLIENT_ID --build-arg NEXT_PUBLIC_AUTH0_AUDIENCE=$NEXT_PUBLIC_AUTH0_AUDIENCE --build-arg NEXT_PUBLIC_AUTH0_REDIRECT_URI=$NEXT_PUBLIC_AUTH0_REDIRECT_URI -t $ECR_REGISTRY/$WEB_REPO:$IMAGE_TAG -t $ECR_REGISTRY/$WEB_REPO:latest ."
      ] }
      post_build = { commands = [
        "docker push $ECR_REGISTRY/$WEB_REPO:$IMAGE_TAG",
        "docker push $ECR_REGISTRY/$WEB_REPO:latest",
        "echo Desplegando web en ECS...",
        "aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE_WEB --force-new-deployment --region $AWS_REGION --no-cli-pager",
        "echo Web desplegado. ECS reemplaza tasks gradualmente."
      ] }
    }
  })
}

resource "aws_codebuild_project" "web" {
  name          = "${local.prefix}-build-web"
  description   = "Build imagen web Next.js + push ECR + deploy ECS"
  build_timeout = 25
  service_role  = aws_iam_role.web_codebuild.arn
  source {
    type            = "GITHUB"
    location        = var.github_repo
    git_clone_depth = 1
    buildspec       = local.buildspec_web
  }
  source_version = var.github_branch
  environment {
    compute_type    = "BUILD_GENERAL1_SMALL"
    image           = "aws/codebuild/standard:7.0"
    type            = "LINUX_CONTAINER"
    privileged_mode = true

    environment_variable { name = "AWS_REGION";              value = var.aws_region }
    environment_variable { name = "ECR_REGISTRY";            value = local.ecr_base }
    environment_variable { name = "WEB_REPO";                value = aws_ecr_repository.web.name }
    environment_variable { name = "NEXT_PUBLIC_API_BASE_URL"; value = "http://${var.alb_dns}/v1" }
    environment_variable { name = "NEXT_PUBLIC_AUTH0_DOMAIN"; value = var.auth0_domain }
    environment_variable { name = "NEXT_PUBLIC_AUTH0_CLIENT_ID"; value = var.web_auth0_client_id }
    environment_variable { name = "NEXT_PUBLIC_AUTH0_AUDIENCE"; value = var.auth0_audience }
    environment_variable { name = "NEXT_PUBLIC_AUTH0_REDIRECT_URI"; value = "http://${var.alb_dns}/callback" }
    environment_variable { name = "ECS_CLUSTER";             value = var.ecs_cluster_name }
    environment_variable { name = "ECS_SERVICE_WEB";         value = aws_ecs_service.web.name }
  }
  artifacts { type = "NO_ARTIFACTS" }
  logs_config {
    cloudwatch_logs { group_name = "/codebuild/${local.prefix}/web"; stream_name = "build" }
  }
}
