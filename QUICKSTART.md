# QUICKSTART

1. Install Ollama  
   - macOS: download and run the installer from https://ollama.ai/download.  
   - Windows: download the installer from https://ollama.ai/download and follow the prompts.  
   - Linux: `curl -fsSL https://ollama.ai/install.sh | sh`
2. Pull the base model: `ollama pull {{MODEL_TAG}}`  
   - Hardware note: 20B-class models typically need ~16 GB of available memory (VRAM or RAM).
3. Bake your custom instructions  
   - Open `Modelfile`, then paste the entire contents of `prompts/instructions.md` over `{{INSTRUCTIONS_PLACEHOLDER}}`.  
   - Create the model: `ollama create {{ASSISTANT_NAME}} -f Modelfile`
4. Install Open WebUI with pip  
   - macOS/Linux: `python3 -m pip install --user open-webui`  
   - Windows: `py -m pip install --user open-webui`
5. Start Open WebUI  
   - macOS/Linux: `./scripts/start_webui_mac_linux.sh` (or run `OLLAMA_BASE_URL=http://127.0.0.1:11434 open-webui serve --host 127.0.0.1 --port 8080`)  
   - Windows: `.\scripts\start_webui_windows.ps1`  
   - The browser should open to http://localhost:8080. Use launchers/* if you need quick shortcuts.  
   - If the model is not auto-detected: WebUI → Settings → Connections → set the OLLAMA base URL to `http://127.0.0.1:11434`.
6. Use Knowledge  
   - Drop PDFs/TXTs into `knowledge/`, then upload them inside Open WebUI’s Knowledge/Library to enable RAG features.
7. CLI/API alternatives  
   - CLI: `ollama run {{ASSISTANT_NAME}}`  
   - API: point OpenAI-compatible clients to `http://localhost:11434/v1`. Example:
     ```
     curl -s http://127.0.0.1:11434/v1/chat/completions \
       -H "Content-Type: application/json" \
       -d '{"model":"{{ASSISTANT_NAME}}","messages":[{"role":"user","content":"Hello"}]}'
     ```

## Troubleshooting
- `ollama` / `open-webui` command not found: reopen your terminal or add the installer’s bin directory to PATH; upgrade pip with `python3 -m pip install --user --upgrade pip` if needed.  
- Windows PowerShell script blocked: run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.  
- Update Ollama: re-run the installer or `ollama update`.

Support: contact {{CONTACT_EMAIL}} for help.  
License & distribution: © {{YEAR}} {{COMPANY_NAME}}. See repository LICENSE if provided.