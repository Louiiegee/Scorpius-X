#!/bin/bash

# Production Dependencies Installation Script
# This script installs additional production-grade tooling

set -e

echo "🚀 Installing production-grade dependencies..."

# Install global tools for enterprise development
npm install -g \
  @typescript-eslint/parser@latest \
  @typescript-eslint/eslint-plugin@latest \
  prettier-plugin-tailwindcss@latest \
  license-checker@latest \
  bundlesize@latest \
  lighthouse@latest

echo "🔧 Installing additional development dependencies..."

# Install comprehensive dev dependencies
npm install --save-dev \
  @testing-library/jest-dom@latest \
  @testing-library/react@latest \
  @testing-library/user-event@latest \
  @vitest/coverage-v8@latest \
  jsdom@latest \
  husky@latest \
  lint-staged@latest \
  standard-version@latest \
  rimraf@latest

echo "🛡️ Setting up security tools..."

# Install security tools
npm install --save-dev \
  eslint-plugin-security@latest \
  eslint-plugin-import@latest \
  eslint-plugin-jsx-a11y@latest

echo "⚡ Setting up performance tools..."

# Install performance monitoring tools
npm install --save-dev \
  webpack-bundle-analyzer@latest \
  source-map-explorer@latest

echo "🔍 Setting up Git hooks..."

# Initialize Husky
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# Create pre-push hook
npx husky add .husky/pre-push "npm run typecheck && npm run test"

echo "📋 Setting up lint-staged configuration..."

# Add lint-staged configuration to package.json if not exists
node -e "
const pkg = require('./package.json');
if (!pkg['lint-staged']) {
  pkg['lint-staged'] = {
    '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
    '*.{json,css,md}': ['prettier --write']
  };
  require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
  console.log('✅ lint-staged configuration added to package.json');
} else {
  console.log('✅ lint-staged configuration already exists');
}
"

echo "🏗️ Setting up build optimization..."

# Create production build script
cat > scripts/build-production.sh << 'EOF'
#!/bin/bash
set -e

echo "🧹 Cleaning previous builds..."
npm run clean

echo "🔍 Type checking..."
npm run typecheck

echo "🧹 Linting code..."
npm run lint

echo "🧪 Running tests..."
npm run test

echo "📦 Building for production..."
NODE_ENV=production npm run build

echo "📊 Analyzing bundle..."
npm run analyze

echo "✅ Production build complete!"
EOF

chmod +x scripts/build-production.sh

echo "🔐 Setting up security checks..."

# Create security audit script
cat > scripts/security-audit.sh << 'EOF'
#!/bin/bash
set -e

echo "🔍 Running npm audit..."
npm audit --audit-level=high

echo "📋 Checking licenses..."
npx license-checker --summary

echo "🔐 Checking for known vulnerabilities..."
npx audit-ci --config audit-ci.json

echo "✅ Security audit complete!"
EOF

chmod +x scripts/security-audit.sh

echo "📈 Setting up performance monitoring..."

# Create performance test script
cat > scripts/performance-test.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting development server..."
npm run dev &
DEV_PID=$!

echo "⏳ Waiting for server to start..."
sleep 10

echo "🔍 Running Lighthouse audit..."
npx lighthouse http://localhost:8080 --output html --output-path ./lighthouse-report.html --chrome-flags="--headless"

echo "📊 Running bundle size check..."
npx bundlesize

echo "🛑 Stopping development server..."
kill $DEV_PID

echo "✅ Performance tests complete!"
echo "📋 Lighthouse report: ./lighthouse-report.html"
EOF

chmod +x scripts/performance-test.sh

echo "🎉 Production environment setup complete!"
echo ""
echo "Available scripts:"
echo "  📦 npm run build:production     - Full production build with all checks"
echo "  🔐 ./scripts/security-audit.sh - Run security audits"
echo "  📈 ./scripts/performance-test.sh - Run performance tests"
echo "  🏗️ ./scripts/build-production.sh - Production build script"
echo ""
echo "🚀 Your enterprise-grade Scorpius dashboard is ready for distribution!"
