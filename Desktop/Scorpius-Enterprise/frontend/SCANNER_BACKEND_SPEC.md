# 🔍 Vulnerability Scanner - Backend Integration Specification

## Overview

This document outlines the complete backend integration requirements for the Scorpius Vulnerability Scanner module, including plugin management, custom plugin support, and real-time scanning capabilities.

## 🎯 Core Scanner API Endpoints

### Plugin Management

#### GET /api/scanner/plugins

**Description**: Retrieve all available plugins for the user's tier

**Authentication**: Required (JWT with tier claims)

**Request Parameters**:

```typescript
interface PluginListRequest {
  category?: "security" | "performance" | "compliance" | "custom";
  enabled?: boolean;
  custom?: boolean;
}
```

**Response**:

```typescript
interface PluginListResponse {
  plugins: ScanPlugin[];
  userTier: UserTier;
  availableCount: number;
  installedCount: number;
}

interface ScanPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: "security" | "performance" | "compliance" | "custom";
  tier: UserTier;
  enabled: boolean;
  configurable: boolean;
  config?: Record<string, any>;
  configSchema?: Record<string, PluginConfigSchema>;
  isCustom: boolean;
  status: "active" | "inactive" | "error" | "updating";
  lastUpdated: string;
  scanCount: number;
  findings: number;
  avgExecutionTime: number;
  documentation?: string;
  website?: string;
  permissions: string[];
  size: number; // in MB
}
```

**Implementation Logic**:

1. Extract user tier from JWT
2. Filter plugins by tier access level
3. Include user's custom plugins
4. Return plugin configurations and metadata
5. Apply rate limiting based on tier

#### POST /api/scanner/plugins/{id}/enable

**Description**: Enable a specific plugin for scanning

**Authentication**: Required

**Request Body**:

```typescript
interface EnablePluginRequest {
  config?: Record<string, any>;
}
```

**Response**:

```typescript
interface EnablePluginResponse {
  success: boolean;
  plugin: ScanPlugin;
  message?: string;
}
```

**Implementation Logic**:

1. Verify user has access to plugin tier
2. Validate plugin configuration if provided
3. Update user preferences in database
4. Return updated plugin status

#### POST /api/scanner/plugins/{id}/disable

**Description**: Disable a plugin

**Implementation**: Similar to enable but sets enabled: false

#### GET /api/scanner/plugins/{id}/config

**Description**: Get plugin configuration schema and current values

**Response**:

```typescript
interface PluginConfigResponse {
  config: Record<string, any>;
  schema: Record<string, PluginConfigSchema>;
  defaults: Record<string, any>;
}

interface PluginConfigSchema {
  type: "string" | "number" | "boolean" | "array" | "object" | "select";
  label: string;
  description?: string;
  default: any;
  required?: boolean;
  min?: number;
  max?: number;
  options?: string[];
  validation?: {
    pattern?: string;
    message?: string;
  };
}
```

#### PUT /api/scanner/plugins/{id}/config

**Description**: Update plugin configuration

**Request Body**:

```typescript
interface UpdateConfigRequest {
  config: Record<string, any>;
}
```

**Implementation Logic**:

1. Validate configuration against schema
2. Check tier-specific limits (e.g., depth limits for community tier)
3. Save configuration to user preferences
4. Return validation errors if any

#### POST /api/scanner/plugins/{id}/test

**Description**: Test plugin with current configuration

**Request Body**:

```typescript
interface TestPluginRequest {
  config: Record<string, any>;
  testTarget?: {
    type: "address" | "bytecode" | "source";
    value: string;
  };
}
```

**Response**:

```typescript
interface TestPluginResponse {
  success: boolean;
  executionTime: number;
  memoryUsage: number;
  results?: any[];
  error?: string;
}
```

### Custom Plugin Management

#### POST /api/scanner/plugins/upload

**Description**: Upload custom plugin (Pro+ tier required)

**Authentication**: Required (Pro+ tier)

**Request**: Multipart form data with plugin file

**File Types Supported**:

- `.py` - Python plugins
- `.js` - JavaScript plugins
- `.wasm` - WebAssembly modules
- `.zip` - Plugin packages with manifest

