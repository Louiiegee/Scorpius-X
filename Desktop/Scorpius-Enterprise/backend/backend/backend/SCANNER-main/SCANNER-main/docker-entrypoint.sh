#!/bin/bash
set -e

# Wait for database
echo "Waiting for database..."
while ! pg_isready -h postgres -U scorpius; do
  sleep 1
done

# Execute the main command
exec "$@"
