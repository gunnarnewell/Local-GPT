Param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$env:WEBUI_PORT = $env:WEBUI_PORT ?? '8080'
$env:OLLAMA_BASE_URL = $env:OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434'

if (-not (Get-Command open-webui -ErrorAction SilentlyContinue)) {
    Write-Host "open-webui command not found." -ForegroundColor Red
    Write-Host "Install via: py -m pip install --user open-webui"
    exit 1
}

Write-Host "Starting Open WebUI on http://127.0.0.1:$($env:WEBUI_PORT) ..."
$cmdArgs = @(
    '/c',
    "set ""OLLAMA_BASE_URL=$($env:OLLAMA_BASE_URL)"" && open-webui serve --host 127.0.0.1 --port $($env:WEBUI_PORT)"
)
Start-Process -FilePath 'cmd.exe' -ArgumentList $cmdArgs -WindowStyle Normal

Start-Sleep -Seconds 3
Start-Process "http://127.0.0.1:$($env:WEBUI_PORT)"

Write-Host "Open WebUI launched. Keep the new window open to monitor logs."
Write-Host "Tip: If the model is not visible, open Settings → Connections and set the OLLAMA base URL."