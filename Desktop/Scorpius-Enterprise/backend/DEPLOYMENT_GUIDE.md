# 🚀 Scorpius Deployment Guide - Production Security Hardening

## 🏗️ Infrastructure Setup

### 1. AWS Nitro Enclaves for Confidential Compute

#### Enclave Image Build

```dockerfile
# Dockerfile.enclave
FROM amazonlinux:2

# Install dependencies
RUN yum update -y && \
    yum install -y python3 python3-pip openssl && \
    pip3 install flask cryptography

# Copy analysis engine
COPY analysis-engine/ /app/
COPY enclave-bootstrap.py /app/

WORKDIR /app

# Create non-root user
RUN useradd -m enclave && chown -R enclave:enclave /app
USER enclave

EXPOSE 8000
CMD ["python3", "enclave-bootstrap.py"]
```

#### Enclave Bootstrap Script

```python
# enclave-bootstrap.py
import json
import hashlib
import hmac
import os
from cryptography.fernet import Fernet
from flask import Flask, request, jsonify

app = Flask(__name__)

class EnclaveService:
    def __init__(self):
        self.attestation_doc = self.get_attestation_document()
        self.models = self.fetch_models_from_kms()

    def get_attestation_document(self):
        """Get NSM attestation document"""
        try:
            import nsm_client
            client = nsm_client.NsmClient()
            return client.get_attestation_doc()
        except ImportError:
            # Fallback for development
            return {"measurements": "dev-mode"}

    def fetch_models_from_kms(self):
        """Fetch encrypted ML models from KMS"""
        # Verify attestation first
        if not self.verify_enclave_integrity():
            raise Exception("Enclave integrity check failed")

        # Fetch models from S3/KMS (simplified)
        return {"vulnerability_model": "loaded", "mev_model": "loaded"}

    def verify_enclave_integrity(self):
        """Verify enclave measurements match expected values"""
        expected_hash = os.environ.get('EXPECTED_ENCLAVE_HASH')
        current_hash = hashlib.sha256(
            str(self.attestation_doc).encode()
        ).hexdigest()
        return hmac.compare_digest(expected_hash, current_hash)

enclave = EnclaveService()

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "attestation": enclave.attestation_doc,
        "models_loaded": bool(enclave.models)
    })

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json

    # Verify request signature
    if not verify_request_signature(data):
        return jsonify({"error": "Invalid signature"}), 403

    # Perform analysis
    results = run_analysis(data['bytecode'], data['analysis_type'])

    # Sign response
    signature = sign_response(results)

    return jsonify({
        "results": results,
        "signature": signature,
        "attestation": enclave.attestation_doc
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, ssl_context='adhoc')
```

#### Enclave Deployment Script

```bash
#!/bin/bash
# deploy-enclave.sh

set -e

# Build enclave image
docker build -f Dockerfile.enclave -t scorpius-analyzer .

# Convert to Nitro format
nitro-cli build-image \
    --docker-uri scorpius-analyzer:latest \
    --output-file scorpius-analyzer.eif

# Deploy enclave
nitro-cli run-enclave \
    --cpu-count 4 \
    --memory 8192 \
    --eif-path scorpius-analyzer.eif \
    --debug-mode false \
    --enable-debug-mode false

echo "Enclave deployed successfully"
nitro-cli describe-enclaves
```

### 2. API Gateway with Kong Security Plugins

#### Kong Configuration

