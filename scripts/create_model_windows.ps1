Param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Host "ollama command not found. Install Ollama first from https://ollama.ai/download." -ForegroundColor Red
    exit 1
}

Write-Host "Pulling base model {{MODEL_TAG}}..."
ollama pull {{MODEL_TAG}}

if (Select-String -Path "Modelfile" -Pattern "{{INSTRUCTIONS_PLACEHOLDER}}" -SimpleMatch -Quiet) {
    Write-Error "Detected {{INSTRUCTIONS_PLACEHOLDER}} in Modelfile. Paste prompts/instructions.md before creating the model."
    exit 1
}

Write-Host "Creating model {{ASSISTANT_NAME}} from Modelfile..."
ollama create {{ASSISTANT_NAME}} -f Modelfile

Write-Host "Success! Run .\scripts\start_webui_windows.ps1 to launch Open WebUI against your local model."