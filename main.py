"""ASGI entrypoint for hosting the Next.js application behind Uvicorn."""

from __future__ import annotations

import asyncio
import os
import signal
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.background import BackgroundTask

NEXT_HOST = "127.0.0.1"
NEXT_PORT = int(os.getenv("NEXT_INTERNAL_PORT", "3001"))
NEXT_ORIGIN = f"http://{NEXT_HOST}:{NEXT_PORT}"
HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
}


async def wait_for_next(client: httpx.AsyncClient, process: asyncio.subprocess.Process) -> None:
    for _ in range(120):
        if process.returncode is not None:
            raise RuntimeError(f"Next.js stopped during startup with exit code {process.returncode}")
        try:
            response = await client.get(NEXT_ORIGIN, timeout=1)
            if response.status_code < 500:
                return
        except httpx.HTTPError:
            pass
        await asyncio.sleep(0.25)
    raise RuntimeError("Next.js did not become ready within 30 seconds")


@asynccontextmanager
async def lifespan(app: FastAPI):
    env = os.environ.copy()
    env["PORT"] = str(NEXT_PORT)
    env["HOSTNAME"] = NEXT_HOST
    use_standalone = bool(os.getenv("RENDER")) or os.getenv("NEXT_STANDALONE") == "true"
    next_command = (
        ["node", ".next/standalone/server.js"]
        if use_standalone
        else [
            "node",
            "node_modules/next/dist/bin/next",
            "start",
            "--hostname",
            NEXT_HOST,
            "--port",
            str(NEXT_PORT),
        ]
    )
    process = await asyncio.create_subprocess_exec(
        *next_command,
        env=env,
        creationflags=0 if os.name != "nt" else 0x08000000,
    )
    client = httpx.AsyncClient(follow_redirects=False, timeout=httpx.Timeout(60, connect=5))
    try:
        await wait_for_next(client, process)
        app.state.next_process = process
        app.state.client = client
        yield
    finally:
        await client.aclose()
        if process.returncode is None:
            if os.name == "nt":
                process.terminate()
            else:
                process.send_signal(signal.SIGTERM)
            try:
                await asyncio.wait_for(process.wait(), timeout=10)
            except TimeoutError:
                process.kill()
                await process.wait()


app = FastAPI(title="UEDocs Render Gateway", docs_url=None, redoc_url=None, lifespan=lifespan)


@app.get("/__render_health")
async def health() -> JSONResponse:
    process = getattr(app.state, "next_process", None)
    if process is None or process.returncode is not None:
        return JSONResponse({"status": "unavailable"}, status_code=503)
    return JSONResponse({"status": "ok"})


@app.api_route("/{path:path}", methods=["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy(request: Request, path: str) -> StreamingResponse:
    query = request.url.query
    target = f"{NEXT_ORIGIN}/{path}" + (f"?{query}" if query else "")
    headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in HOP_BY_HOP and key.lower() not in {"host", "content-length"}
    }
    headers["x-forwarded-host"] = request.headers.get("host", "")
    headers["x-forwarded-proto"] = request.url.scheme
    upstream = await app.state.client.send(
        app.state.client.build_request(
            request.method,
            target,
            headers=headers,
            content=await request.body(),
        ),
        stream=True,
    )
    response = StreamingResponse(
        upstream.aiter_raw(),
        status_code=upstream.status_code,
        background=BackgroundTask(upstream.aclose),
    )
    for key, value in upstream.headers.multi_items():
        if key.lower() not in HOP_BY_HOP:
            response.headers.append(key, value)
    return response
