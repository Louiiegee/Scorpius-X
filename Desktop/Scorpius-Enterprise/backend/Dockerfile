FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Foundry
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="/root/.foundry/bin:$PATH"
RUN foundryup

WORKDIR /app

# Install Python dependencies
COPY pyproject.toml ./
RUN pip install -e .

# Copy application
COPY . .

# Create workspace
RUN mkdir -p workspace

# Add entrypoint script for migrations
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["uvicorn", "scorpius_scanner.api.server:app", "--host", "0.0.0.0", "--port", "8000"]
