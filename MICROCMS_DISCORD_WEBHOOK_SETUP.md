# microCMS Blog Discord通知 setup

Blog記事が追加されたら、microCMS Webhook から Cloudflare Worker を呼び出して Discord に通知します。

## 1. Cloudflare Secret を設定

Discord Webhook URL や API key は GitHub に書かず、Cloudflare Secret に保存します。

```powershell
wrangler.cmd secret put DISCORD_WEBHOOK_URL
wrangler.cmd secret put MICROCMS_API_KEY
wrangler.cmd secret put MICROCMS_WEBHOOK_SECRET
```

- `DISCORD_WEBHOOK_URL`: DiscordのWebhook URL
- `MICROCMS_API_KEY`: microCMSのAPI key
- `MICROCMS_WEBHOOK_SECRET`: 自分で決めた長い合言葉

`MICROCMS_WEBHOOK_SECRET` は、microCMS以外から勝手に通知を送られないようにするためのものです。

## 2. Worker を deploy

```powershell
wrangler.cmd deploy
```

## 3. microCMS 側の Webhook URL

microCMS の API設定から Webhook を追加し、URLを以下の形にします。

```text
https://www.akasa1529.site/api/blog-webhook?secret=MICROCMS_WEBHOOK_SECRETに入れた文字
```

通知タイミングは「コンテンツ公開」または「公開時」にします。
更新通知も飛ぶ設定にしても、Worker側で記事IDを記録するため同じ記事は基本的に1回だけ通知されます。

## Discordに表示される内容

- 題名
- 内容
- アイキャッチ
- BlogURL

個別記事URLは現在使わない方針なので、BlogURL は `https://www.akasa1529.site/blog/` になります。