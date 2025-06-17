#!/usr/bin/env pwsh
# Test the backend startup directly

Write-Host "🦂 Testing Backend Startup..." -ForegroundColor Green

# Let's try to run the backend directly to see what's missing
docker exec -it scorpius-backend bash -c "cd /app && python -c 'import main; print(\"Main imported successfully\")'"
