# Deployment Guide

This document provides comprehensive deployment instructions for the Scorpius Cybersecurity Dashboard across different environments and platforms.

## 📋 Prerequisites

### System Requirements

- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB available space
- **Network**: High-speed internet connection for real-time features

### Software Requirements

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Docker**: 20.x or higher (for containerized deployment)
- **nginx**: 1.20+ (for reverse proxy setup)

## 🌐 Production Deployment

### Option 1: Docker Deployment (Recommended)

#### Quick Start

```bash
# Clone and build
git clone <repository-url>
cd scorpius-cybersecurity-dashboard

# Build production image
docker build -t scorpius-dashboard:latest .

# Run container
docker run -d \
  --name scorpius-dashboard \
  -p 8080:8080 \
  --restart unless-stopped \
  scorpius-dashboard:latest
```

#### Docker Compose (Full Stack)

```yaml
# docker-compose.yml
version: "3.8"

services:
  frontend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - VITE_APP_ENV=production
      - VITE_API_BASE=https://api.yourcompany.com/v1
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
    restart: unless-stopped

volumes:
  nginx-cache:
```

### Option 2: Traditional Deployment

#### Build and Deploy

```bash
# 1. Build production bundle
npm run build:production

# 2. Copy dist folder to web server
rsync -avz dist/ user@server:/var/www/scorpius/

# 3. Configure nginx (see nginx.conf)
sudo cp nginx.conf /etc/nginx/sites-available/scorpius
sudo ln -s /etc/nginx/sites-available/scorpius /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 🔧 Environment Configuration

### Production Environment Variables

Create `/etc/scorpius/environment`:

```bash
# API Configuration
VITE_API_BASE=https://api.yourcompany.com/v1
VITE_SCANNER_API_BASE=https://scanner.yourcompany.com/v1
VITE_MEMPOOL_API_BASE=https://mempool.yourcompany.com/v1
VITE_MEV_API_BASE=https://mev.yourcompany.com/v1

# Authentication
VITE_AUTH_DOMAIN=auth.yourcompany.com
VITE_AUTH_REFRESH_THRESHOLD=300000

# WebSocket
VITE_WS_BASE=wss://api.yourcompany.com/ws

# Feature Flags
VITE_ENABLE_MOCK_MODE=false
VITE_ENABLE_WEBSOCKETS=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_MODE=false

# Application
VITE_APP_ENV=production
VITE_LOG_LEVEL=error
VITE_APP_VERSION=1.0.0
```

### Security Configuration

#### SSL/TLS Setup

```bash
# Generate certificates (Let's Encrypt)
certbot --nginx -d scorpius.yourcompany.com

# Or use custom certificates
mkdir -p /etc/nginx/ssl
cp yourcompany.crt /etc/nginx/ssl/
cp yourcompany.key /etc/nginx/ssl/
```

#### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# iptables (CentOS/RHEL)
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

## ☁️ Cloud Platform Deployment

### AWS Deployment

#### Using AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize project
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

#### Using AWS ECS

```yaml
# ecs-task-definition.json
{
  "family": "scorpius-dashboard",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions":
    [
      {
        "name": "scorpius-dashboard",
        "image": "your-account.dkr.ecr.region.amazonaws.com/scorpius:latest",
        "portMappings": [{ "containerPort": 8080, "protocol": "tcp" }],
        "environment": [{ "name": "VITE_APP_ENV", "value": "production" }],
        "logConfiguration":
          {
            "logDriver": "awslogs",
            "options":
              {
                "awslogs-group": "/ecs/scorpius-dashboard",
                "awslogs-region": "us-east-1",
                "awslogs-stream-prefix": "ecs",
              },
          },
      },
    ],
}
```

### Google Cloud Deployment

#### Using Cloud Run

```bash
# Build and push to Container Registry
docker build -t gcr.io/project-id/scorpius-dashboard .
docker push gcr.io/project-id/scorpius-dashboard

# Deploy to Cloud Run
gcloud run deploy scorpius-dashboard \
  --image gcr.io/project-id/scorpius-dashboard \
  --platform managed \
  --region us-central1 \
  --port 8080
```

### Azure Deployment

#### Using Azure Container Instances

```bash
# Create resource group
az group create --name scorpius-rg --location eastus

