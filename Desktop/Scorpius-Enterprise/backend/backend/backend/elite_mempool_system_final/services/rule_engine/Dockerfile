# Rust Rule Engine Service Dockerfile
FROM rust:1.75-slim-bullseye as builder

# Install dependencies for compilation
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy manifests first for better caching
COPY Cargo.toml Cargo.lock ./

# Copy source code
COPY src ./src

# Build the application
RUN cargo build --release

# Runtime stage
FROM debian:bullseye-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl1.1 \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1001 appuser

# Copy the binary from builder stage
COPY --from=builder /usr/src/app/target/release/rule_engine /usr/local/bin/rule_engine

# Change ownership of the binary
RUN chown appuser:appuser /usr/local/bin/rule_engine

# Switch to non-root user
USER appuser

# Expose port if needed
EXPOSE 9091

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD pgrep rule_engine || exit 1

# Set the startup command
CMD ["rule_engine"]
