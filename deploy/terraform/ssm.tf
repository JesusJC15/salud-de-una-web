# JWT_SECRET server-side para el middleware de Next.js (no es NEXT_PUBLIC_)
resource "aws_ssm_parameter" "web_jwt_secret" {
  name        = "/${var.project}-web/JWT_SECRET"
  type        = "SecureString"
  value       = "placeholder"
  description = "Mismo valor que backend JWT_SECRET — para verificar tokens en middleware Next.js"
  lifecycle { ignore_changes = [value] }
}
