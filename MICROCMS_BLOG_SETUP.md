# microCMS Blog Setup

このサイトの blog は microCMS と blog-data.json の両方に対応しています。

## microCMS 側で作るAPI

- API名: Blog
- エンドポイント: blogs
- API形式: リスト形式

## フィールド

| フィールドID | 種類 | 必須 | 用途 |
| --- | --- | --- | --- |
| title | テキストフィールド | 必須 | 記事タイトル |
| excerpt | テキストエリア | 任意 | 一覧に出る短い説明 |
| body | リッチエディタ | 必須 | 記事本文 |
| category | テキストフィールド | 任意 | note / thought など |
| tags | 複数選択 or テキスト | 任意 | タグ |

## サイト側設定

assets/js/blog-config.js に以下を入れます。

window.AKASA_BLOG_CONFIG = {
    serviceDomain: 'あなたのサービスID',
    apiKey: 'GETだけ許可したAPIキー',
    endpoint: 'blogs'
};

APIキーはGitHubに置くと見えます。必ずmicroCMSでGETだけ許可した読み取り専用キーを使ってください。