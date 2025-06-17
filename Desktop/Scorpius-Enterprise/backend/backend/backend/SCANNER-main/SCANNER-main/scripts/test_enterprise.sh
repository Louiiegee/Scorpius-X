#!/bin/bash
# scripts/test_enterprise.sh

echo "🧪 Running Enterprise Feature Tests..."

# Start services
docker-compose up -d
sleep 30

# Test health endpoint
echo "Testing health endpoint..."
curl -f http://localhost:8000/health || exit 1

# Test metrics endpoint  
echo "Testing metrics endpoint..."
curl -f http://localhost:8000/metrics | grep http_requests_total || exit 1

# Test Jaeger UI is accessible
echo "Testing Jaeger UI..."
curl -f http://localhost:16686 || exit 1

# Test Prometheus is scraping
echo "Testing Prometheus..."
curl -f http://localhost:9090/api/v1/targets || exit 1

# Run pytest
echo "Running automated tests..."
pytest tests/test_enterprise.py -v

echo "✅ All enterprise tests passed!"
