# MoneyManager

## 環境・起動

```powershell
# MySQL（Docker）起動 — 最初に実行
docker compose up -d

# バックエンド（Rails）起動
cd backend
rails server

# フロントエンド（Vue）起動
cd frontend
npm run dev

# 終了
# Rails / Vue: Ctrl+C
docker compose down

# DB初期化（初回 or リセット時）
cd backend
rails db:create
rails db:migrate
```

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フロントエンド | Vue.js 3 + TypeScript + Vite |
| 状態管理 | Pinia |
| バックエンド | Ruby on Rails 8（API mode） |
| データベース | MySQL 8 |
| コンテナ | Docker / Docker Compose |

## ポート

| サービス | ポート |
|---|---|
| Vue（フロントエンド） | 5173 |
| Rails（バックエンド） | 3000 |
| MySQL | 3306 |

## 技術スタック固有のルール

### フロントエンド（Vue 3 + TypeScript）
- `any` 型の使用禁止
- API通信は `frontend/src/api/` に切り出す
- 状態管理は Pinia を使う（`frontend/src/stores/`）
- ユーザー入力は API送信前にバリデーションを実施する

### バックエンド（Ruby on Rails）
- コントローラーは `app/controllers/api/v1/` 以下に配置する
- レスポンスは必ず JSON で返す
- 複数テーブルへの書き込みには `ActiveRecord::Base.transaction` を使う
- N+1クエリが発生しないよう `includes` を使う
- バリデーションはモデルに書く

### テスト（TDD）
- バックエンドのテスト実行: `cd backend && bundle exec rspec`
- フロントエンドのテスト実行: `cd frontend && npm test`
- バックエンド: RSpec でモデル・リクエストのテストを書く
- コードを追加・修正するたびに対応するテストを必ず書く

## GitHub 設定

- ラベル: `bug` / `enhancement` / `documentation` / `chore`
- PR テンプレート: `.github/PULL_REQUEST_TEMPLATE.md`

## ドキュメント更新対象

- README.md
- DEVELOPMENT.md
- docs/requirements.md
- docs/screen-design.md
- docs/database-design.md
- docs/tech-stack.md
