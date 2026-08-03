# 開発ワークフロー — MoneyManager

このドキュメントは、MoneyManagerを開発するための手順をまとめたものです。
初めてRuby on Railsを触る方でも迷わないよう、「なぜその操作をするのか」も含めて説明します。

---

## 目次

1. [全体の流れ](#1-全体の流れ)
2. [環境構築](#2-環境構築)
3. [プロジェクトの起動方法](#3-プロジェクトの起動方法)
4. [機能開発の進め方](#4-機能開発の進め方)
5. [Gitブランチ戦略](#5-gitブランチ戦略)
6. [テストの書き方・実行方法](#6-テストの書き方実行方法)
7. [よく使うコマンド集](#7-よく使うコマンド集)
8. [AWSへのデプロイ](#awsへのデプロイ)

---

## 1. 全体の流れ

開発は大きく「環境構築」→「機能開発の繰り返し」という2段階で進みます。

```
【環境構築】（最初に1回だけ行う）
  Ruby・Rails・Vueのインストール
  Docker で MySQL を起動
  プロジェクトの初期セットアップ

       ↓ 完了したら以下を繰り返す

【機能開発サイクル】（1機能ごとに繰り返す）

  ① Issue 作成        何を作るかをGitHubに記録する
       ↓
  ② ブランチ作成      mainから分岐して作業場所を作る
       ↓
  ③ バックエンド実装  Railsでデータの保存・取得を作る
     （テスト → 実装 → テスト通過）
       ↓
  ④ フロントエンド実装 VueでUIを作り、APIと繋げる
       ↓
  ⑤ 動作確認         ブラウザで実際に動かして確認
       ↓
  ⑥ PR作成 → マージ  レビューして main に取り込む
```

### なぜこの順番なのか

- **Issue → ブランチ**：何のための変更かを記録することで、後から見返したときに意図が分かる
- **テスト → 実装**：先にテストを書くことで「何が完成したら OK か」が明確になる（TDD）
- **バックエンド → フロントエンド**：データの構造を先に固めることで、UI側の実装がスムーズになる

---

## 2. 環境構築

### 2-1. Ruby のインストール（Windows）

Ruby はプログラミング言語です。Rails はその上で動くフレームワークなので、まず Ruby を入れます。

1. [RubyInstaller](https://rubyinstaller.org/downloads/) にアクセス
2. **Ruby+Devkit 3.3.x (x64)** をダウンロード（`WITH DEVKIT` と書かれているもの）
3. インストーラーを実行し、すべてデフォルトのまま進める
4. 最後に `ridk install` のチェックが出たら **そのまま Enter**（必要なツールが入る）
5. インストール完了後、PowerShell を**新しく開き直して**確認

```powershell
ruby --version
# → ruby 3.3.x ... と表示されれば OK
```

### 2-2. Rails のインストール

Rails は Ruby の「gem（ライブラリ）」として提供されています。
Ruby が入れば `gem install` コマンドで追加できます。

```powershell
gem install rails
rails --version
# → Rails 8.x.x と表示されれば OK
```

### 2-3. プロジェクトのセットアップ

#### バックエンド（Rails）

```powershell
# MoneyManager フォルダに移動
cd C:\Projects\MoneyManager

# Rails API プロジェクトを作成
# --api        : APIモード（HTMLを返さない、JSONのみ）
# --database=mysql : DBにMySQLを使う
# --skip-test  : デフォルトのテストをスキップ（RSpecを使うため）
rails new backend --api --database=mysql --skip-test

cd backend

# RSpec（テストツール）などを Gemfile に追加後
bundle install
```

#### フロントエンド（Vue）

```powershell
# MoneyManager フォルダに戻る
cd C:\Projects\MoneyManager

# Vue + TypeScript + Vite のプロジェクトを作成
npm create vue@latest frontend
# 対話形式の質問：
#   TypeScript → Yes
#   Vue Router → Yes
#   Pinia      → Yes
#   その他     → No

cd frontend
npm install
```

#### Docker（MySQL）

`docker-compose.yml` を作成してMySQLを起動します。

```powershell
# MoneyManager フォルダで
cd C:\Projects\MoneyManager
docker compose up -d
# → MySQLコンテナが起動する
```

#### データベースの作成

```powershell
cd C:\Projects\MoneyManager\backend
rails db:create    # データベースを作成
rails db:migrate   # テーブルを作成（マイグレーション実行）
```

---

## 3. プロジェクトの起動方法

開発するときは毎回この手順で各サービスを起動します。

### ターミナルを3つ開いて、それぞれで実行する

```
ターミナル①：MySQL（Docker）
ターミナル②：Rails（バックエンド）
ターミナル③：Vue（フロントエンド）
```

#### ターミナル① MySQL を起動

```powershell
cd C:\Projects\MoneyManager
docker compose up -d
```

> `docker compose up -d` の `-d` は「バックグラウンドで起動」という意味。
> 起動したら以降はこのターミナルは閉じてOK。

#### ターミナル② Rails を起動

```powershell
cd C:\Projects\MoneyManager\backend
rails server
# → http://localhost:3000 で Rails が起動
```

#### ターミナル③ Vue を起動

```powershell
cd C:\Projects\MoneyManager\frontend
npm run dev
# → http://localhost:5173 で Vue が起動
```

### 各サービスのURL一覧

| サービス | URL | 用途 |
|---|---|---|
| Vue（フロントエンド） | http://localhost:5173 | ブラウザで画面確認 |
| Rails（バックエンドAPI） | http://localhost:3000 | APIのエンドポイント |
| MySQL | localhost:3306 | DB（直接アクセスは基本しない） |

### 終了方法

- Rails・Vue：ターミナルで `Ctrl + C`
- MySQL：`docker compose down`

---

## 4. 機能開発の進め方

1機能を開発する具体的な手順です。「ユーザー登録機能」を例に説明します。

### ① GitHub Issue を作成する

**なぜ作るのか**：「今から何をするか」を記録するため。ブランチ名やコミットメッセージに Issue番号を使うことで、後から「このコードは何のために書いたか」が追跡できる。

1. GitHub のリポジトリページを開く
2. `Issues` タブ → `New issue`
3. タイトル例：`ユーザー登録・ログイン機能を実装する`
4. ラベル：`enhancement`
5. 作成すると Issue番号（例：`#1`）が付く

---

### ② ブランチを作成する

**なぜ作るのか**：`main`ブランチを常に動く状態に保つため。作業は必ず専用ブランチで行う。

```powershell
# main ブランチを最新にしてから分岐する
git checkout main
git pull origin main

# ブランチを作成して移動
# 命名規則: feature/[Issue番号]-[英語kebab-case]
git checkout -b feature/1-user-authentication
```

---

### ③ バックエンドを実装する（Rails）

Rails の開発は以下の順番で進めます。

```
マイグレーション（テーブル設計）
  → モデル（データのルール）
  → コントローラー（リクエストの処理）
  → ルーティング（URLの定義）
  → テスト
```

#### ステップ1：マイグレーションファイルを作成する

マイグレーションとは「データベースのテーブルを作る・変更する指示書」です。

```powershell
cd C:\Projects\MoneyManager\backend

# User テーブルを作るマイグレーションを生成
rails generate migration CreateUsers name:string email:string:uniq password_digest:string
```

生成されたファイル（`db/migrate/日付_create_users.rb`）を確認・修正してから：

```powershell
rails db:migrate   # 実際にDBにテーブルを作る
```

#### ステップ2：モデルを作る

モデルはデータのルール（バリデーション）を定義する場所です。

```powershell
# app/models/user.rb が生成される
rails generate model User --skip-migration
# （マイグレーションは先ほど作ったのでスキップ）
```

#### ステップ3：コントローラーを作る

コントローラーはAPIのリクエストを受け取り、レスポンスを返す場所です。

```powershell
rails generate controller api/v1/auth
# → app/controllers/api/v1/auth_controller.rb が生成される
```

#### ステップ4：ルーティングを定義する

`config/routes.rb` にURLとコントローラーの対応を書きます。

```ruby
# config/routes.rb の例
namespace :api do
  namespace :v1 do
    post 'auth/signup', to: 'auth#signup'
    post 'auth/login',  to: 'auth#login'
  end
end
```

#### ステップ5：テストを書いて実行する

```powershell
# テストを実行
bundle exec rspec

# すべて緑（PASSED）になるまで実装を修正する
```

---

### ④ フロントエンドを実装する（Vue）

#### ステップ1：画面コンポーネントを作る

`frontend/src/views/` にページコンポーネントを作ります。

```
frontend/src/
  views/
    LoginView.vue       ← ログイン画面
    SignupView.vue      ← 新規登録画面
    CalendarView.vue    ← カレンダー画面（メイン）
  components/
    TransactionModal.vue ← 収支登録モーダル
  stores/
    auth.ts             ← 認証状態の管理（Pinia）
  api/
    auth.ts             ← APIとの通信処理
```

#### ステップ2：APIと繋げる

Axiosを使ってRailsのAPIを呼び出します。

```typescript
// frontend/src/api/auth.ts の例
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:3000/api/v1' })

export const signup = (params: { name: string; email: string; password: string }) =>
  api.post('/auth/signup', params)
```

#### ステップ3：ブラウザで動作確認する

http://localhost:5173 を開いて実際に操作して確認します。

---

### ⑤ PR を作成する

```powershell
# 変更をステージング
git add backend/app/models/user.rb
git add backend/app/controllers/api/v1/auth_controller.rb
# （関係するファイルを個別に追加する）

# コミット
git commit -m "feat: ユーザー登録・ログイン機能を実装するため認証APIを追加する

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

# リモートにプッシュ
git push origin feature/1-user-authentication
```

GitHubでPRを作成し、URLをチームに共有 → kobochanがマージ。

---

## 5. Gitブランチ戦略

### ブランチの種類

| ブランチ | 用途 | 直接push |
|---|---|---|
| `main` | 常に動く本番相当のコード | **禁止** |
| `feature/[番号]-[説明]` | 機能追加 | OK（自分のブランチ） |
| `fix/[番号]-[説明]` | バグ修正 | OK（自分のブランチ） |

### ブランチ名の例

```
feature/1-user-authentication   ← Issue#1 のユーザー認証
feature/2-transaction-crud      ← Issue#2 の収支登録
fix/5-calendar-date-bug         ← Issue#5 の日付バグ修正
```

### よくある操作

```powershell
# 現在のブランチを確認
git branch

# ブランチを切り替える
git checkout feature/1-user-authentication

# main の最新を取り込む（作業中に main が進んだとき）
git fetch origin
git merge origin/main
```

---

## 6. テストの書き方・実行方法

このプロジェクトは **TDD（テスト駆動開発）** を採用しています。
「コードを書く前にテストを書く」ことが基本です。

### なぜテストを先に書くのか

- 「何が完成したら OK か」を先に定義できる
- 後から機能を変更したとき、壊れていないか自動で確認できる
- バグの早期発見につながる

### バックエンドのテスト（RSpec）

```powershell
cd C:\Projects\MoneyManager\backend

# 全テストを実行
bundle exec rspec

# 特定のファイルだけ実行
bundle exec rspec spec/models/user_spec.rb

# 特定の行だけ実行
bundle exec rspec spec/models/user_spec.rb:10
```

テストファイルの場所：

```
backend/spec/
  models/           ← モデルのテスト（バリデーション等）
  requests/         ← APIエンドポイントのテスト
```

### フロントエンドのテスト（Vitest）

```powershell
cd C:\Projects\MoneyManager\frontend

# テストを実行
npm test
```

---

## 7. 実装済みAPIエンドポイント

すべてのエンドポイントはベースURL `http://localhost:3000/api/v1` に続けて使います。
認証が必要なエンドポイントは `Authorization: Bearer <token>` ヘッダーを付けてください。

### 認証

| メソッド | パス | 認証 | 説明 |
|---|---|---|---|
| POST | `/auth/signup` | 不要 | ユーザー登録 |
| POST | `/auth/login` | 不要 | ログイン |
| DELETE | `/auth/logout` | 必要 | ログアウト |

リクエスト例（signup / login）：

```json
{
  "user": {
    "name": "テストユーザー",
    "email": "user@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }
}
```

### 収支

| メソッド | パス | 認証 | 説明 |
|---|---|---|---|
| GET | `/transactions` | 必要 | 収支一覧（自グループ） |
| POST | `/transactions` | 必要 | 収支登録 |
| PUT | `/transactions/:id` | 必要 | 収支更新 |
| DELETE | `/transactions/:id` | 必要 | 収支削除 |

リクエスト例（POST /transactions）：

```json
{
  "transaction": {
    "transaction_type": "expense",
    "amount": 3000,
    "date": "2026-05-31",
    "category_name": "食費",
    "memo": "スーパー"
  }
}
```

---

## 8. フロントエンドのファイル構成

フェーズ2以降のフロントエンドファイル構成です。

```
frontend/src/
  api/
    client.ts          ← Axiosクライアント（Bearer トークン自動付与）
    auth.ts            ← 認証API（signup / login / logout）
    transactions.ts    ← 収支CRUD API（index / create / update / destroy）
    types.ts           ← 共通型定義（User, Transaction, リクエスト型 等）
  stores/
    auth.ts            ← 認証ストア（Pinia）
    transactions.ts    ← 収支ストア（Pinia）: 一覧・集計・CRUD
    __tests__/
      transactions.spec.ts  ← Vitestテスト（9件）
  components/
    TransactionModal.vue    ← 収支登録・編集モーダル（S-05）
  views/
    LoginView.vue      ← ログイン画面
    SignupView.vue     ← 新規登録画面
    HomeView.vue       ← 収支一覧・サマリー画面（S-04の基礎）
  router/
    index.ts           ← ルーティング定義・ナビゲーションガード
```

### フロントエンドのテスト実行

```powershell
cd C:\Projects\MoneyManager\frontend

# テスト実行（Vitest）
npm run test:unit -- --run

# 型チェック
npm run type-check
```

---

## 9. よく使うコマンド集

### Rails コマンド

```powershell
# サーバー起動
rails server

# マイグレーション実行
rails db:migrate

# マイグレーションをやり直す（最後の1つを取り消して再実行）
rails db:rollback && rails db:migrate

# DBの状態を確認（どのマイグレーションが適用済みか）
rails db:migrate:status

# Railsコンソール（Rubyコードを対話的に実行できる、デバッグに便利）
rails console

# ルーティング一覧を確認
rails routes

# ファイル自動生成
rails generate model    [モデル名]
rails generate controller [コントローラー名]
rails generate migration  [マイグレーション名]
```

### Docker コマンド

```powershell
# MySQL を起動
docker compose up -d

# MySQL を停止
docker compose down

# 起動中のコンテナを確認
docker compose ps

# MySQLのログを確認
docker compose logs db
```

### Git コマンド

```powershell
# 現在の状態を確認
git status

# 変更差分を確認
git diff

# ファイルをステージング
git add [ファイルパス]

# コミット
git commit -m "[コミットメッセージ]"

# リモートにプッシュ
git push origin [ブランチ名]

# リモートから最新を取得
git pull origin main

# ブランチを作成して移動
git checkout -b [ブランチ名]

# コミット履歴を確認
git log --oneline
```

### npm コマンド

```powershell
# 開発サーバー起動
npm run dev

# テスト実行
npm test

# ビルド（本番用ファイルを生成）
npm run build
```

---

## AWSへのデプロイ

インフラはTerraformで管理する（`terraform/`ディレクトリ）。構成の詳細は[docs/tech-stack.md](docs/tech-stack.md)を参照。

### 初回セットアップ（インフラ構築）

```powershell
cd terraform
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars を編集する（自分のIP・DBパスワード・RAILS_MASTER_KEYなど）
terraform init
terraform apply
```

- EC2起動時、`user_data`がRuby(rbenvでビルド)・nginx・systemdサービスを自動セットアップする（完了まで10分程度）
- 初回のRubyビルドはCPU負荷が高いため、`main.tf`の`credit_specification`を一時的に`unlimited`にしてから`terraform apply`し、**完了後は必ず`standard`に戻す**こと（無料枠を超えないため）

### アプリケーションのデプロイ（コード更新時）

```powershell
# 1. フロントエンドをビルドしてEC2へ転送
cd frontend
npm run build
scp -i ~/.ssh/money-manager-key.pem -r dist/* ec2-user@<EC2のIP>:/tmp/frontend-dist/
ssh -i ~/.ssh/money-manager-key.pem ec2-user@<EC2のIP> "sudo cp -r /tmp/frontend-dist/. /var/www/html/ && sudo chown -R nginx:nginx /var/www/html"

# 2. バックエンドをgit archiveで固めて転送
#    （backend/tmpやmaster.keyなどgitignore対象は自動的に除外される）
cd ..
git archive --format=tar.gz -o backend.tar.gz HEAD:backend
scp -i ~/.ssh/money-manager-key.pem backend.tar.gz ec2-user@<EC2のIP>:/tmp/
ssh -i ~/.ssh/money-manager-key.pem ec2-user@<EC2のIP> "tar -xzf /tmp/backend.tar.gz -C /opt/moneymanager/backend"

# 3. EC2にSSHして依存関係のインストール・DBマイグレーション・再起動
ssh -i ~/.ssh/money-manager-key.pem ec2-user@<EC2のIP>
export PATH="$HOME/.rbenv/shims:$HOME/.rbenv/bin:$PATH"
cd /opt/moneymanager/backend
bundle install
RAILS_ENV=production DB_HOST=<RDSエンドポイント> BACKEND_DATABASE_PASSWORD=<パスワード> RAILS_MASTER_KEY=<マスターキー> ruby bin/rails db:migrate
sudo systemctl restart moneymanager
```

### ハマりどころ

- `bin/rails`に実行権限がなく`Permission denied`になることがある（Windows上でcommitされたファイルのため）→ `ruby bin/rails ...` の形で実行する
- `/etc/moneymanager/app.env`はroot専用権限のため`ec2-user`から`source`できない → SSHでの手動実行時は環境変数を直接指定する
- t3.microはメモリが少ないため、`bundle install`は`bundle config set jobs 1`で直列インストールにしないとメモリ不足でプロセスが強制終了することがある

---

## トラブルシューティング

### Rails サーバーが起動しない

```powershell
# ポート3000がすでに使われているか確認
netstat -ano | findstr :3000
# PIDが表示されたら
taskkill /PID [表示されたPID] /F
```

### DB接続エラーが出る

```powershell
# Dockerが起動しているか確認
docker compose ps
# 止まっていたら起動
docker compose up -d
```

### bundle install でエラーが出る

```powershell
# Windowsの場合、一部のgemはC拡張が必要
# RubyInstallerのDevkitが入っているか確認
ridk enable
bundle install
```

### ログインしても画面が遷移しない（CORSエラー）

Viteの開発サーバーは通常 `localhost:5173` で起動しますが、すでに使用中の場合は `localhost:5174` 以降に切り替わります。
RailsのCORS設定は `localhost:5173` と `localhost:5174` の両方を許可しています。

```powershell
# Viteのポートを確認（npm run dev 実行時のログ）
# → Local: http://localhost:5173/ または 5174/

# 使用ポートを固定したい場合は frontend/vite.config.ts に追記
# server: { port: 5173 }
```
