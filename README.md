# Smart Money Screener

スマートマネーのネットフローをリアルタイムでスクリーニングするAPIです。[Nansen](https://nansen.ai) のスマートマネーデータを取得し、[x402プロトコル](https://x402.org) によるBase USDC決済ゲートを通じて提供します。

## 概要

| 項目 | 内容 |
|------|------|
| 対象チェーン | Solana・Base |
| データソース | Nansen Smart Money Flows API |
| 集計期間 | 直近24時間 |
| 決済 | Base上のUSDC $0.05/クエリ（x402プロトコル） |
| デプロイ先 | Vercel |

## エンドポイント

```
GET /api/screener/smart-money
```

### フィルタ条件

| 指標 | 閾値 |
|------|------|
| Smart Money Wallets | > 5 |
| Net Flow | > $5,000 |
| Unique Wallets | > 20 |

### スコアリング

条件を満たしたトークンを以下の重み付きスコアで降順ソートします。

```
score = SM数(正規化) × 0.40
      + ネットフロー(正規化) × 0.40
      + ユニーク数(正規化) × 0.20
```

各指標の正規化上限: SM数 = 100、ネットフロー = $1,000,000、ユニーク数 = 500

### レスポンス例

```json
{
  "timestamp": "2025-01-15T12:00:00.000Z",
  "total_scanned": 248,
  "tokens": [
    {
      "symbol": "TOKEN",
      "chain": "solana",
      "smart_money_wallets": 42,
      "net_flow_usd": 280000,
      "unique_wallets": 150,
      "score": 0.2840,
      "nansen_url": "https://app.nansen.ai/token/solana/0xabc...?tab=smart-money"
    }
  ]
}
```

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成します。

```bash
cp .env.example .env.local
```

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `NANSEN_API_KEY` | ✅ | [Nansen](https://nansen.ai) で取得したAPIキー |
| `PAYMENT_RECIPIENT_ADDRESS` | ✅ | 受取ウォレットのBaseアドレス（`0x...`） |
| `X402_FACILITATOR_URL` | — | カスタムfacilitator URL（未設定時はx402デフォルト） |

### 3. 開発サーバーの起動

```bash
npm run dev
```

`http://localhost:3000` でサーバーが起動します。

## x402決済について

このAPIは [x402プロトコル](https://x402.org) を実装しています。クライアントはリクエスト前に **$0.05 USDC（Base）** を支払う必要があります。

### x402対応クライアントからの利用例

```bash
# x402-fetch などのx402対応HTTPクライアントを使用
npx x402-fetch https://your-domain.vercel.app/api/screener/smart-money
```

### curlで確認（402レスポンスの確認）

```bash
curl -i https://your-domain.vercel.app/api/screener/smart-money
# HTTP/2 402
# x-payment-requirements: {...}
```

## Vercelへのデプロイ

### 1. Vercel CLIでデプロイ

```bash
npm i -g vercel
vercel --prod
```

### 2. 環境変数をVercelに設定

```bash
vercel env add NANSEN_API_KEY
vercel env add PAYMENT_RECIPIENT_ADDRESS
```

またはVercelダッシュボードの **Settings > Environment Variables** から設定します。

## x402scan への登録

x402scan の「Add your API」フォームには **実際のAPIエンドポイントURL** を入力してください。
x402scanはそのURLに直接リクエストを送り、402レスポンスを確認します。

```
https://your-domain.vercel.app/api/screener/smart-money
```

> **注意**: `/.well-known/x402.json` のURLを入力しても「Expected 402 response」エラーになります。
> Discovery documentはAIエージェントによる自動検出用であり、x402scan登録には使いません。

### Discovery エンドポイント（AIエージェント向け）

| URL | 内容 |
|-----|------|
| `/.well-known/x402.json` | `ListDiscoveryResourcesResponse` 形式のdiscoveryドキュメント（`/api/x402` へrewrite） |
| `/api/x402` | 動的discovery（`PAYMENT_RECIPIENT_ADDRESS` をenv varから注入） |

## プロジェクト構成

```
.
├── app/
│   ├── api/
│   │   ├── screener/
│   │   │   └── smart-money/
│   │   │       └── route.ts     # メインAPIルート（x402ゲート付き）
│   │   └── x402/
│   │       └── route.ts         # x402 discoveryエンドポイント
│   ├── layout.tsx
│   └── page.tsx                 # ランディングページ
├── lib/
│   ├── nansen.ts                # Nansen APIクライアント（リトライ付き）
│   └── screener.ts              # フィルタリング・スコアリングロジック
├── public/
│   └── .well-known/
│       └── x402.json            # 静的discoveryドキュメント
├── .env.example
├── next.config.ts
├── vercel.json
└── tsconfig.json
```

## 技術スタック

- [Next.js](https://nextjs.org/) 16 (App Router)
- [x402-next](https://www.npmjs.com/package/x402-next) 1.2.0
- [Nansen API](https://nansen.ai/api) – Smart Money Flows
- TypeScript 5
- Vercel

## エラーハンドリング

| 状況 | HTTPステータス | 対応 |
|------|----------------|------|
| 支払いなし | 402 | x402プロトコルで自動処理 |
| Nansenレート制限 | 429 | 最大3回リトライ（指数バックオフ） |
| Nansen APIエラー | 502 | エラーメッセージを返却 |
| 環境変数未設定 | 500 | 設定エラーを返却 |

## ライセンス

ISC
