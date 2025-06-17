# 🔐 Scorpius Backend Specification - License Verification & Tiered SaaS

## Overview

This specification covers the backend implementation for Scorpius's tiered SaaS system with license verification, IP protection, and security hardening.

## 🎯 System Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   API Gateway       │    │   Auth Service      │    │   License Service   │
│   - Rate Limiting   │────│   - JWT/FIDO2       │────│   - Tier Validation │
│   - Tier Validation │    │   - Session Mgmt    │    │   - Feature Flags   │
│   - Feature Flags   │    │   - Permission ACL  │    │   - Usage Tracking  │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
          │                          │                          │
          │                          │                          │
          └────────────────────────────────────────────────────┘
                                     │
          ┌─────────────────────────────────────────────────────┐
          │               Core Application Services               │
          │  ┌─────────────────┐  ┌─────────────────┐           │
          │  │   Scanner API   │  │  Security API   │           │
          │  │  (Confidential  │  │  - Integrity    │           │
          │  │   Compute)      │  │  - Violations   │           │
          │  └─────────────────┘  │  - Leak Detect  │           │
          │                       └─────────────────┘           │
          └─────────────────────────────────────────────────────┘
                                     │
          ┌─────────────────────────────────────────────────────┐
          │                Database Layer                        │
          │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
          │  │    Users    │  │  Licenses   │  │   Usage     │  │
          │  │  Sessions   │  │   Tiers     │  │  Metrics    │  │
          │  └─────────────┘  └─────────────┘  └─────────────┘  │
          └─────────────────────────────────────────────────────┘
```

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    organization_id UUID REFERENCES organizations(id),
    tier user_tier NOT NULL DEFAULT 'community',
    status user_status NOT NULL DEFAULT 'active',
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    fido_credentials JSONB DEFAULT '[]'
);

CREATE TYPE user_tier AS ENUM ('community', 'starter', 'pro', 'enterprise');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
```

### Organizations Table

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tier user_tier NOT NULL DEFAULT 'community',
    license_key VARCHAR(100) UNIQUE,
    status org_status NOT NULL DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    ip_whitelist TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE org_status AS ENUM ('active', 'suspended', 'expired', 'trial');
```

### Licenses Table

```sql
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key VARCHAR(100) UNIQUE NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    tier user_tier NOT NULL,
    status license_status NOT NULL DEFAULT 'active',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    limits JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT
);

CREATE TYPE license_status AS ENUM ('active', 'expired', 'revoked', 'suspended');
```

### Sessions Table

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked BOOLEAN DEFAULT FALSE
);
```

### Feature Flags Table

```sql
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    tier_required user_tier NOT NULL DEFAULT 'community',
    permissions_required TEXT[] DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    environment VARCHAR(50) DEFAULT 'production',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Usage Tracking Table

```sql
CREATE TABLE usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    feature_name VARCHAR(100) NOT NULL,
    usage_type usage_type NOT NULL,
    amount INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE GENERATED ALWAYS AS (timestamp::DATE) STORED
);

CREATE TYPE usage_type AS ENUM ('api_call', 'scan', 'export', 'simulation', 'analysis');

-- Index for efficient usage queries
CREATE INDEX idx_usage_metrics_user_feature_date
ON usage_metrics(user_id, feature_name, date);
```

### Security Violations Table

```sql
CREATE TABLE security_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES user_sessions(id),
    violation_type violation_type NOT NULL,
    severity severity_level NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id)
);

CREATE TYPE violation_type AS ENUM ('csp', 'sri', 'module_tampering', 'suspicious_extension', 'rate_limit', 'unauthorized_access');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
```

## 🔐 Authentication & Authorization APIs

### POST /api/auth/register

```typescript
interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  licenseKey?: string;
  organization?: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    tier: UserTier;
  };
}
```

**Implementation Logic:**

1. Validate email format and password strength
2. Check if license key is valid (if provided)
3. Determine tier based on license or default to community
4. Hash password with bcrypt (12 rounds)
5. Send email verification
6. Return success without auto-login

### POST /api/auth/login

```typescript
interface LoginRequest {
  email: string;
  password: string;
  licenseKey?: string;
  rememberMe?: boolean;
  mfaCode?: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: UserProfile;
  mfaRequired?: boolean;
  error?: string;
}
```

**Implementation Logic:**

1. Validate credentials against database
2. Check if MFA is required
3. Validate license key if provided
4. Generate JWT with tier claims
5. Create session record
6. Apply rate limiting (5 attempts per 15 minutes)
7. Log security events

### POST /api/auth/fido2/challenge

```typescript
interface FIDO2ChallengeResponse {
  challenge: string;
  options: PublicKeyCredentialRequestOptions;
  sessionId: string;
}
```

**Implementation Logic:**

1. Generate cryptographic challenge
2. Store challenge in Redis (5-minute TTL)
3. Return WebAuthn options
4. Include allowed credentials for user

### POST /api/auth/fido2/verify

```typescript
interface FIDO2VerifyRequest {
  id: string;
  rawId: number[];
  response: {
    authenticatorData: number[];
    clientDataJSON: number[];
    signature: number[];
    userHandle?: number[];
  };
  type: string;
}
```

**Implementation Logic:**

1. Verify challenge from Redis
2. Validate authenticator response
3. Check credential against stored public key
4. Generate JWT with elevated permissions
5. Log successful authentication

## 🎫 License Management APIs

### POST /api/license/validate

```typescript
interface LicenseValidateRequest {
  licenseKey: string;
}

