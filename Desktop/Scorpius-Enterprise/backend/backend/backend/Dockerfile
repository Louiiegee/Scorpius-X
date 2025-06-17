FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY . .

# Make the startup script executable
RUN chmod +x start.sh

# Expose the API and WebSocket ports
EXPOSE 8000
EXPOSE 8081

# Start both servers using the startup script
CMD ["./start.sh"]
