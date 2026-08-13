# MoneyManager

家族・同居人と共有できる家計簿Webアプリケーションです。
カレンダー形式で収支を管理し、残高状況をテープ表示で直感的に把握できます。

---

## 主な機能

| 機能 | 状態 |
|---|---|
| ユーザー登録・ログイン | 完了 |
| 収入・支出の登録 | 完了 |
| カレンダー表示（緑/赤テープ） | 完了 |
| カテゴリ管理 | 完了 |
| 締め日・週始まり曜日設定 | 完了 |
| 固定費管理（土日祝→翌営業日ルール） | 完了 |
| 月次集計 | 一部完了（期間集計は完了、カテゴリ別集計は未着手） |
| グループ招待・共有 | 完了 |

---

## デモ

https://github.com/user-attachments/assets/03751d95-8e4b-449e-b50f-639a1dfd7b12

---

## デプロイ

AWS（EC2 + RDS）にデプロイ済みです。インフラはTerraformで管理しています（[terraform/](terraform/)）。
本番環境のURLは別途共有します。

---

## 技術スタック

| 領域 | 技術 |
|---|---|
| フロントエンド | Vue.js 3 + TypeScript + Vite |
| 状態管理 | Pinia |
| バックエンド | Ruby on Rails 8（API mode） |
| データベース | MySQL 8 |
| コンテナ | Docker / Docker Compose |

---

## セットアップ

詳細は [DEVELOPMENT.md](DEVELOPMENT.md) を参照してください。

```powershell
# MySQL（Docker）起動
docker compose up -d

# バックエンド起動
cd backend
rails server

# フロントエンド起動
cd frontend
npm run dev
```

| サービス | URL |
|---|---|
| フロントエンド | http://localhost:5173 |
| バックエンドAPI | http://localhost:3000 |

---

## ドキュメント

| ドキュメント | リンク |
|---|---|
| 要件定義書 | [docs/requirements.md](docs/requirements.md) |
| 画面設計書 | [docs/screen-design.md](docs/screen-design.md) |
| DB設計書 | [docs/database-design.md](docs/database-design.md) |
| 技術スタック | [docs/tech-stack.md](docs/tech-stack.md) |
| 開発ワークフロー | [DEVELOPMENT.md](DEVELOPMENT.md) |
