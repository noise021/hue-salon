# hue. — 美容室デモサイト

東京・青山の架空ヘアアトリエ「hue.」のデモサイト。
スクロール駆動のLP（動画ヒーロー＋スタイルギャラリー）＋予約デモページ。

- `/` — ランディングページ
- `/reserve` — 予約フォーム（UIのみ・送信なし）
- `/privacy` — プライバシーポリシー

素材はすべて Pexels（商用可・クレジット不要）。

## ローカル起動

```bash
npm install
npm run dev
# http://localhost:3000
```

## デプロイ（Vercel）

1. GitHubに新規リポジトリを作成してpush
2. Vercel → Add New Project → リポジトリをインポート → Deploy
   （環境変数は不要）
