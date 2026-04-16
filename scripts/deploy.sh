#!/bin/bash
# Deploy script — rebuild and restart Docker container
set -e

echo "Building production..."
npm run build -- --configuration production

echo "Rebuilding Docker..."
docker-compose up --build -d

echo "Waiting for health check..."
sleep 5
STATUS=$(docker inspect --format='{{.State.Health.Status}}' claude-learning-platform 2>/dev/null || echo "unknown")
echo "Container status: $STATUS"

if [ "$STATUS" = "healthy" ] || [ "$STATUS" = "starting" ]; then
  echo "Deploy successful!"
else
  echo "WARNING: Container may not be healthy. Check: docker logs claude-learning-platform"
fi