interface LicenseValidateResponse {
  valid: boolean;
  tier: UserTier;
  organization?: string;
  expiresAt?: string;
  limits: TierLimits;
  warnings?: string[];
  error?: string;
}
```

**Implementation Logic:**

1. Parse license key format (PREFIX-XXXX-XXXX-XXXX-CHECKSUM)
2. Validate checksum using HMAC-SHA256
3. Check license status in database
4. Verify expiration date
5. Return tier limits and restrictions
6. Log validation attempt

### POST /api/license/issue (Admin Only)

```typescript
interface LicenseIssueRequest {
  organizationId: string;
  tier: UserTier;
  expiresAt?: string;
  limits?: Partial<TierLimits>;
  metadata?: Record<string, any>;
}

interface LicenseIssueResponse {
  licenseKey: string;
  tier: UserTier;
  limits: TierLimits;
}
```

**Implementation Logic:**

1. Verify admin permissions
2. Generate unique license key with checksum
3. Store in database with encrypted metadata
4. Send license details to organization admin
5. Log license issuance

## 🚦 Feature Flag & Rate Limiting APIs

### GET /api/features/flags

```typescript
interface FeatureFlagsResponse {
  flags: FeatureFlag[];
  userTier: UserTier;
  permissions: string[];
}
```

**Implementation Logic:**

1. Extract tier from JWT
2. Filter flags by tier and permissions
3. Apply rollout percentage logic
4. Return enabled features only
5. Cache response for 5 minutes

### POST /api/features/usage

```typescript
interface FeatureUsageRequest {
  feature: string;
  amount?: number;
  metadata?: Record<string, any>;
}
```

**Implementation Logic:**

1. Validate feature access for user tier
2. Check current usage against limits
3. Record usage in database
4. Update Redis cache for real-time limits
5. Return remaining quota

### Middleware: Rate Limiting

```typescript
async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userTier = extractTierFromJWT(req.headers.authorization);
  const feature = req.path.split("/")[3]; // Extract feature from path

  const limits = getTierLimits(userTier, feature);
  const key = `rate_limit:${req.user.id}:${feature}`;

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, 3600); // 1 hour window
  }

  if (current > limits.maxRequests) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      limit: limits.maxRequests,
      resetTime: Date.now() + 3600000,
    });
  }

  res.setHeader("X-RateLimit-Limit", limits.maxRequests);
  res.setHeader("X-RateLimit-Remaining", limits.maxRequests - current);

  next();
}
```

## 🔒 Security & Integrity APIs

### POST /api/security/integrity

```typescript
interface IntegrityReport {
  timestamp: string;
  modules: ModuleInfo[];
  signature: string;
  browserInfo: BrowserInfo;
  violations?: IntegrityViolation[];
}

interface IntegrityResponse {
  valid: boolean;
  action?: "continue" | "logout" | "restrict";
  message?: string;
}
```

**Implementation Logic:**

1. Verify HMAC signature
2. Compare module hashes against known good values
3. Check for suspicious browser indicators
4. Store violations in database
5. Apply automatic responses based on severity

### POST /api/security/violations

```typescript
interface ViolationReport {
  type: "csp" | "sri" | "module_tampering" | "suspicious_extension";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  evidence?: any;
}
```

**Implementation Logic:**

1. Validate violation data
2. Store in violations table
3. Trigger alerts for high/critical severity
4. Apply automatic responses:
   - Critical: Force logout
   - High: Rate limit or restrict features
   - Medium/Low: Log only

### POST /api/security/leak-scan

```typescript
interface LeakScanRequest {
  canaryTokens: string[];
  searchSources: ("github" | "pastebin" | "stackoverflow")[];
}

interface LeakScanResponse {
  leaksFound: {
    token: string;
    source: string;
    url: string;
    confidence: number;
  }[];
  scanId: string;
}
```

**Implementation Logic:**

1. Schedule background scan job
2. Search for canary tokens across specified sources
3. Use GitHub Advanced Security API
4. Store results and create alerts
5. Notify security team of findings

## 🔐 Confidential Compute Integration

### AWS Nitro Enclaves Setup

```bash
# Enclave configuration
{
  "cpu_count": 4,
  "memory_mb": 8192,
  "enclave_image": "scorpius-analyzer:latest",
  "attestation_required": true,
  "kms_key_arn": "arn:aws:kms:region:account:key/key-id"
}
```

### Enclave API Endpoints (Internal VPC Only)

```typescript
// POST /enclave/analyze (Internal Only)
interface EnclaveAnalysisRequest {
  contractBytecode: string;
  analysisType: "vulnerability" | "mev" | "honeypot";
  attestationDocument: string;
}

