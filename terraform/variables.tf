variable "aws_region" {
  description = "AWSリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "プロジェクト名（リソース名のプレフィックスに使用）"
  type        = string
  default     = "money-manager"
}

variable "ec2_key_name" {
  description = "EC2 SSH接続に使用するキーペア名（AWSコンソールで事前に作成が必要）"
  type        = string
}

variable "my_ip_cidr" {
  description = "SSH接続を許可する自分のIPアドレス（CIDR形式 例: 203.0.113.1/32）"
  type        = string
}

variable "db_username" {
  description = "RDS MySQLの管理ユーザー名（backend/config/database.ymlのproduction.usernameと一致させる必要がある）"
  type        = string
  default     = "backend"
}

variable "db_password" {
  description = "RDS MySQLのパスワード（terraform.tfvarsで指定。EC2上にBACKEND_DATABASE_PASSWORDとして注入される）"
  type        = string
  sensitive   = true
}

variable "rails_master_key" {
  description = "backend/config/master.keyの中身（terraform.tfvarsで指定。EC2上にRAILS_MASTER_KEYとして注入される）"
  type        = string
  sensitive   = true
}
