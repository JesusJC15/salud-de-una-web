terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = var.project
      Env       = var.env
      Service   = "web"
      ManagedBy = "Terraform"
    }
  }
}

locals {
  prefix   = "${var.project}-${var.env}"
  ecr_base = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}
