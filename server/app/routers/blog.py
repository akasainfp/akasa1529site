from __future__ import annotations

import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlite3 import Connection

from app.database import iter_connection

router = APIRouter(prefix="/api", tags=["blog"])

POST_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,128}$")
VISITOR_ID_RE = re.compile(r"^[A-Za-z0-9._:-]{8,128}$")


class BlogLikePayload(BaseModel):
    post_id: str | None = Field(default=None, alias="postId")
    visitor_id: str | None = Field(default=None, alias="visitorId")

    model_config = {"populate_by_name": True}


def validate_post_id(value: str) -> str:
    if not POST_ID_RE.fullmatch(value or ""):
        raise HTTPException(status_code=400, detail="Invalid post id")
    return value


def validate_visitor_id(value: str) -> str:
    if not VISITOR_ID_RE.fullmatch(value or ""):
        raise HTTPException(status_code=400, detail="Invalid visitor id")
    return value


def get_total(connection: Connection, post_id: str) -> int:
    row = connection.execute(
        "SELECT COUNT(*) AS total FROM blog_likes WHERE post_id = ?",
        (post_id,),
    ).fetchone()
    return int(row["total"] if row else 0)


def get_like_state(connection: Connection, post_id: str, visitor_id: str | None) -> dict[str, object]:
    liked = False
    if visitor_id and VISITOR_ID_RE.fullmatch(visitor_id):
        liked = connection.execute(
            "SELECT 1 FROM blog_likes WHERE post_id = ? AND visitor_id = ?",
            (post_id, visitor_id),
        ).fetchone() is not None
    return {"postId": post_id, "total": get_total(connection, post_id), "liked": liked}


@router.get("/blog/likes")
def read_blog_likes(
    post_id: Annotated[str, Query(alias="postId")],
    visitor_id: Annotated[str | None, Query(alias="visitorId")] = None,
    connection: Connection = Depends(iter_connection),
) -> dict[str, object]:
    post_id = validate_post_id(post_id)
    return get_like_state(connection, post_id, visitor_id)


@router.post("/blog/likes")
def toggle_blog_like(
    payload: BlogLikePayload,
    connection: Connection = Depends(iter_connection),
) -> dict[str, object]:
    post_id = validate_post_id(payload.post_id or "")
    visitor_id = validate_visitor_id(payload.visitor_id or "")

    existing = connection.execute(
        "SELECT 1 FROM blog_likes WHERE post_id = ? AND visitor_id = ?",
        (post_id, visitor_id),
    ).fetchone()

    if existing:
        connection.execute(
            "DELETE FROM blog_likes WHERE post_id = ? AND visitor_id = ?",
            (post_id, visitor_id),
        )
    else:
        connection.execute(
            "INSERT OR IGNORE INTO blog_likes (post_id, visitor_id) VALUES (?, ?)",
            (post_id, visitor_id),
        )
    connection.commit()
    return get_like_state(connection, post_id, visitor_id)


@router.get("/blog-likes")
def read_blog_likes_compat(
    post_id: Annotated[str, Query(alias="postId")],
    visitor_id: Annotated[str | None, Query(alias="visitorId")] = None,
    connection: Connection = Depends(iter_connection),
) -> dict[str, object]:
    return read_blog_likes(post_id, visitor_id, connection)


@router.post("/blog-likes")
def toggle_blog_like_compat(
    payload: BlogLikePayload,
    connection: Connection = Depends(iter_connection),
) -> dict[str, object]:
    return toggle_blog_like(payload, connection)