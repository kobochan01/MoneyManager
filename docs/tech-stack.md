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
| 言語 | Ruby 3.3 | Java（前作）と異なる言語の習得 |
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
