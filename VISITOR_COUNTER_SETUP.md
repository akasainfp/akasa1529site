# Visitor Counter Setup

The site now expects a same-domain API at:

```text
https://www.akasa1529.site/api/visits
```

Use Cloudflare Workers + D1 for this API.

## Steps

1. Add `akasa1529.site` to Cloudflare.
2. In Cloudflare DNS, make sure `www.akasa1529.site` is Proxied, shown as the orange cloud.
3. Install and log in to Wrangler.

```powershell
npm install -g wrangler
wrangler login
```

4. Create a D1 database.

```powershell
wrangler d1 create akasa1529_visitors
```

5. Copy `wrangler.toml.example` to `wrangler.toml`.
6. Replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` with the `database_id` shown by Wrangler.
7. Deploy the Worker.

```powershell
wrangler deploy
```

8. In Cloudflare Worker Routes, add this route and assign it to the Worker:

```text
www.akasa1529.site/api/*
```

## Test

Open this URL in a browser:

```text
https://www.akasa1529.site/api/visits
```

If it returns JSON like this, the setup works:

```json
{"total":1}
```

The public website only talks to `www.akasa1529.site`, so this avoids third-party counter blocking.