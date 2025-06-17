"""
Master FastAPI entrypoint for Scorpius X.
Simplified version with only the modules that exist in the codebase.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import available modules that work correctly
from dashboard_routes import router as dashboard_router
from system_health import router as system_router
from config_routes import router as config_router
from auth_routes import router as auth_router
# Note: Temporarily removed complex routes with import issues
# from reporting.reports_routes import router as reports_router
# from reporting.scorpius_routes import router as scorpius_router
# from reporting.autonomous_exploit_routes import router as exploit_router

app = FastAPI(
    title="Scorpius X • Unified API",
    version="1.0.0",
)

# Enhanced CORS configuration for better frontend connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "X-API-Version", "X-Request-ID"]
)

# Register available routers (only the working ones for now)
for r in [
    dashboard_router,
    system_router,
    config_router,
    auth_router,
]:
    app.include_router(r, prefix="/api")

# Root endpoint for health check
@app.get("/")
async def root():
    return {"status": "online", "message": "Scorpius X API is running"}

# Health endpoint for Docker health checks
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "scorpius-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
