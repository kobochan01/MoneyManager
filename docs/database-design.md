# データベース設計書 — MoneyManager

作成日: 2026-05-31

---

## テーブル一覧

| テーブル名 | 概要 |
|---|---|
| users | ユーザー情報 |
| groups | 家計簿グループ |
| group_members | グループとユーザーの中間テーブル |
| invitations | 招待トークン管理 |
| transactions | 収支記録 |
| categories | カテゴリ |
| fixed_expenses | 固定費設定 |
| user_settings | ユーザーごとの締め日設定 |

---

## テーブル定義

### users（ユーザー）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT | |
| name | VARCHAR(100) | NOT NULL | 表示名 |
| email | VARCHAR(255) | NOT NULL, UNIQUE | |
| password_digest | VARCHAR(255) | NOT NULL | bcryptハッシュ |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

---

### groups（家計簿グループ）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT | |
| name | VARCHAR(100) | NOT NULL | グループ名（例：〇〇家の家計簿） |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

---

### group_members（グループメンバー中間テーブル）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT | |
| group_id | BIGINT | NOT NULL, FK(groups.id) | |
| user_id | BIGINT | NOT NULL, FK(users.id) | |
| role | ENUM('owner','member') | NOT NULL, DEFAULT 'member' | ownerは招待送信権限あり |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

UNIQUE制約: (group_id, user_id)

---

### invitations（招待）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT | |
| group_id | BIGINT | NOT NULL, FK(groups.id) | 招待先グループ |
| invited_by | BIGINT | NOT NULL, FK(users.id) | 招待した人 |
| email | VARCHAR(255) | NOT NULL | 招待先メールアドレス |
| token | VARCHAR(255) | NOT NULL, UNIQUE | URLに含まれるランダムトークン |
| accepted_at | DATETIME | NULL | 受諾日時（NULLは未受諾） |
| expires_at | DATETIME | NOT NULL | 有効期限（発行から7日） |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

---

### categories（カテゴリ）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT | |
| group_id | BIGINT | NOT NULL, FK(groups.id) | グループ共有 |
| name | VARCHAR(100) | NOT NULL | カテゴリ名（例：食費） |
| transaction_type | ENUM('income','expense') | NOT NULL | 収入用 or 支出用 |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

UNIQUE制約: (group_id, name, transaction_type)

---

### transactions（収支記録）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT | |
| group_id | BIGINT | NOT NULL, FK(groups.id) | |
| user_id | BIGINT | NOT NULL, FK(users.id) | 登録したユーザー |
| category_id | BIGINT | NOT NULL, FK(categories.id) | |
| transaction_type | ENUM('income','expense') | NOT NULL | 収入 or 支出 |
| amount | DECIMAL(10,0) | NOT NULL | 金額（円、正の値） |
| date | DATE | NOT NULL | 取引日 |
| memo | TEXT | NULL | メモ |
| is_fixed | BOOLEAN | NOT NULL, DEFAULT FALSE | 固定費から自動生成された場合TRUE |
| fixed_expense_id | BIGINT | NULL, FK(fixed_expenses.id) | 固定費からの場合のみ |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

---

### fixed_expenses（固定費設定）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT | |
| group_id | BIGINT | NOT NULL, FK(groups.id) | |
| category_id | BIGINT | NOT NULL, FK(categories.id) | |
| name | VARCHAR(100) | NOT NULL | 固定費名（例：家賃） |
| amount | DECIMAL(10,0) | NOT NULL | 金額 |
| billing_day | TINYINT | NOT NULL | 引き落とし日（1〜31） |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

---

### user_settings（ユーザー設定）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT | |
| user_id | BIGINT | NOT NULL, UNIQUE, FK(users.id) | |
| billing_start_day | TINYINT | NOT NULL, DEFAULT 1 | 開始日（1〜31） |
| billing_end_day | TINYINT | NOT NULL, DEFAULT 31 | 締め日（1〜31） |
| week_start_day | ENUM('sunday','monday') | NOT NULL, DEFAULT 'sunday' | カレンダーの週の始まり曜日 |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

---

## ER図（テキスト表現）

```
users ─────────────── group_members ─── groups
  │                        │               │
  │                        │               ├── categories
  │                        │               ├── fixed_expenses
  │                        │               └── transactions
  │
  ├── user_settings
  └── invitations（invited_by）

transactions ──── categories
transactions ──── fixed_expenses（is_fixedがTRUEの場合）
```

---

## 設計上の補足

### 締め日ロジック
- `user_settings.billing_start_day = 21`, `billing_end_day = 20` の場合
- 「2026年5月分」= 2026-04-21 〜 2026-05-20 を指す
- バックエンドで期間計算を行い、API レスポンスに含める

### 固定費の自動計上ロジック
- 月次バッチ（またはカレンダー表示時）に固定費を計算
- `billing_day` が土日祝の場合、`holiday_jp` gem で翌営業日を算出
- `transactions` に `is_fixed = TRUE`, `fixed_expense_id` を設定して挿入
- 同月に同じ `fixed_expense_id` のレコードが既にあれば挿入しない（冪等性）

### カテゴリのサジェスト
- `categories` テーブルのレコードを `group_id` で絞り込んでフロントへ返す
- フロントでドロップダウン表示し、リストにない名前は新規カテゴリとして登録
