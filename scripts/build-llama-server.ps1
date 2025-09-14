param(
  [ValidateSet('cpu','cublas','metal')]
  [string]$Backend = 'cpu'
)

$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }

$repoUrl = 'https://github.com/ggerganov/llama.cpp.git'
$workDir = Join-Path $PSScriptRoot '..' | Resolve-Path
$cloneDir = Join-Path $workDir 'tmp-llama.cpp'

if (Test-Path $cloneDir) { Remove-Item -Recurse -Force $cloneDir }
New-Item -ItemType Directory -Force -Path $cloneDir | Out-Null

Write-Info "Cloning llama.cpp..."
git clone --depth 1 $repoUrl $cloneDir | Out-Null

Push-Location $cloneDir
try {
  $buildDir = Join-Path $cloneDir 'build'
  New-Item -ItemType Directory -Force -Path $buildDir | Out-Null
  Push-Location $buildDir

  $isWindows = $env:OS -like '*Windows*'
  $cmakeArgs = @('-S', '..', '-B', '.', '-DCMAKE_BUILD_TYPE=Release', '-DLLAMA_CURL=OFF', '-DLLAMA_BUILD_TESTS=OFF')
  if ($isWindows) {
    $hasNinja = $null -ne (Get-Command ninja -ErrorAction SilentlyContinue)
    $hasNMake = $null -ne (Get-Command nmake -ErrorAction SilentlyContinue)
    if ($hasNinja) {
      $cmakeArgs = @('-G','Ninja') + $cmakeArgs
    } elseif ($hasNMake) {
      $cmakeArgs = @('-G','NMake Makefiles') + $cmakeArgs
    } else {
      # Fallback to Visual Studio generator; CMake will try to locate VS
      $cmakeArgs = @('-G','Visual Studio 17 2022','-A','x64') + $cmakeArgs
    }
  }
  switch ($Backend) {
    'cpu'    { }
    'cublas' { $cmakeArgs += '-DLLAMA_CUBLAS=1' }
    'metal'  { $cmakeArgs += '-DLLAMA_METAL=1' }
  }

  Write-Info "Configuring CMake ($Backend)..."
  cmake @cmakeArgs | Out-Null

  Write-Info "Building (Release)..."
  cmake --build . --config Release --parallel | Out-Null

  $isWindows = $env:OS -like '*Windows*'
  $isMac = $env:OS -notlike '*Windows*' -and ($env:OSTYPE -eq 'darwin' -or $env:MACHTYPE -like '*apple*')
  # Simple OS pick via PowerShell: use $IsWindows
  if ($PSVersionTable.PSEdition -eq 'Desktop' -or $env:OS -like '*Windows*') { $platform = 'win' }
  else {
    $uname = (uname).Trim().ToLower()
    if ($uname -eq 'darwin') { $platform = 'mac' } else { $platform = 'linux' }
  }

  $outDir = Join-Path $workDir "runtime/llama/$platform"
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null

  $src = if ($platform -eq 'win') { Join-Path $buildDir 'bin/Release/llama-server.exe' } else { Join-Path $buildDir 'bin/llama-server' }
  if (-not (Test-Path $src)) { $src = if ($platform -eq 'win') { Join-Path $buildDir 'bin/llama-server.exe' } else { Join-Path $buildDir 'bin/llama-server' } }

  if (-not (Test-Path $src)) {
    throw "Could not find built llama-server at: $src"
  }

  $dest = if ($platform -eq 'win') { Join-Path $outDir 'llama-server.exe' } else { Join-Path $outDir 'llama-server' }
  Copy-Item $src $dest -Force
  if ($platform -ne 'win') {
    Write-Info "Marking $dest executable"
    bash -lc "chmod +x '$dest'" 2>$null | Out-Null
  }

  Write-Host "✅ Installed llama-server ($Backend) to: $dest" -ForegroundColor Green
}
finally {
  Pop-Location
  Pop-Location
  try { Remove-Item -Recurse -Force $cloneDir } catch { Write-Warn "Failed to clean temp dir: $cloneDir" }
}
