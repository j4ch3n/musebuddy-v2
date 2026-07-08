from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv

COURSES_DIR = Path(__file__).resolve().parent
ENV_PATH = COURSES_DIR / ".env"
REMOTE_DB_ENV_PATHS = {
    "local": COURSES_DIR / ".env.local",
    "prod": COURSES_DIR / ".env.prod",
}
POSTGRES_SCHEME = "postgresql://"
PSYCOPG_SCHEME = "postgresql+psycopg://"

RemoteDb = Literal["local", "prod"]


def load_environment(remote_db: RemoteDb | None = None) -> None:
    env_path = REMOTE_DB_ENV_PATHS[remote_db] if remote_db else ENV_PATH
    load_dotenv(env_path, override=remote_db is not None)


def database_url(
    option_value: str | None, remote_db: RemoteDb | None = None
) -> str | None:
    load_environment(remote_db)
    value = option_value or os.environ.get("SUPABASE_DATABASE_URL")
    if value and value.startswith(POSTGRES_SCHEME):
        return f"{PSYCOPG_SCHEME}{value.removeprefix(POSTGRES_SCHEME)}"
    return value
