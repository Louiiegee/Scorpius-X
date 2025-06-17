#!/bin/bash
# scripts/build_plugin_templates.sh

set -e

echo "🔨 Building plugin templates..."

# Check dependencies
if ! command -v cargo &> /dev/null; then
    echo "❌ Cargo not found. Install Rust toolchain first."
    exit 1
fi

# Add WASI target if not present
rustup target add wasm32-wasi

# Build Rust WASM template
cd plugins/templates/rust

echo "Building Rust WASM plugin..."
cargo build --release --target=wasm32-wasi

# Verify the build
WASM_FILE="target/wasm32-wasi/release/scorpius_plugin_template.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM build failed"
    exit 1
fi

# Calculate and update hash
HASH=$(sha256sum "$WASM_FILE" | cut -d' ' -f1)
sed -i "s/sha256 = .*/sha256 = \"$HASH\"/" plugin.toml

echo "✅ Plugin templates built successfully"
echo "📦 WASM: $WASM_FILE"
echo "🔐 SHA256: $HASH"
echo "📄 Size: $(du -h "$WASM_FILE" | cut -f1)"

# Test execution with wasmtime if available
if command -v wasmtime &> /dev/null; then
    echo "🧪 Testing execution..."
    echo '{"target":"test","context":{"chain_rpc":"","block_number":null,"workdir":""}}' | \
        wasmtime "$WASM_FILE" --allow-unknown-exports || echo "⚠️  Test execution failed"
fi
