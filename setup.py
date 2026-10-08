"""Install-time build bridge for Render's Python runtime."""

import os
import subprocess
import sys
from pathlib import Path

from setuptools import setup
from setuptools.command.build import build


class RenderBuild(build):
    def run(self):
        if os.getenv("RENDER") == "true" or os.getenv("UED_BUILD_FRONTEND") == "true":
            subprocess.run(
                [sys.executable, str(Path(__file__).resolve().parent / "scripts" / "build_render.py")],
                check=True,
            )
        super().run()


setup(
    name="ued-render-build",
    version="1.0.0",
    description="Build and validate the UEDocs standalone frontend on Render",
    packages=[],
    py_modules=[],
    cmdclass={"build": RenderBuild},
)
