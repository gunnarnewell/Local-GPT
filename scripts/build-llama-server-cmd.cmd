@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" -arch=amd64
set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Links;C:\Program Files\CMake\bin;%PATH%"
echo Checking cl and ninja presence...
where cl
where ninja
if errorlevel 1 (
  echo cl not found after VsDevCmd; trying vcvars fallback...
  call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\vsdevcmd\ext\vcvars.bat" amd64
  where cl
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0\build-llama-server.ps1" -Backend cpu
