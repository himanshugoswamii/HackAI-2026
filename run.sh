#!/bin/bash
# Run API + web app. Frees ports 8000 and 5173, then starts API in background and web in foreground.
set -e
cd "$(dirname "$0")"

echo "Freeing ports 8000 and 5173..."
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true
sleep 1

echo "Starting API on http://localhost:8000 ..."
cd api
if [ ! -d venv ]; then
  echo "Creating venv and installing dependencies..."
  python3 -m venv venv
  ./venv/bin/pip install -r requirements.txt
fi
./venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
API_PID=$!
cd ..

sleep 3
echo "Starting web app on http://localhost:5173 ..."
cd web
if [ ! -d node_modules ]; then
  echo "Installing npm dependencies..."
  npm install
fi
npm run dev

# User stopped the web app; stop API too
kill $API_PID 2>/dev/null || true
echo "Stopped."
