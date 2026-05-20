resource "aws_ecr_repository" "web" {
  name                 = "${var.project}/web"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}
resource "aws_ecr_lifecycle_policy" "web" {
  repository = aws_ecr_repository.web.name
  policy = jsonencode({
    rules = [{ rulePriority = 1, description = "Mantener 10 imagenes",
      selection = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 10 },
      action = { type = "expire" } }]
  })
}
