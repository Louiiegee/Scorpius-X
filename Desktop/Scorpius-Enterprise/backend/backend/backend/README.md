# Scorpius X Backend Additions

This bundle adds:

* **backend/main.py** – Unified FastAPI entrypoint.
* **backend/config_routes.py** – `/api/config/*` endpoints.
* **backend/dashboard_routes.py** – `/api/dashboard/stats`.
* **backend/system_health.py** – `/api/system/health`.
* **backend/mev_bot/mev_router.py** – `/api/mev/strategies`.
* **docker-compose.yml** – spins up backend + existing websocket server + frontend.

## Quick start

```bash
unzip scorpius_backend_additions.zip
cd scorpius_backend_additions
docker-compose up --build
```

Front‑end: <http://localhost:3000>  
Back‑end API: <http://localhost:8000/api>
