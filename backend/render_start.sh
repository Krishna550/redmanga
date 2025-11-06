#!/bin/bash
# Render start script for backend

set -e

echo "Starting FastAPI server..."
uvicorn server:app --host 0.0.0.0 --port $PORT --workers 1
