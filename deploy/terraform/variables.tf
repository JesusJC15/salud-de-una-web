variable "aws_account_id" { type = string }
variable "aws_region"     { type = string; default = "us-east-1" }
variable "project"        { type = string; default = "salud-de-una" }
variable "env"            { type = string; default = "dev" }

variable "github_repo" {
  type        = string
  description = "URL del repo GitHub del web (ej: https://github.com/user/salud-de-una-web)"
}
variable "github_branch" { type = string; default = "main" }

# Valores de infraestructura compartida — leidos de SSM en 01-configure.sh
variable "alb_dns"            { type = string; description = "DNS del ALB (de backend-deploy SSM)" }
variable "ecs_cluster_name"   { type = string; description = "Nombre del ECS cluster" }
variable "subnet_a_id"        { type = string }
variable "subnet_b_id"        { type = string }
variable "web_target_group_arn" { type = string; description = "ARN del web target group (pre-creado por backend-deploy)" }
variable "web_security_group_id" { type = string; description = "SG del web (pre-creado por backend-deploy)" }

# Auth0 web SPA (bakeado en la imagen Next.js durante CodeBuild)
variable "auth0_domain"      { type = string }
variable "auth0_audience"    { type = string }
variable "web_auth0_client_id" { type = string }

variable "web_cpu"    { type = number; default = 256 }
variable "web_memory" { type = number; default = 512 }
