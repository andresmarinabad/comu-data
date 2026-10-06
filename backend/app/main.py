import os
import re
import hashlib
import hmac
import time
from typing import Any

import psycopg
from fastapi import FastAPI, Header, HTTPException, Query, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://comu:comu@localhost:5432/comu")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
SESSION_SECRET = os.environ.get("ADMIN_SESSION_SECRET", "") or ADMIN_PASSWORD
SITE_PASSWORD = os.environ.get("SITE_PASSWORD", "")
SITE_SESSION_SECRET = os.environ.get("SITE_SESSION_SECRET", "")
TABLES = {
    "persons", "services", "person_services", "events", "groups", "group_members",
    "traditio", "words", "current_psalm", "agapes", "agape_food_types", "agape_assignments",
}
IDENTIFIER = re.compile(r"^[a-z_][a-z0-9_]*$")

app = FastAPI(title="Comu Data API", version="1.0.0")
origins = [origin.strip() for origin in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


def connect():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def checked_table(table: str) -> str:
    if table not in TABLES or not IDENTIFIER.fullmatch(table):
        raise HTTPException(status_code=404, detail="Tabla no encontrada")
    return table


def session_token(expires: int) -> str:
    signature = hmac.new(SESSION_SECRET.encode(), str(expires).encode(), hashlib.sha256).hexdigest()
    return f"{expires}.{signature}"


def site_session_token(expires: int) -> str:
    signature = hmac.new(SITE_SESSION_SECRET.encode(), str(expires).encode(), hashlib.sha256).hexdigest()
    return f"{expires}.{signature}"


def require_site_session(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer ") or not SITE_SESSION_SECRET:
        raise HTTPException(status_code=401, detail="Introduce la contraseña de acceso a la página")
    try:
        expires_text, signature = authorization.removeprefix("Bearer ").split(".", 1)
        expires = int(expires_text)
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Sesión de página no válida")
    expected = site_session_token(expires).split(".", 1)[1]
    if expires < time.time() or not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="La sesión de página ha caducado; vuelve a introducir la contraseña")


@app.post("/api/site/session")
def create_site_session(payload: dict[str, str]):
    if not SITE_PASSWORD or not SITE_SESSION_SECRET:
        raise HTTPException(status_code=503, detail="Configura SITE_PASSWORD y SITE_SESSION_SECRET en el entorno del backend")
    if SITE_PASSWORD == ADMIN_PASSWORD:
        raise HTTPException(status_code=503, detail="SITE_PASSWORD debe ser distinta de ADMIN_PASSWORD")
    provided = str(payload.get("password", ""))
    if not hmac.compare_digest(provided.encode(), SITE_PASSWORD.encode()):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")
    expires = int(time.time()) + 8 * 60 * 60
    return {"token": site_session_token(expires)}


def require_admin(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer ") or not SESSION_SECRET:
        raise HTTPException(status_code=401, detail="Inicia sesión para acceder al administrador")
    try:
        expires_text, signature = authorization.removeprefix("Bearer ").split(".", 1)
        expires = int(expires_text)
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Sesión no válida")
    expected = session_token(expires).split(".", 1)[1]
    if expires < time.time() or not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="Sesión caducada; vuelve a introducir la contraseña")


@app.post("/api/admin/session")
def create_admin_session(payload: dict[str, str]):
    if not ADMIN_PASSWORD:
        raise HTTPException(status_code=503, detail="Configura ADMIN_PASSWORD en el entorno del backend")
    provided = str(payload.get("password", ""))
    if not hmac.compare_digest(provided.encode(), ADMIN_PASSWORD.encode()):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")
    return {"token": session_token(int(time.time()) + 8 * 60 * 60)}


@app.get("/api/health")
def health():
    with connect() as conn:
        conn.execute("SELECT 1")
    return {"status": "ok"}


@app.get("/api/directory")
def directory(_: None = Depends(require_site_session)):
    with connect() as conn:
        rows = conn.execute(
            """SELECT p.*, COALESCE(array_agg(s.name ORDER BY s.name) FILTER (WHERE s.id IS NOT NULL), ARRAY[]::text[]) AS services
               FROM persons p
               LEFT JOIN person_services ps ON ps.person_id = p.id
               LEFT JOIN services s ON s.id = ps.service_id
               GROUP BY p.id"""
        ).fetchall()
    return {"rows": rows, "total": len(rows)}


@app.get("/api/public/{table}")
def get_public_rows(table: str, _: None = Depends(require_site_session)):
    public_tables = {"events", "current_psalm", "groups", "traditio", "words", "agapes", "agape_assignments", "agape_food_types"}
    if table not in public_tables:
        raise HTTPException(status_code=404, detail="Tabla pública no encontrada")
    with connect() as conn:
        ordering = ' ORDER BY "created_at" ASC' if table == "words" else ""
        rows = conn.execute(f'SELECT * FROM "{table}"{ordering} LIMIT 500').fetchall()
    return {"rows": rows, "total": len(rows)}


@app.get("/api/tables")
def list_tables(_: None = Depends(require_admin)):
    with connect() as conn:
        columns = conn.execute(
            """SELECT table_name, column_name, data_type, is_nullable, column_default
               FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = ANY(%s)
               ORDER BY table_name, ordinal_position""",
            (list(TABLES),),
        ).fetchall()
        primary_keys = conn.execute(
            """SELECT tc.table_name, kcu.column_name, kcu.ordinal_position
               FROM information_schema.table_constraints tc
               JOIN information_schema.key_column_usage kcu
                 ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
               WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY'
                 AND tc.table_name = ANY(%s)
               ORDER BY tc.table_name, kcu.ordinal_position""", (list(TABLES),)
        ).fetchall()
    pks = {}
    for key in primary_keys:
        pks.setdefault(key["table_name"], []).append(key["column_name"])
    result = {}
    for col in columns:
        result.setdefault(col["table_name"], []).append({
            "name": col["column_name"], "type": col["data_type"],
            "nullable": col["is_nullable"] == "YES", "default": col["column_default"],
        })
    return [{"name": name, "columns": result.get(name, []), "primaryKey": pks.get(name, [])} for name in sorted(TABLES)]


@app.get("/api/tables/{table}")
def get_rows(table: str, limit: int = Query(500, ge=1, le=1000), offset: int = Query(0, ge=0), _: None = Depends(require_admin)):
    table = checked_table(table)
    with connect() as conn:
        rows = conn.execute(f'SELECT * FROM "{table}" LIMIT %s OFFSET %s', (limit, offset)).fetchall()
        count = conn.execute(f'SELECT count(*) AS total FROM "{table}"').fetchone()["total"]
    return {"rows": rows, "total": count}


@app.post("/api/tables/{table}", status_code=201)
def create_row(table: str, payload: dict[str, Any], _: None = Depends(require_admin)):
    table = checked_table(table)
    if not payload:
        raise HTTPException(status_code=400, detail="Indica al menos un campo")
    fields = list(payload)
    if any(not IDENTIFIER.fullmatch(field) for field in fields):
        raise HTTPException(status_code=400, detail="Nombre de campo no válido")
    columns = ", ".join(f'"{field}"' for field in fields)
    placeholders = ", ".join("%s" for _ in fields)
    values = [Jsonb(value) if isinstance(value, (dict, list)) else value for value in payload.values()]
    try:
        with connect() as conn:
            row = conn.execute(f'INSERT INTO "{table}" ({columns}) VALUES ({placeholders}) RETURNING *', values).fetchone()
        return row
    except psycopg.Error as exc:
        raise HTTPException(status_code=400, detail=str(exc.diag.message_primary or exc)) from exc


@app.patch("/api/tables/{table}")
def update_row(table: str, payload: dict[str, Any], _: None = Depends(require_admin)):
    table = checked_table(table)
    key = payload.pop("_key", None)
    if not isinstance(key, dict) or not key or not payload or any(not IDENTIFIER.fullmatch(field) for field in [*payload, *key]):
        raise HTTPException(status_code=400, detail="No hay campos válidos para actualizar")
    values = [Jsonb(value) if isinstance(value, (dict, list)) else value for value in payload.values()]
    assignments = ", ".join(f'"{field}" = %s' for field in payload)
    predicate = " AND ".join(f'"{field}" IS NOT DISTINCT FROM %s' for field in key)
    try:
        with connect() as conn:
            row = conn.execute(f'UPDATE "{table}" SET {assignments} WHERE {predicate} RETURNING *', [*values, *key.values()]).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
        return row
    except psycopg.Error as exc:
        raise HTTPException(status_code=400, detail=str(exc.diag.message_primary or exc)) from exc


@app.delete("/api/tables/{table}", status_code=204)
def delete_row(table: str, key: dict[str, Any], _: None = Depends(require_admin)):
    table = checked_table(table)
    if not key or any(not IDENTIFIER.fullmatch(field) for field in key):
        raise HTTPException(status_code=400, detail="Clave primaria no válida")
    try:
        with connect() as conn:
            predicate = " AND ".join(f'"{field}" IS NOT DISTINCT FROM %s' for field in key)
            result = conn.execute(f'DELETE FROM "{table}" WHERE {predicate}', list(key.values()))
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
        return Response(status_code=204)
    except psycopg.Error as exc:
        raise HTTPException(status_code=400, detail=str(exc.diag.message_primary or exc)) from exc
