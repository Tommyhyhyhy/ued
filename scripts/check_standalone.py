"""HTTP checks against the actual deployable server, with no next start fallback."""

from __future__ import annotations

import os
import re
import shutil
import socket
import subprocess
import tempfile
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import ProxyHandler, build_opener

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    standalone = ROOT / ".next" / "standalone"
    for relative in ("server.js", ".next/BUILD_ID", "public/samples/sample.pdf"):
        if not (standalone / relative).is_file():
            raise RuntimeError(f"Missing standalone artifact: {relative}")
    if not list((standalone / ".next" / "static").rglob("*.js")):
        raise RuntimeError("Missing standalone JavaScript assets")
    # Prove that no dependency can be resolved from the source's node_modules.
    with tempfile.TemporaryDirectory(prefix="ued-standalone-") as temp:
        runtime = Path(temp) / "runtime"
        shutil.copytree(standalone, runtime, symlinks=False)
        check_runtime(runtime)


def check_runtime(standalone: Path) -> None:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    env = os.environ.copy()
    env.update(PORT=str(port), HOSTNAME="127.0.0.1", DEMO_MODE="true", DEMO_ADMIN_ENABLED="false")
    # Use demo data for a reproducible runtime check without external credentials.
    for key in ("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"):
        env.pop(key, None)
    opener = build_opener(ProxyHandler({}))
    origin = f"http://127.0.0.1:{port}"
    log_path = ROOT / ".next" / "standalone-check.log"
    with log_path.open("w+", encoding="utf-8", errors="replace") as log:
        process = subprocess.Popen(
            [shutil.which("node") or "node", str(standalone / "server.js")],
            cwd=standalone, env=env, stdout=log, stderr=subprocess.STDOUT,
        )
        try:
            deadline = time.monotonic() + 120
            while True:
                if process.poll() is not None:
                    raise RuntimeError(f"Standalone exited with code {process.returncode}")
                try:
                    with opener.open(origin + "/dang-nhap", timeout=5) as response:
                        assert response.status == 200
                    break
                except URLError:
                    if time.monotonic() >= deadline:
                        raise RuntimeError("Standalone did not become ready within 120 seconds")
                    time.sleep(0.5)
            for route in ("/", "/dang-nhap", "/tai-lieu", "/api/documents", "/samples/sample.pdf"):
                with opener.open(origin + route, timeout=30) as response:
                    body = response.read()
                    assert response.status == 200 and body, f"Empty or failed response: {route}"
                    if route == "/":
                        html = body.decode()
                        assert "UEDocs" in html, "Missing application homepage"
                    if route.endswith(".pdf"):
                        assert body.startswith(b"%PDF-"), "Sample PDF response is not a PDF"
            assets = set(re.findall(r'(?:src|href)="(/_next/static/[^"?]+)', html))
            assert any(url.endswith(".js") for url in assets), "No JavaScript in homepage"
            assert any(url.endswith(".css") for url in assets), "No stylesheet in homepage"
            for asset in assets:
                with opener.open(origin + asset, timeout=30) as response:
                    assert response.status == 200 and response.read(), f"Missing asset: {asset}"
            print("UED: standalone homepage, login, document list, sample PDF and CSS/JS passed", flush=True)
        except Exception:
            log.flush()
            log.seek(0)
            print(log.read()[-12000:], flush=True)
            raise
        finally:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()


if __name__ == "__main__":
    main()
