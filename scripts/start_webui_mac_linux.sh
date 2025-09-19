#!/usr/bin/env bash
set -euo pipefail

WEBUI_PORT="${WEBUI_PORT:-8080}"
OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://127.0.0.1:11434}"

if ! command -v open-webui >/dev/null 2>&1; then
  echo "open-webui command not found."
  echo "Install via: python3 -m pip install --user open-webui"
  exit 1
fi

echo "Starting Open WebUI on http://127.0.0.1:${WEBUI_PORT} ..."
OLLAMA_BASE_URL="$OLLAMA_BASE_URL" open-webui serve --host 127.0.0.1 --port "$WEBUI_PORT" &
WEBUI_PID=$!

sleep 2

if command -v open >/dev/null 2>&1; then
  open "http://127.0.0.1:${WEBUI_PORT}" >/dev/null 2>&1 || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://127.0.0.1:${WEBUI_PORT}" >/dev/null 2>&1 || true
else
  echo "Open your browser to http://127.0.0.1:${WEBUI_PORT}"
fi

echo "Tip: If the model is not visible, open Settings → Connections and set the OLLAMA base URL."
echo "Press Ctrl+C to stop Open WebUI. Logs follow:"
wait "$WEBUI_PID"