**Request Body**:

```typescript
interface UploadPluginRequest {
  file: File;
  metadata?: {
    name?: string;
    description?: string;
    version?: string;
  };
}
```

**Response**:

```typescript
interface UploadPluginResponse {
  success: boolean;
  plugin: ScanPlugin;
  validationWarnings?: string[];
  error?: string;
}
```

**Implementation Logic**:

1. Verify user tier (Pro+ required)
2. Validate file format and size limits
3. Security scan the uploaded plugin
4. Extract metadata from plugin manifest
5. Sandbox the plugin for testing
6. Store in user's custom plugins
7. Return plugin information

**File Size Limits by Tier**:

- Pro: 25MB
- Enterprise: 100MB

#### DELETE /api/scanner/plugins/{id}

**Description**: Delete custom plugin

**Authentication**: Required (owner of custom plugin)

**Implementation Logic**:

1. Verify plugin ownership
2. Check if plugin is currently in use
3. Remove from database and file storage
4. Update user's active plugin list

### Scan Operations

#### POST /api/scanner/scan

**Description**: Start a new vulnerability scan

**Authentication**: Required

**Request Body**:

```typescript
interface StartScanRequest {
  target: ScanTarget;
  plugins: string[]; // Plugin IDs to use
  config?: {
    priority?: "low" | "normal" | "high";
    timeout?: number; // seconds
    webhookUrl?: string;
    saveResults?: boolean;
  };
}

interface ScanTarget {
  type: "address" | "bytecode" | "source" | "file";
  value: string;
  name?: string;
  metadata?: {
    network?: "mainnet" | "testnet" | "polygon" | "bsc";
    blockNumber?: number;
  };
}
```

**Response**:

```typescript
interface StartScanResponse {
  success: boolean;
  scanId: string;
  estimatedDuration: number; // seconds
  queuePosition?: number;
  error?: string;
}
```

**Implementation Logic**:

1. Validate user's concurrent scan limits
2. Check plugin access permissions
3. Validate target format
4. Queue scan job with priority based on tier
5. Return scan ID for tracking

**Tier-based Limits**:

```typescript
const SCAN_LIMITS = {
  community: {
    concurrent: 1,
    timeout: 300, // 5 minutes
    queuePriority: "low",
    pluginsLimit: 3,
  },
  starter: {
    concurrent: 3,
    timeout: 900, // 15 minutes
    queuePriority: "normal",
    pluginsLimit: 10,
  },
  pro: {
    concurrent: 10,
    timeout: 1800, // 30 minutes
    queuePriority: "high",
    pluginsLimit: 25,
  },
  enterprise: {
    concurrent: 50,
    timeout: 3600, // 1 hour
    queuePriority: "highest",
    pluginsLimit: -1, // unlimited
  },
};
```

#### GET /api/scanner/scans

**Description**: Get user's scan history with pagination

**Query Parameters**:

```typescript
interface ScanListQuery {
  page?: number;
  limit?: number;
  status?: "queued" | "running" | "completed" | "failed" | "cancelled";
  startDate?: string;
  endDate?: string;
}
```

**Response**:

```typescript
interface ScanListResponse {
  scans: ScanJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### GET /api/scanner/scans/{id}

**Description**: Get detailed scan information and results

**Response**:

```typescript
interface ScanDetailResponse extends ScanJob {
  logs?: string[];
  performance?: {
    totalTime: number;
    pluginTimes: Record<string, number>;
    memoryUsage: number;
    cpuUsage: number;
  };
}

