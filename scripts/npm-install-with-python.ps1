$ErrorActionPreference = 'Stop'
$nodeDir = 'C:\\Program Files\\nodejs'
$pyCandidates = @(
  'C:\\Users\\Gunnar\\AppData\\Local\\Programs\\Python\\Python311',
  'C:\\Users\\Gunnar\\AppData\\Local\\Programs\\Python\\Python312'
)
if (-not (Test-Path (Join-Path $nodeDir 'npm.cmd'))) { throw 'npm.cmd not found in expected node directory' }
$pyDir = $null
foreach ($cand in $pyCandidates) {
  if (Test-Path (Join-Path $cand 'python.exe')) { $pyDir = $cand; break }
}
if (-not $pyDir) { throw 'python.exe not found in expected python directories' }
$env:Path = "$nodeDir;$pyDir;$env:Path"
$env:npm_config_python = (Join-Path $pyDir 'python.exe')
& (Join-Path $pyDir 'python.exe') --version
& (Join-Path $nodeDir 'npm.cmd') install
