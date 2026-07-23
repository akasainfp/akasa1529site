# Akasa1529 Server

FastAPI + SQLite based experimental server for features that are difficult to keep as a static site.

Current scope:

- `GET /api/health`
- `GET /api/blog/likes?postId=...&visitorId=...`
- `POST /api/blog/likes`
- Compatibility endpoints for the current Worker shape: `/api/blog-likes`

Local run:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r server\requirements.txt
.\.venv\Scripts\python server\bot.py
```

ActiveVM notes:

- App file: `server/bot.py`
- Requirements file: `server/requirements.txt`
- The SQLite file is created under `server_data/akasa1529.db`.
- Do not commit `server_data/`.

## Frontend API switching

`assets/js/blog-config.js` controls where Blog API requests go.

- `apiBase: ''` keeps production on the current Cloudflare Worker.
- Local pages automatically use `localApiBase: 'http://localhost:6110'` when opened on localhost or file URLs.
- Set `apiBase` later when the FastAPI server becomes the production API.
