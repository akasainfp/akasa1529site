from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers.blog import router as blog_router

app = FastAPI(title="Akasa1529 server", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.akasa1529.site",
        "https://akasa1529.site",
        "null",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/api/health")
def health() -> dict[str, object]:
    return {"ok": True, "app": "akasa1529-server", "version": "0.1.0"}


app.include_router(blog_router)