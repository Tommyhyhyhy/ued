"""Exercise the real ASGI entrypoint with standalone enabled and graceful shutdown."""

import asyncio
import os
import re
import socket
import sys
from pathlib import Path

import httpx
import uvicorn

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def available_port() -> int:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return listener.getsockname()[1]


async def main() -> None:
    os.environ["NEXT_STANDALONE"] = "true"
    os.environ["NEXT_INTERNAL_PORT"] = str(available_port())
    port = available_port()
    server = uvicorn.Server(uvicorn.Config("main:app", host="127.0.0.1", port=port))
    task = asyncio.create_task(server.serve())
    try:
        async with httpx.AsyncClient(base_url=f"http://127.0.0.1:{port}", trust_env=False) as client:
            for _ in range(240):
                if task.done():
                    await task
                    raise RuntimeError("Uvicorn stopped before becoming ready")
                try:
                    response = await client.get("/__render_health")
                    if response.status_code == 200:
                        assert response.json()["status"] == "ok"
                        break
                except httpx.HTTPError:
                    pass
                await asyncio.sleep(0.5)
            else:
                raise RuntimeError("Uvicorn startup timed out")
            for route in ("/", "/dang-nhap", "/api/documents", "/samples/sample.pdf"):
                response = await client.get(route, timeout=30)
                response.raise_for_status()
                assert response.content, f"Empty response: {route}"
                if route == "/":
                    assert "UEDocs" in response.text
                    asset = re.search(r'src="(/_next/static/[^"?]+\.js)', response.text)
                    assert asset, "No JavaScript asset in homepage"
            response = await client.get(asset.group(1))
            response.raise_for_status()
            assert response.content
            print("UED: Uvicorn standalone gateway health, pages, API, PDF and JavaScript passed")
    finally:
        server.should_exit = True
        await asyncio.wait_for(task, timeout=30)


if __name__ == "__main__":
    asyncio.run(main())
