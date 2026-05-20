resource "aws_iam_role" "web_ecs_task_execution" {
  name = "${local.prefix}-web-ecs-task-execution"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow",
      Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
}
resource "aws_iam_role_policy_attachment" "web_ecs_execution_managed" {
  role       = aws_iam_role.web_ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
resource "aws_iam_role_policy" "web_ecs_ssm_read" {
  name = "${local.prefix}-web-ecs-ssm-read"
  role = aws_iam_role.web_ecs_task_execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["ssm:GetParameters","ssm:GetParameter"]
      Resource = "arn:aws:ssm:${var.aws_region}:${var.aws_account_id}:parameter/${var.project}-web/*"
    }]
  })
}
resource "aws_iam_role" "web_ecs_task" {
  name = "${local.prefix}-web-ecs-task"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow",
      Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
}
resource "aws_iam_role" "web_codebuild" {
  name = "${local.prefix}-web-codebuild"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow",
      Principal = { Service = "codebuild.amazonaws.com" } }]
  })
}
resource "aws_iam_role_policy" "web_codebuild_policy" {
  name = "${local.prefix}-web-codebuild-policy"
  role = aws_iam_role.web_codebuild.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow"
        Action = ["ecr:GetAuthorizationToken","ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer","ecr:BatchGetImage","ecr:PutImage",
          "ecr:InitiateLayerUpload","ecr:UploadLayerPart","ecr:CompleteLayerUpload"]
        Resource = "*" },
      { Effect = "Allow"
        Action = ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"]
        Resource = "*" },
      { Effect = "Allow"
        Action = ["ecs:UpdateService","ecs:DescribeServices"]
        Resource = "*" }
    ]
  })
}
