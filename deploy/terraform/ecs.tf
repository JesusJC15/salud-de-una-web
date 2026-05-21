resource "aws_cloudwatch_log_group" "web" {
  name              = "/ecs/${var.project}/${var.env}/web"
  retention_in_days = 7
}

# El ECS service se adjunta al target group pre-creado por backend-deploy.
# No modifica el ALB ni el listener — solo registra contenedores en el TG existente.
resource "aws_ecs_task_definition" "web" {
  family                   = "${local.prefix}-web"
  cpu                      = var.web_cpu
  memory                   = var.web_memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn            = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([{
    name      = "web"
    image     = "${aws_ecr_repository.web.repository_url}:latest"
    essential = true
    portMappings = [{ containerPort = 3001, protocol = "tcp" }]
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT",     value = "3001" },
      # NEXT_PUBLIC_* NO se inyectan aqui — se bakean en la imagen durante CodeBuild
    ]
    secrets = [
      { name = "JWT_SECRET", valueFrom = aws_ssm_parameter.web_jwt_secret.arn }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.web.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
    healthCheck = {
      command     = ["CMD-SHELL", "wget -qO /dev/null http://localhost:3001/api/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 30
    }
  }])
}

resource "aws_ecs_service" "web" {
  name            = "${local.prefix}-web"
  cluster         = var.ecs_cluster_name
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = 1

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
  }

  network_configuration {
    subnets          = [var.subnet_a_id, var.subnet_b_id]
    security_groups  = [var.web_security_group_id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = var.web_target_group_arn
    container_name   = "web"
    container_port   = 3001
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }
}
