output "ec2_public_ip" {
  description = "サーバーの固定パブリックIP"
  value       = aws_eip.server.public_ip
}

output "ssh_command" {
  description = "SSH接続コマンド"
  value       = "ssh -i ~/.ssh/${var.ec2_key_name}.pem ec2-user@${aws_eip.server.public_ip}"
}

output "rds_endpoint" {
  description = "RDS MySQL エンドポイント（ホスト名のみ）"
  value       = aws_db_instance.mysql.address
}

output "rds_db_name" {
  description = "RDS 初期データベース名（Solid Cache/Queue/Cable用のDBはデプロイ時に rails db:prepare で追加作成される）"
  value       = aws_db_instance.mysql.db_name
}
