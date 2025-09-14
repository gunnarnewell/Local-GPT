Place platform-specific llama.cpp server binaries here for packaging and dev runs.

Expected filenames per platform:

- Windows: `runtime/llama/win/llama-server.exe`
- macOS: `runtime/llama/mac/llama-server`
- Linux: `runtime/llama/linux/llama-server`

Notes:
- CPU builds are recommended for widest compatibility.
- Ensure macOS/Linux binaries are executable: `chmod +x runtime/llama/{mac,linux}/llama-server`.
- Electron Builder bundles from `runtime/llama/${os}` → `runtime/llama` at build time.

