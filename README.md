# 介護シフト作成システム (Care Shift System)

介護施設向けのシフト管理システムです。

## 必要環境

- Node.js 18以上
- npm

## セットアップ

### 1. リポジトリをクローン

```bash
git clone <repository-url>
cd unti
```

### 2. 依存関係をインストール

```bash
# ルートで実行
npm install
npm run setup
```

## 起動方法

### 開発環境

```bash
# フロントエンドとバックエンドを同時に起動
npm run dev
```

- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:3001

### 本番環境

```bash
# ビルド
npm run build

# 起動
npm start
```

## デモアカウント

システム起動後、以下のアカウントでログインできます:

| ロール | メールアドレス | パスワード |
|--------|----------------|------------|
| 管理者 | admin@example.com | password |
| スタッフ | user@example.com | password |

## API エンドポイント

- `GET /api/health` - ヘルスチェック
- `POST /api/auth/login` - ログイン
- `GET /api/staff` - スタッフ一覧
- `GET /api/shifts` - シフト一覧
- `GET /api/patterns` - シフトパターン一覧

## 技術スタック

- **フロントエンド**: React 18, TypeScript, Vite
- **バックエンド**: Express, TypeScript
- **認証**: JWT

## ディレクトリ構成

```
├── frontend/          # Reactフロントエンド
│   └── src/
├── backend/           # Express APIサーバー
│   └── src/
├── docs/              # ドキュメント
└── render.yaml        # Renderデプロイ設定
```

## デプロイ

[Render](https://render.com) にデプロイ可能です。`render.yaml` の設定を使用してください。

## ライセンス

Private