interface ScanJob {
  id: string;
  target: ScanTarget;
  plugins: string[];
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number; // 0-100
  startTime: string;
  endTime?: string;
  results: ScanResult[];
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
}
```

#### POST /api/scanner/scans/{id}/stop

**Description**: Stop a running scan

**Response**:

```typescript
interface StopScanResponse {
  success: boolean;
  message: string;
  partialResults?: ScanResult[];
}
```

#### DELETE /api/scanner/scans/{id}

**Description**: Delete scan and its results

**Implementation Logic**:

1. Verify scan ownership
2. Stop scan if running
3. Remove from database
4. Clean up associated files

### Results Management

#### GET /api/scanner/results

**Description**: Get scan results with filtering and pagination

**Query Parameters**:

```typescript
interface ResultsQuery {
  scanId?: string;
  severity?: "critical" | "high" | "medium" | "low" | "info";
  category?: string;
  resolved?: boolean;
  page?: number;
  limit?: number;
}
```

#### PUT /api/scanner/results/{id}/status

**Description**: Update result status (resolve, investigate, etc.)

**Request Body**:

```typescript
interface UpdateResultRequest {
  status: "active" | "resolved" | "investigating" | "false_positive";
  comment?: string;
}
```

#### GET /api/scanner/results/export

**Description**: Export scan results in various formats

**Query Parameters**:

```typescript
interface ExportQuery {
  scanId?: string;
  format: "json" | "csv" | "pdf" | "sarif";
  includeResolved?: boolean;
}
```

**Tier-based Export Limits**:

- Community: JSON only
- Starter: JSON, CSV
- Pro: JSON, CSV, PDF
- Enterprise: All formats + custom templates

## 🔌 Plugin Marketplace API

### Marketplace Browsing

#### GET /api/marketplace/plugins

**Description**: Browse available plugins in marketplace

**Query Parameters**:

```typescript
interface MarketplaceQuery {
  category?: string;
  tier?: UserTier;
  search?: string;
  sort?: "popular" | "rating" | "newest" | "name";
  page?: number;
  limit?: number;
}
```

#### GET /api/marketplace/plugins/{id}

**Description**: Get detailed plugin information from marketplace

#### POST /api/marketplace/plugins/{id}/install

**Description**: Install plugin from marketplace

**Implementation Logic**:

1. Verify tier access and payment if required
2. Download and validate plugin
3. Install in user's plugin library
4. Update usage statistics

### Plugin Development API

#### POST /api/marketplace/plugins/submit

**Description**: Submit plugin to marketplace (Enterprise tier)

**Request Body**:

```typescript
interface SubmitPluginRequest {
  plugin: File;
  metadata: {
    name: string;
    description: string;
    category: string;
    pricing: {
      type: "free" | "paid" | "subscription";
      amount?: number;
    };
    documentation: string;
    repository?: string;
  };
}
```

## 🔒 Security & Sandboxing

### Plugin Sandboxing

**Implementation Requirements**:

1. **Container Isolation**: Each plugin runs in isolated Docker container
2. **Resource Limits**: CPU, memory, and disk usage caps
3. **Network Restrictions**: Limited network access
4. **File System**: Read-only access to scan targets only
5. **Timeout Enforcement**: Hard timeout limits per tier

**Sandbox Configuration**:

```yaml
plugin_sandbox:
  container:
    image: "scorpius-plugin-runner:latest"
    memory_limit: "512MB"
    cpu_limit: "0.5"
    network: "restricted"
    readonly_rootfs: true

  timeouts:
    community: 300 # 5 minutes
    starter: 900 # 15 minutes
    pro: 1800 # 30 minutes
    enterprise: 3600 # 1 hour

  permissions:
    - "read_contract_code"
    - "analyze_bytecode"
    - "access_blockchain_data"
```

### Custom Plugin Validation

**Security Checks**:

1. **Static Analysis**: Scan for malicious code patterns
2. **Dependency Check**: Validate all dependencies
3. **Signature Verification**: Require code signing for marketplace
4. **Runtime Monitoring**: Monitor resource usage and API calls
5. **Capability Assessment**: Verify declared vs actual capabilities

## 📊 Real-time Updates (WebSocket)

### WebSocket Endpoints

#### WS /ws/scanner/progress

**Description**: Real-time scan progress updates

**Message Format**:

```typescript
interface ScanProgressMessage {
  type: "progress" | "result" | "error" | "completed";
  scanId: string;
  data: {
    progress?: number;
    currentPlugin?: string;
    result?: ScanResult;
    error?: string;
    estimatedTimeRemaining?: number;
  };
}
```

#### WS /ws/scanner/plugins/status

**Description**: Plugin status updates (installs, updates, etc.)

## 🗄️ Database Schema Extensions

### Scanner-specific Tables

```sql
-- User plugin configurations
CREATE TABLE user_plugin_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plugin_id VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, plugin_id)
);

