#!/usr/bin/env bash
set -euo pipefail

if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama command not found. Install Ollama first from https://ollama.ai/download." >&2
  exit 1
fi

echo "Pulling base model {{MODEL_TAG}}..."
ollama pull {{MODEL_TAG}}

if grep -q "{{INSTRUCTIONS_PLACEHOLDER}}" Modelfile; then
  echo "Detected {{INSTRUCTIONS_PLACEHOLDER}} in Modelfile. Paste prompts/instructions.md before creating the model." >&2
  exit 1
fi

echo "Creating model {{ASSISTANT_NAME}} from Modelfile..."
ollama create {{ASSISTANT_NAME}} -f Modelfile

echo "Success! Run ./scripts/start_webui_mac_linux.sh to launch Open WebUI against your local model."