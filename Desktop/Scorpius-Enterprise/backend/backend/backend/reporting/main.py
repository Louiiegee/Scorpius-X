import os
from pathlib import Path
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from api.api_server import router as api_router
from ws.websocket_handler import handler as ws_handler
from routes.time_machine_routes import router as time_machine_router
from routes.scorpius_routes import router as scorpius_router
# from routes.reports_routes import router as reports_router  # Temporarily disabled
from routes.training_routes import router as training_router
from routes.scheduler_routes import router as scheduler_router
from routes.autonomous_exploit_routes import router as autonomous_exploit_router
from core.db import engine, Base

# Load environment variables from .env file
env_file = Path(__file__).parent / ".env"
if env_file.exists():
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

app = FastAPI(title="Scorpius Backend")

# ─── 1) Enable CORS for development and electron packaging ───────────────────
origins = [
    "http://localhost:3000",   # Vite dev server
    "http://127.0.0.1:3000",
    "app://.",                 # Electron’s file origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ─── 2) Mount your REST API routes under /api ────────────────────────────────
app.include_router(api_router)

# Include routers
app.include_router(time_machine_router)
app.include_router(scorpius_router)
# app.include_router(reports_router)  # Temporarily disabled
app.include_router(training_router)
app.include_router(scheduler_router)
app.include_router(autonomous_exploit_router)

# ─── 3) WebSocket endpoint at ws://localhost:8000/ws ─────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws_handler(ws)

# ─── 4) Simple health-check endpoint ────────────────────────────────────────
@app.get("/")
def health_check():
    return {"status": "OK", "detail": "Scorpius Backend is running!"}
