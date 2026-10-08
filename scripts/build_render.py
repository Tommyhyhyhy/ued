"""Build the frontend in place, then prove its standalone runtime boots."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    env = os.environ.copy()
    env["CI"] = "true"
    env["NEXT_TELEMETRY_DISABLED"] = "1"
    env.pop("NEXT_DIST_DIR", None)
    node = shutil.which("node")
    npm = shutil.which("npm")
    if not node:
        raise RuntimeError("The Render build requires Node.js on PATH.")
    package_manager = json.loads((ROOT / "package.json").read_text())["packageManager"]
    pnpm = shutil.which("pnpm")
    # Render's preinstalled pnpm may not match the version of our lockfile.
    if pnpm and subprocess.check_output([pnpm, "--version"], text=True).strip() == package_manager.split("@")[1]:
        command = [pnpm]
    else:
        if not npm:
            raise RuntimeError("Install the pinned pnpm version or provide npm on PATH.")
        command = [npm, "exec", "--yes", f"--package={package_manager}", "--", "pnpm"]

    print("UED: installing frontend dependencies and building standalone runtime", flush=True)
    subprocess.run(
        command + ["install", "--frozen-lockfile", "--prod=false", "--reporter=append-only"],
        cwd=ROOT, env=env, check=True,
    )
    subprocess.run(command + ["build"], cwd=ROOT, env=env, check=True)
    subprocess.run([sys.executable, str(ROOT / "scripts" / "check_standalone.py")], cwd=ROOT, env=env, check=True)
    print("UED: standalone build and runtime checks passed", flush=True)


if __name__ == "__main__":
    main()