# Deploy container
az container create \
  --resource-group scorpius-rg \
  --name scorpius-dashboard \
  --image your-registry/scorpius-dashboard:latest \
  --ports 8080 \
  --environment-variables VITE_APP_ENV=production
```

## 🖥️ Desktop Application Deployment

### Electron Build

#### Cross-platform Build

```bash
# Windows
npm run electron:build:win

# macOS
npm run electron:build:mac

# Linux
npm run electron:build:linux

# All platforms
npm run electron:build
```

#### Code Signing (Production)

**Windows:**

```bash
# Set certificate variables
export CSC_LINK=path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password

# Build signed app
npm run electron:build:win
```

**macOS:**

```bash
# Set developer credentials
export APPLE_ID=your@email.com
export APPLE_ID_PASSWORD=app_specific_password

# Build and notarize
npm run electron:build:mac
```

### Distribution

#### Windows Store

```bash
# Generate MSIX package
electron-builder --win --config.win.target=appx
```

#### Mac App Store

```bash
# Generate MAS package
electron-builder --mac --config.mac.target=mas
```

#### Linux Repositories

```bash
# Generate AppImage
electron-builder --linux --config.linux.target=AppImage

# Generate Snap
electron-builder --linux --config.linux.target=snap
```

## 🔍 Monitoring & Logging

### Health Checks

#### Application Health

```bash
# Check application status
curl -f http://localhost:8080/health

# Check with timeout
timeout 5 curl -f http://localhost:8080/health || echo "Health check failed"
```

#### Service Monitoring

```bash
# Systemd service
sudo systemctl status scorpius-dashboard

# Docker container
docker ps | grep scorpius-dashboard
docker logs scorpius-dashboard
```

### Log Management

#### Centralized Logging

```yaml
# docker-compose.yml (with logging)
version: '3.8'

services:
  app:
    image: scorpius-dashboard:latest
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    # ELK Stack integration
    logging:
      driver: "gelf"
      options:
        gelf-address: "udp://logstash:12201"
```

#### Log Rotation

```bash
# Logrotate configuration
cat > /etc/logrotate.d/scorpius << EOF
/var/log/scorpius/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
EOF
```

## 🚀 Performance Optimization

### CDN Configuration

#### CloudFlare

```javascript
// cloudflare-workers.js
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // Cache static assets
  if (url.pathname.match(/\.(js|css|png|jpg|svg|woff2)$/)) {
    const response = await fetch(request);
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("Cache-Control", "max-age=31536000");
    return newResponse;
  }

  return fetch(request);
}
```

### Load Balancing

#### nginx Load Balancer

```nginx
upstream scorpius_backend {
    server 127.0.0.1:8080;
    server 127.0.0.1:8081;
    server 127.0.0.1:8082;
}

server {
    listen 80;
    server_name scorpius.yourcompany.com;

    location / {
        proxy_pass http://scorpius_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run test
      - run: npm run typecheck
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build:production
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      - name: Deploy to server
        run: |
          rsync -avz dist/ ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }}:/var/www/scorpius/
```

## 🛡️ Security Checklist

### Pre-deployment Security

- [ ] **Environment variables** are properly configured
- [ ] **API endpoints** are using HTTPS
- [ ] **Authentication** is properly configured
- [ ] **CORS** settings are restrictive
- [ ] **CSP headers** are implemented
- [ ] **Rate limiting** is enabled
- [ ] **Input validation** is in place
- [ ] **Error handling** doesn't leak sensitive information

### Post-deployment Security

- [ ] **SSL certificates** are valid and properly configured
- [ ] **Security headers** are present
- [ ] **Vulnerability scanning** is performed
- [ ] **Access logs** are monitored
- [ ] **Backup procedures** are in place
- [ ] **Incident response** plan is documented

## 🆘 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Memory Issues

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### Permission Issues

```bash
# Fix file permissions
chmod -R 755 dist/
chown -R www-data:www-data /var/www/scorpius/
```

### Performance Issues

#### Bundle Size Optimization

```bash
# Analyze bundle
npm run analyze

# Remove unused dependencies
npx depcheck
```

#### Runtime Performance

```bash
# Enable production optimizations
export NODE_ENV=production
export VITE_APP_ENV=production
```

## 📞 Support

For deployment assistance:

- **Technical Support**: support@scorpius.io
- **Security Issues**: security@scorpius.io
- **Documentation**: https://docs.scorpius.io/deployment

---

**© 2024 Scorpius Security. All rights reserved.**
