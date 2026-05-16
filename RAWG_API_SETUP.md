# RAWG API setup

RAWG API key must be stored as a Cloudflare Worker secret.
Do not write the key in HTML, JavaScript, JSON, or GitHub files.

Run this command in the repository folder:

```powershell
npx wrangler secret put RAWG_API_KEY
```

When Wrangler asks for the value, paste the RAWG API key.

After the secret is saved, deploy the Worker:

```powershell
npx wrangler deploy
```

The site can call RAWG through:

```text
https://www.akasa1529.site/api/rawg/search?q=minecraft
```
