# AWS Academy (Vocareum) NO permite crear IAM roles (iam:CreateRole denegado).
# Usamos el LabRole pre-existente que ya tiene permisos amplios (AdministratorAccess).
# Este rol se usa para ECS task execution, ECS task y CodeBuild del web.
data "aws_iam_role" "lab_role" {
  name = "LabRole"
}