```yaml
# kong-config.yml
_format_version: "3.0"

services:
  - name: scorpius-api
    url: http://api:3001
    routes:
      - name: api-routes
        paths: ["/api"]
        strip_path: false

plugins:
  # Rate limiting with ML anomaly detection
  - name: rate-limiting-advanced
    config:
      limit:
        - 100 # Community tier
        - 1000 # Starter tier
        - 5000 # Pro tier
        - 25000 # Enterprise tier
      window_size: [3600]
      identifier: jwt_claim.sub
      sync_rate: 10
      strategy: cluster
      redis_host: redis
      redis_port: 6379

  # JWT validation with tier claims
  - name: jwt
    config:
      key_claim_name: iss
      secret_claim_name: tier
      claims_to_verify:
        - exp
        - tier
        - permissions
      maximum_expiration: 3600

  # Request signing for sensitive operations
  - name: hmac-auth
    config:
      hide_credentials: true
      validate_request_body: true
      enforce_headers: ["date", "request-line"]
      algorithms: ["hmac-sha256"]

  # IP restrictions for enterprise
  - name: ip-restriction
    config:
      allow: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
      deny: []

  # CORS with strict origins
  - name: cors
    config:
      origins:
        - https://app.scorpius.security
        - https://dashboard.scorpius.security
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
      headers: ["Authorization", "Content-Type", "X-Requested-With"]
      exposed_headers: ["X-RateLimit-Limit", "X-RateLimit-Remaining"]
      credentials: true
      max_age: 3600

  # Bot protection
  - name: bot-detection
    config:
      blacklist:
        - user_agent: ["bot", "crawler", "spider"]
        - ip: ["known-bot-ips"]
      whitelist:
        - user_agent: ["Scorpius-Desktop/"]
```

### 3. Database Security Configuration

#### PostgreSQL Hardening

```sql
-- Create database with encryption
CREATE DATABASE scorpius
WITH ENCODING 'UTF8'
LC_COLLATE 'en_US.UTF-8'
LC_CTYPE 'en_US.UTF-8';

-- Enable row-level security
ALTER DATABASE scorpius SET row_security = on;

-- Create encrypted tablespace
CREATE TABLESPACE encrypted_data
LOCATION '/var/lib/postgresql/encrypted'
WITH (encryption_key_id = 'aws:kms:key-id');

-- Enable audit logging
ALTER SYSTEM SET logging_collector = 'on';
ALTER SYSTEM SET log_destination = 'csvlog';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_connections = 'on';
ALTER SYSTEM SET log_disconnections = 'on';

-- Create application user with minimal privileges
CREATE ROLE scorpius_app WITH
    LOGIN
    PASSWORD 'strong-generated-password'
    CONNECTION LIMIT 20;

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE scorpius TO scorpius_app;
GRANT USAGE ON SCHEMA public TO scorpius_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO scorpius_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO scorpius_app;

-- Row-level security policies
CREATE POLICY user_data_isolation ON users
    FOR ALL TO scorpius_app
    USING (id = current_setting('app.user_id')::uuid);

CREATE POLICY org_data_isolation ON organizations
    FOR ALL TO scorpius_app
    USING (id = current_setting('app.org_id')::uuid);
```

#### Database Backup & Encryption

```bash
#!/bin/bash
# backup-database.sh

set -e

# Encrypted backup with GPG
pg_dump scorpius | \
  gzip | \
  gpg --cipher-algo AES256 --compress-algo 1 --symmetric --output \
  "/backups/scorpius-$(date +%Y%m%d_%H%M%S).sql.gz.gpg"

# Upload to S3 with server-side encryption
aws s3 cp "/backups/scorpius-$(date +%Y%m%d_%H%M%S).sql.gz.gpg" \
  s3://scorpius-backups/ \
  --server-side-encryption aws:kms \
  --sse-kms-key-id arn:aws:kms:region:account:key/key-id

# Cleanup local backups older than 7 days
find /backups -name "scorpius-*.sql.gz.gpg" -mtime +7 -delete
```

### 4. Frontend Security Hardening

#### Content Security Policy

```javascript
// csp-middleware.js
const helmet = require("helmet");

const cspConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Remove in production
        "https://cdn.jsdelivr.net",
        (req, res) => `'nonce-${res.locals.nonce}'`,
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https://api.scorpius.security"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
    reportUri: "/api/security/csp-report",
  },
};

module.exports = helmet(cspConfig);
```

#### Subresource Integrity (SRI)

```html
<!-- index.html with SRI hashes -->
<script
  src="/static/js/main.abc123.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"
></script>

<link
  rel="stylesheet"
  href="/static/css/main.def456.css"
  integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u"
  crossorigin="anonymous"
/>
```

#### Build-time SRI Generation

