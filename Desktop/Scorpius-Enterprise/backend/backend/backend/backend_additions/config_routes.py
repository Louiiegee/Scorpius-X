"""Configuration endpoints (install/update/test)."""
import subprocess
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/config", tags=["Config"])


@router.post("/install-dependencies")
async def install_dependencies():
    """Install Python requirements (and optionally Node deps)."""
    try:
        output = subprocess.check_output(["pip", "install", "-r", "requirements.txt"], stderr=subprocess.STDOUT)
        return {"status": "ok", "log": output.decode()}
    except subprocess.CalledProcessError as exc:
        raise HTTPException(status_code=500, detail=exc.output.decode())


@router.post("/update")
async def update_backend():
    """Placeholder for git pull / docker image update."""
    return {"status": "queued"}


@router.get("/test-connection")
async def test_connection():
    return {"status": "ok"}
