output "web_ecr_url"            { value = aws_ecr_repository.web.repository_url }
output "codebuild_web_project"  { value = aws_codebuild_project.web.name }
output "cloudwatch_log_group"   { value = aws_cloudwatch_log_group.web.name }
output "ecs_service_name"       { value = aws_ecs_service.web.name }
output "app_url"                { value = "http://${var.alb_dns}" }