```javascript
// build-scripts/generate-sri.js
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function generateSRI(filePath) {
  const content = fs.readFileSync(filePath);
  const hash = crypto.createHash("sha384").update(content).digest("base64");
  return `sha384-${hash}`;
}

function updateIndexHtml() {
  const buildDir = path.join(__dirname, "../dist");
  const indexPath = path.join(buildDir, "index.html");

  let html = fs.readFileSync(indexPath, "utf8");

  // Update script tags with SRI
  html = html.replace(/<script src="([^"]+)"/g, (match, src) => {
    const fullPath = path.join(buildDir, src);
    if (fs.existsSync(fullPath)) {
      const integrity = generateSRI(fullPath);
      return `<script src="${src}" integrity="${integrity}" crossorigin="anonymous"`;
    }
    return match;
  });

  // Update CSS links with SRI
  html = html.replace(
    /<link rel="stylesheet" href="([^"]+)"/g,
    (match, href) => {
      const fullPath = path.join(buildDir, href);
      if (fs.existsSync(fullPath)) {
        const integrity = generateSRI(fullPath);
        return `<link rel="stylesheet" href="${href}" integrity="${integrity}" crossorigin="anonymous"`;
      }
      return match;
    },
  );

  fs.writeFileSync(indexPath, html);
}

updateIndexHtml();
```

### 5. SBOM Generation & Code Signing

#### CycloneDX SBOM Generation

```javascript
// generate-sbom.js
const fs = require("fs");
const crypto = require("crypto");
const { execSync } = require("child_process");

function generateSBOM() {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const lockfile = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));

  const components = Object.entries(lockfile.dependencies || {}).map(
    ([name, info]) => ({
      type: "library",
      name,
      version: info.version,
      purl: `pkg:npm/${name}@${info.version}`,
      hashes: info.integrity
        ? [
            {
              alg: "SHA-512",
              content: info.integrity.replace("sha512-", ""),
            },
          ]
        : [],
    }),
  );

  const sbom = {
    bomFormat: "CycloneDX",
    specVersion: "1.4",
    serialNumber: `urn:uuid:${crypto.randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [
        {
          vendor: "Scorpius Security",
          name: "sbom-generator",
          version: "1.0.0",
        },
      ],
      component: {
        type: "application",
        name: packageJson.name,
        version: packageJson.version,
        purl: `pkg:npm/${packageJson.name}@${packageJson.version}`,
      },
    },
    components,
  };

  return sbom;
}

function signSBOM(sbom) {
  const content = JSON.stringify(sbom, null, 2);
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(content)
    .sign(process.env.SIGNING_PRIVATE_KEY, "base64");

  return {
    ...sbom,
    signature: {
      algorithm: "RS256",
      value: signature,
      publicKey: process.env.SIGNING_PUBLIC_KEY,
    },
  };
}

// Generate and sign SBOM
const sbom = generateSBOM();
const signedSBOM = signSBOM(sbom);

fs.writeFileSync("dist/sbom.json", JSON.stringify(signedSBOM, null, 2));
console.log("SBOM generated and signed successfully");
```

### 6. Continuous Leak Scanning Pipeline

#### GitHub Actions Workflow

```yaml
# .github/workflows/leak-scan.yml
name: Leak Detection Scan

on:
  schedule:
    - cron: "0 2 * * *" # Daily at 2 AM
  workflow_dispatch:

jobs:
  leak-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm install

      - name: Run TruffleHog
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD

      - name: Scan GitHub for canary tokens
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CANARY_TOKENS: ${{ secrets.CANARY_TOKENS }}
        run: |
          node scripts/scan-github-leaks.js

      - name: Check public repositories
        env:
          SEARCH_QUERIES: ${{ secrets.SEARCH_QUERIES }}
        run: |
          node scripts/scan-public-repos.js

      - name: Report findings
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: 'security-alerts',
              title: 'Potential Code Leak Detected',
              body: 'Automated scan detected potential code leak. Please investigate immediately.',
              labels: ['security', 'urgent']
            });
```

#### Leak Detection Script

```javascript
// scripts/scan-github-leaks.js
const { Octokit } = require("@octokit/rest");
const fs = require("fs");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const canaryTokens = process.env.CANARY_TOKENS.split(",");

