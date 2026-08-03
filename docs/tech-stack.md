# 技術スタック・構成 — MoneyManager

作成日: 2026-05-31

---

## 技術スタック

### フロントエンド

| 役割 | 技術 | 採用理由 |
|---|---|---|
| UIフレームワーク | Vue.js 3 | React（前作）と異なるフレームワークの習得 |
| 言語 | TypeScript | 型安全性の確保 |
| ビルドツール | Vite | 高速な開発サーバー |
| ルーティング | Vue Router 4 | Vue公式ルーター |
| 状態管理 | Pinia | Vue 3公式推奨の状態管理ライブラリ |
| HTTPクライアント | Axios | APIとの通信 |

### バックエンド

| 役割 | 技術 | 採用理由 |
|---|---|---|
| 言語 | Ruby 4.0.5（`backend/.ruby-version`） | Java（前作）と異なる言語の習得 |
| フレームワーク | Ruby on Rails 8（API mode） | 規約によりシンプルに構築できる |
| 認証 | bcrypt + JWT（gem: jwt） | パスワードハッシュ化と認証トークン管理 |
| 祝日判定 | holiday_jp gem | 日本の祝日カレンダー対応 |

### データベース

| 役割 | 技術 | 採用理由 |
|---|---|---|
| DB | MySQL 8 | PostgreSQL（前作）と異なるRDBの習得 |
| ORM | ActiveRecord（Rails標準） | Rails標準、シンプルなクエリ記述 |

### 開発環境

| 役割 | 技術 |
|---|---|
| コンテナ | Docker / Docker Compose |
| バックエンドポート | 3000 |
| フロントエンドポート | 5173 |
| DBポート | 3306 |

---

## システム構成図

```
ブラウザ（Vue.js 3）
     │
     │ HTTP / JSON（Axios）
     ▼
Rails API（Port:3000）
     │
     │ ActiveRecord
     ▼
MySQL 8（Port:3306）
```

---

## API設計方針

- RESTful API
- レスポンス形式: JSON
- 認証: JWTトークンをAuthorizationヘッダーで受け渡し
- エンドポイントのプレフィックス: `/api/v1/`

### 主なエンドポイント（予定）

| メソッド | パス | 概要 |
|---|---|---|
| POST | /api/v1/auth/signup | ユーザー登録 |
| POST | /api/v1/auth/login | ログイン |
| DELETE | /api/v1/auth/logout | ログアウト |
| GET | /api/v1/transactions | 収支一覧（期間指定） |
| POST | /api/v1/transactions | 収支登録 |
| PATCH | /api/v1/transactions/:id | 収支更新 |
| DELETE | /api/v1/transactions/:id | 収支削除 |
| GET | /api/v1/categories | カテゴリ一覧 |
| GET | /api/v1/fixed_expenses | 固定費一覧 |
| POST | /api/v1/fixed_expenses | 固定費登録 |
| PATCH | /api/v1/fixed_expenses/:id | 固定費更新 |
| DELETE | /api/v1/fixed_expenses/:id | 固定費削除 |
| GET | /api/v1/fixed_expenses/scheduled | 固定費の当月引き落とし日一覧（土日祝ずらし済み） |
| GET | /api/v1/summary | 月次集計 |
| GET | /api/v1/settings | ユーザー設定取得 |
| PATCH | /api/v1/settings | ユーザー設定更新 |
| GET | /api/v1/group | グループ情報・メンバー一覧取得 |
| POST | /api/v1/invitations | 招待URL発行 |
| GET | /api/v1/invitations/:token | 招待情報取得 |
| POST | /api/v1/invitations/:token/accept | 招待受諾・グループ参加 |

---

## 本番インフラ構成（AWS）

AWSインフラはTerraformで管理する。前回のカリキュラム課題（FirstTaskManager、React + Spring Boot + PostgreSQL）と同じ構成方針を踏襲し、技術スタック差分（Vue + Rails + MySQL）に合わせて変更している。

### リクエストの流れ

| パス | 処理 |
|------|------|
| `/*` | nginx が `/var/www/html` の Vue ビルド済みファイルを返す |
| `/api/*` | nginx が Puma（:3000）へリバースプロキシ |
| Puma → RDS | プライベートサブネット内の MySQL に接続 |

### ネットワーク構成

| リソース | 用途 |
|----------|------|
| VPC | 全リソースを格納するプライベートネットワーク |
| パブリックサブネット | EC2 を配置。Elastic IP で固定パブリック IP を付与 |
| プライベートサブネット（2 AZ）| RDS を配置。インターネットからの直接アクセス不可 |
| インターネットゲートウェイ | EC2 へのインバウンドを許可 |

### セキュリティグループ

| SG | 許可インバウンド |
|----|----------------|
| EC2 SG | SSH (22) — 自分の IP のみ／HTTP (80) — 公開 |
| RDS SG | MySQL (3306) — EC2 SG からのみ |

### EC2 内の構成

```
/opt/moneymanager/
└── backend/                # Railsアプリ本体（デプロイ時にscpで配置）

/var/www/html/              # nginx の配信ルート（Vueビルド成果物）
├── index.html
└── assets/

/etc/nginx/conf.d/
└── app.conf                # リバースプロキシ設定

/etc/moneymanager/
└── app.env                 # DB接続情報・RAILS_MASTER_KEY（環境変数、root読み取り専用）

/etc/systemd/system/
└── moneymanager.service    # Puma の自動起動サービス定義

/home/ec2-user/.rbenv/      # rbenvでビルドしたRuby（backend/.ruby-versionと同じバージョン）
```

### Terraformディレクトリ構成

```
terraform/
├── main.tf                    # プロバイダー・VPC・サブネット・SG・EC2・RDS
├── variables.tf                # 変数定義（リージョン・プロジェクト名・DB認証情報など）
├── outputs.tf                  # EC2パブリックIP・RDSエンドポイント・SSHコマンド
├── terraform.tfvars.example    # 変数値のテンプレート（実値は各自terraform.tfvarsにコピーして使う。gitignore済み）
└── terraform.tfvars            # 変数の実値（gitignore済み、各自ローカルで作成）
```

### デプロイフロー概要

```
ローカル
  1. terraform apply     → AWSにインフラを構築（EC2起動時にrbenvでRubyをビルド、nginx設定）
  2. npm run build        → Vueをビルド（dist/ 生成）
  3. scp dist/ → EC2      → フロントエンドをデプロイ
  4. scp backend/ → EC2   → バックエンドのソースをデプロイ
  5. EC2上で bundle install
  6. EC2上で RAILS_ENV=production bin/rails db:prepare
     （backend_production・_cache・_queue・_cable の4DBを作成・マイグレーション）
  7. systemctl restart moneymanager → Pumaを再起動
```
