#!/bin/bash

echo "Building Docker Image..."

docker build -t resumeparsing-ui .

echo "Stopping Existing Container..."

docker stop resumeparsing-ui || true
docker rm resumeparsing-ui || true

echo "Starting New Container..."

docker run -d \
--name resumeparsing-ui \
-p 80:80 \
resumeparsing-ui

echo "Deployment Completed"