interface EnclaveAnalysisResponse {
  analysisId: string;
  results: AnalysisResult[];
  attestation: {
    measurements: string;
    timestamp: string;
    signature: string;
  };
}
```

**Implementation Logic:**

1. Verify enclave attestation document
2. Decrypt analysis models from KMS
3. Run analysis in isolated environment
4. Sign results with enclave key
5. Return encrypted response

## 📊 Billing & Subscription APIs

### GET /api/billing/subscription

```typescript
interface SubscriptionResponse {
  tier: UserTier;
  status: "active" | "expired" | "cancelled" | "trial";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  usage: {
    [feature: string]: {
      used: number;
      limit: number;
      resetDate: string;
    };
  };
  nextBillingDate?: string;
}
```

### POST /api/billing/upgrade

```typescript
interface UpgradeRequest {
  targetTier: UserTier;
  billingPeriod: "monthly" | "yearly";
  paymentMethodId: string;
}

interface UpgradeResponse {
  success: boolean;
  subscriptionId: string;
  newLicenseKey: string;
  effectiveDate: string;
}
```

**Implementation Logic:**

1. Validate payment method with Stripe
2. Calculate prorated amount
3. Issue new license key
4. Update user tier immediately
5. Send confirmation email

## 🔧 Environment Configuration

### Production Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/scorpius
DATABASE_POOL_SIZE=20
DATABASE_SSL_MODE=require

# Authentication
JWT_SECRET=your-256-bit-secret
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret

# Encryption
ENCRYPTION_KEY=your-32-byte-encryption-key
HMAC_SECRET=your-hmac-secret

# External Services
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG.xxx
GITHUB_TOKEN=ghp_xxx (for leak scanning)

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
KMS_KEY_ID=arn:aws:kms:...
NITRO_ENCLAVE_CID=16

# Redis
REDIS_URL=redis://username:password@host:6379
REDIS_POOL_SIZE=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_COMMUNITY=100
RATE_LIMIT_STARTER=1000
RATE_LIMIT_PRO=5000
RATE_LIMIT_ENTERPRISE=25000

# Security
CSP_REPORT_URI=/api/security/csp-report
INTEGRITY_CHECK_INTERVAL=300000
CANARY_SCAN_INTERVAL=86400000

# Monitoring
DATADOG_API_KEY=xxx
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=info
```

## 🚀 API Gateway Configuration (Kong)

```yaml
# kong.yml
_format_version: "3.0"

services:
  - name: scorpius-auth
    url: http://auth-service:3001
    routes:
      - name: auth-routes
        paths: ["/api/auth"]

  - name: scorpius-core
    url: http://core-service:3002
    routes:
      - name: core-routes
        paths: ["/api"]

plugins:
  - name: rate-limiting-advanced
    config:
      limit:
        - 100 # Community
        - 1000 # Starter
        - 5000 # Pro
        - 25000 # Enterprise
      window_size: [3600]
      identifier: jwt_claim.sub

  - name: jwt
    config:
      key_claim_name: tier
      claims_to_verify: [exp, tier]

  - name: request-transformer
    config:
      add:
        headers:
          - "X-User-Tier:$(jwt_claim.tier)"
          - "X-User-ID:$(jwt_claim.sub)"
```

## 📈 Monitoring & Observability

### Key Metrics to Track

```typescript
// Application Metrics
{
  "license_validations_per_minute": 150,
  "tier_upgrade_requests": 5,
  "feature_usage_by_tier": {
    "community": { "basic_scanning": 45 },
    "starter": { "basic_scanning": 120, "advanced_scanning": 89 },
    "pro": { "mev_analysis": 67, "simulation": 23 },
    "enterprise": { "white_label": 12 }
  },
  "rate_limit_violations": 8,
  "security_violations": {
    "csp": 2,
    "integrity": 0,
    "suspicious_extensions": 3
  },
  "api_response_times": {
    "p50": 45,
    "p95": 120,
    "p99": 250
  }
}
```

### Health Check Endpoints

```typescript
// GET /health
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "enclave": "healthy",
    "kms": "healthy"
  },
  "metrics": {
    "active_sessions": 1247,
    "requests_per_minute": 2341,
    "error_rate": 0.02
  }
}
```

This comprehensive backend specification provides the foundation for implementing Scorpius's tiered SaaS system with robust security, license verification, and IP protection measures.
