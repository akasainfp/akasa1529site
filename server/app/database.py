from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from typing import Iterator

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "server_data"
DB_PATH = Path(os.getenv("AKASA_DB_PATH", DATA_DIR / "akasa1529.db"))


def get_connection() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def iter_connection() -> Iterator[sqlite3.Connection]:
    connection = get_connection()
    try:
        yield connection
    finally:
        connection.close()


def init_db() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS blog_likes (
                post_id TEXT NOT NULL,
                visitor_id TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (post_id, visitor_id)
            )
            """
        )
        connection.commit()