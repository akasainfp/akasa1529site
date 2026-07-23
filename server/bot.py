from __future__ import annotations

import os

import uvicorn


def main() -> None:
    port = int(os.getenv("PORT", "6110"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, app_dir="server")


if __name__ == "__main__":
    main()