async function scanForLeaks() {
  const findings = [];

  for (const token of canaryTokens) {
    try {
      const response = await octokit.rest.search.code({
        q: `"${token}" in:file`,
        per_page: 100,
      });

      for (const item of response.data.items) {
        // Skip our own repositories
        if (item.repository.owner.login === "scorpius-security") {
          continue;
        }

        findings.push({
          token,
          repository: item.repository.full_name,
          file: item.path,
          url: item.html_url,
          confidence: calculateConfidence(item),
        });
      }
    } catch (error) {
      console.error(`Error searching for token ${token}:`, error.message);
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (findings.length > 0) {
    console.log(`🚨 Found ${findings.length} potential leaks:`);
    findings.forEach((finding) => {
      console.log(`  - ${finding.repository}/${finding.file}`);
      console.log(`    Token: ${finding.token}`);
      console.log(`    URL: ${finding.url}`);
      console.log(`    Confidence: ${finding.confidence}%\n`);
    });

    // Send alert
    await sendAlert(findings);
    process.exit(1); // Fail the build
  } else {
    console.log("✅ No leaks detected");
  }
}

function calculateConfidence(item) {
  let score = 50; // Base score

  // Repository factors
  if (item.repository.private === false) score += 30;
  if (item.repository.stargazers_count > 100) score += 10;
  if (item.repository.forks_count > 10) score += 10;

  // File factors
  if (item.path.includes("test") || item.path.includes("example")) score -= 20;
  if (item.path.endsWith(".md")) score -= 10;

  return Math.max(0, Math.min(100, score));
}

async function sendAlert(findings) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const message = {
    text: `🚨 Code Leak Alert`,
    attachments: [
      {
        color: "danger",
        fields: findings.slice(0, 5).map((finding) => ({
          title: finding.repository,
          value: `File: ${finding.file}\nConfidence: ${finding.confidence}%`,
          short: true,
        })),
      },
    ],
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
}

scanForLeaks().catch(console.error);
```

### 7. Production Deployment

#### Docker Compose for Production

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  app:
    image: scorpius-app:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    networks:
      - app-network
    volumes:
      - ./ssl:/app/ssl:ro
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
          cpus: "0.5"
        reservations:
          memory: 512M
          cpus: "0.25"

  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_DB=scorpius
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres-init:/docker-entrypoint-initdb.d:ro
    networks:
      - app-network
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: "1.0"

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - app-network

  kong:
    image: kong:3.4
    restart: unless-stopped
    environment:
      - KONG_DATABASE=off
      - KONG_DECLARATIVE_CONFIG=/kong.yml
      - KONG_PROXY_ACCESS_LOG=/dev/stdout
      - KONG_ADMIN_ACCESS_LOG=/dev/stdout
      - KONG_PROXY_ERROR_LOG=/dev/stderr
      - KONG_ADMIN_ERROR_LOG=/dev/stderr
      - KONG_ADMIN_LISTEN=0.0.0.0:8001
    volumes:
      - ./kong.yml:/kong.yml:ro
    ports:
      - "80:8000"
      - "443:8443"
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

#### Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Starting Scorpius deployment..."

# Load environment variables
source .env.production

# Build and push images
docker build -t scorpius-app:latest .
docker tag scorpius-app:latest ${ECR_REGISTRY}/scorpius-app:latest
docker push ${ECR_REGISTRY}/scorpius-app:latest

# Deploy to ECS/EKS
aws ecs update-service \
  --cluster scorpius-production \
  --service scorpius-app \
  --force-new-deployment

# Wait for deployment
aws ecs wait services-stable \
  --cluster scorpius-production \
  --services scorpius-app

# Run database migrations
kubectl run migration-job \
  --image=${ECR_REGISTRY}/scorpius-app:latest \
  --restart=Never \
  --command -- npm run migrate

# Verify deployment
curl -f https://api.scorpius.security/health || exit 1

echo "✅ Deployment completed successfully"
```

This deployment guide provides comprehensive security hardening for production Scorpius deployments with confidential compute, proper encryption, and continuous monitoring.