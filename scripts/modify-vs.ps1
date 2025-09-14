$ErrorActionPreference = 'Stop'
$vsinst = 'C:\Program Files (x86)\Microsoft Visual Studio\Installer\vs_installer.exe'
if (-not (Test-Path $vsinst)) { Write-Host 'vs_installer.exe not found'; exit 1 }
& $vsinst modify --installPath "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools" `
  --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 `
  --add Microsoft.VisualStudio.Component.Windows10SDK.19041 `
  --quiet --wait --norestart
Write-Host 'VS components modification completed.'