-- Custom plugins
CREATE TABLE custom_plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plugin_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    metadata JSONB DEFAULT '{}',
    status plugin_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id)
);

CREATE TYPE plugin_status AS ENUM ('pending', 'approved', 'rejected', 'disabled');

-- Scan jobs
CREATE TABLE scan_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_type scan_target_type NOT NULL,
    target_value TEXT NOT NULL,
    target_metadata JSONB DEFAULT '{}',
    plugins_used TEXT[] NOT NULL,
    status scan_status DEFAULT 'queued',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    priority scan_priority DEFAULT 'normal',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    timeout_seconds INTEGER DEFAULT 300,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE scan_target_type AS ENUM ('address', 'bytecode', 'source', 'file');
CREATE TYPE scan_status AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE scan_priority AS ENUM ('low', 'normal', 'high', 'highest');

-- Scan results
CREATE TABLE scan_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES scan_jobs(id) ON DELETE CASCADE,
    plugin_id VARCHAR(100) NOT NULL,
    severity severity_level NOT NULL,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    recommendation TEXT,
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    location JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    status result_status DEFAULT 'active',
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE result_status AS ENUM ('active', 'resolved', 'investigating', 'false_positive');

-- Plugin marketplace
CREATE TABLE marketplace_plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    version VARCHAR(50) NOT NULL,
    author_id UUID REFERENCES users(id),
    category plugin_category NOT NULL,
    tier_required user_tier NOT NULL,
    price_type pricing_type DEFAULT 'free',
    price_amount DECIMAL(10,2),
    price_currency VARCHAR(3) DEFAULT 'USD',
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    documentation_url VARCHAR(500),
    repository_url VARCHAR(500),
    website_url VARCHAR(500),
    tags TEXT[] DEFAULT '{}',
    permissions TEXT[] DEFAULT '{}',
    status marketplace_status DEFAULT 'pending',
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE plugin_category AS ENUM ('security', 'performance', 'compliance', 'defi', 'nft', 'governance');
CREATE TYPE pricing_type AS ENUM ('free', 'paid', 'subscription');
CREATE TYPE marketplace_status AS ENUM ('pending', 'approved', 'rejected', 'disabled');
```

### Indexes for Performance

```sql
-- Query optimization indexes
CREATE INDEX idx_scan_jobs_user_status ON scan_jobs(user_id, status);
CREATE INDEX idx_scan_jobs_created_at ON scan_jobs(created_at DESC);
CREATE INDEX idx_scan_results_scan_severity ON scan_results(scan_id, severity);
CREATE INDEX idx_user_plugin_configs_user_enabled ON user_plugin_configs(user_id, enabled);
CREATE INDEX idx_marketplace_plugins_category_tier ON marketplace_plugins(category, tier_required);
CREATE INDEX idx_marketplace_plugins_rating ON marketplace_plugins(rating_average DESC, download_count DESC);
```

## 🚀 Implementation Priorities

### Phase 1 (Sprint 1): Core Scanner API

- [ ] Plugin management endpoints
- [ ] Basic scan operations
- [ ] Result storage and retrieval
- [ ] Tier-based access control

### Phase 2 (Sprint 2): Custom Plugin Support

- [ ] Plugin upload and validation
- [ ] Sandboxing infrastructure
- [ ] Security scanning of plugins
- [ ] Plugin configuration management

### Phase 3 (Sprint 3): Real-time Features

- [ ] WebSocket implementation
- [ ] Live progress tracking
- [ ] Queue management
- [ ] Performance monitoring

### Phase 4 (Sprint 4): Marketplace

- [ ] Plugin marketplace API
- [ ] Plugin submission workflow
- [ ] Rating and review system
- [ ] Payment integration

This specification provides the complete backend foundation needed to support the sophisticated vulnerability scanner frontend with plugin management, custom plugin support, and real-time scanning capabilities.
