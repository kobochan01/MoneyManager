terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.aws_region
}

# ─── VPC ───────────────────────────────────────────────────────────

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "${var.project_name}-vpc" }
}

# ─── Subnet ────────────────────────────────────────────────────────

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = { Name = "${var.project_name}-public" }
}

# ─── Internet Gateway ──────────────────────────────────────────────

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "${var.project_name}-igw" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.project_name}-public-rt" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# ─── Security Group ────────────────────────────────────────────────

resource "aws_security_group" "ec2" {
  name   = "${var.project_name}-ec2-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    description = "SSH (my IP only)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  ingress {
    description = "HTTP (nginx - frontend + API proxy, public)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-ec2-sg" }
}

# ─── RDS Private Subnets ───────────────────────────────────────────

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}a"

  tags = { Name = "${var.project_name}-private-a" }
}

resource "aws_subnet" "private_c" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "${var.aws_region}c"

  tags = { Name = "${var.project_name}-private-c" }
}

# ─── RDS Security Group ─────────────────────────────────────────────

resource "aws_security_group" "rds" {
  name   = "${var.project_name}-rds-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    description     = "MySQL from EC2 only"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-rds-sg" }
}

# ─── DB Subnet Group ────────────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_c.id]

  tags = { Name = "${var.project_name}-db-subnet-group" }
}

# ─── RDS ────────────────────────────────────────────────────────────

resource "aws_db_instance" "mysql" {
  identifier        = "${var.project_name}-db"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_type      = "gp2"

  # backend/config/database.yml の production.primary.database と一致させる
  db_name  = "backend_production"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  publicly_accessible = false
  skip_final_snapshot = true
  deletion_protection = false

  tags = { Name = "${var.project_name}-db" }
}

# ─── EC2 ───────────────────────────────────────────────────────────

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_instance" "backend" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  key_name               = var.ec2_key_name

  # user_dataはインスタンス初回起動時にしか実行されないため、変更を確実に反映させるには
  # 作り直し（再作成）が必要。デフォルト(false)だとその場更新扱いになり再実行されない
  user_data_replace_on_change = true

  # unlimitedにするとCPUクレジットを使い切った後も追加課金してバーストし続けるため、
  # 無料枠を超えないようstandard（クレジット切れ後は基準値まで性能が落ちるだけ）にする
  credit_specification {
    cpu_credits = "standard"
  }

  # NOTE: bundle install・DBマイグレーション・moneymanagerサービスの起動は
  # アプリコードが存在しないためここでは行わない。デプロイ時に別途SSHで実行する。
  user_data = <<-EOF
    #!/bin/bash
    set -eux

    dnf update -y
    dnf install -y nginx git gcc make patch bzip2 \
      openssl-devel readline-devel zlib-devel libyaml-devel libffi-devel ncurses-devel \
      mariadb105-devel

    mkdir -p /var/www/html
    chown -R nginx:nginx /var/www/html

    mkdir -p /opt/moneymanager
    chown -R ec2-user:ec2-user /opt/moneymanager

    # t3.microはメモリが1GB弱しかなく、Rubyのビルド（make）でメモリ不足になりOOM Killされるため、
    # スワップ領域を用意して逃げ場を作る
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab

    # rbenv + ruby-build で backend/.ruby-version と同じRubyをビルドする
    sudo -u ec2-user -H bash <<'RBENV'
    set -eux
    # 並列コンパイルによる同時メモリ使用量の増加を避けるため直列ビルドにする
    export MAKE_OPTS='-j1'
    # /tmpはtmpfs（メモリ上のディスク、約460MBしかない）なのでビルド作業場所をディスク上の/var/tmpにする
    export TMPDIR='/var/tmp'
    git clone https://github.com/rbenv/rbenv.git ~/.rbenv
    git clone https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build
    echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bash_profile
    echo 'eval "$(rbenv init -)"' >> ~/.bash_profile
    export PATH="$HOME/.rbenv/bin:$PATH"
    eval "$(rbenv init -)"
    rbenv install 4.0.5
    rbenv global 4.0.5
    gem install bundler
    RBENV

    cat > /etc/nginx/conf.d/app.conf <<'NGINX'
    server {
        listen 80;
        server_name _;
        root /var/www/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api/ {
            proxy_pass http://localhost:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    NGINX

    mkdir -p /etc/moneymanager
    : > /etc/moneymanager/app.env
    echo "RAILS_ENV=production" >> /etc/moneymanager/app.env
    echo "DB_HOST=${aws_db_instance.mysql.address}" >> /etc/moneymanager/app.env
    echo "BACKEND_DATABASE_PASSWORD=${var.db_password}" >> /etc/moneymanager/app.env
    echo "RAILS_MASTER_KEY=${var.rails_master_key}" >> /etc/moneymanager/app.env
    chmod 600 /etc/moneymanager/app.env

    cat > /etc/systemd/system/moneymanager.service <<'SERVICE'
    [Unit]
    Description=MoneyManager Puma
    After=network.target

    [Service]
    Type=simple
    User=ec2-user
    WorkingDirectory=/opt/moneymanager/backend
    EnvironmentFile=/etc/moneymanager/app.env
    ExecStart=/home/ec2-user/.rbenv/shims/bundle exec puma -C config/puma.rb
    Restart=on-failure

    [Install]
    WantedBy=multi-user.target
    SERVICE

    systemctl daemon-reload
    systemctl enable nginx
    systemctl start nginx
    systemctl enable moneymanager
  EOF

  tags = { Name = "${var.project_name}-server" }
}

resource "aws_eip" "server" {
  instance = aws_instance.backend.id
  domain   = "vpc"

  tags = { Name = "${var.project_name}-eip" }
}
