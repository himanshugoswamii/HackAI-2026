#!/usr/bin/env bash
# Run the Neural Threads API (this one - api/). The frontend expects THIS server on port 8000.
# Do NOT run backend/ on 8000 or you will get 404 on "Do I need this?" and other routes.
cd "$(dirname "$0")"
echo "Starting Neural Threads API (api/) on http://0.0.0.0:8000"
echo "Open http://localhost:8000/ to confirm this is the right server."
echo ""
uvicorn main:app --host 0.0.0.0 --port 8000
