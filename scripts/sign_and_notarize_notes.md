# macOS Hardened Runtime & Notarization

1. Create an Apple Developer ID Application certificate.
2. In `electron-builder.yml` ensure `hardenedRuntime: true`.
3. Export `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `CSC_LINK` (cert) and `CSC_KEY_PASSWORD`.
4. Run `npm run dist` on macOS. Electron Builder will sign and notarize.

# Windows (SmartScreen)

- Code signing certificate recommended for fewer SmartScreen warnings.
- Without signing, Windows may show a warning on first runs.

# GPU Builds (Optional)

- **CPU default**: the included instructions assume CPU-only.
- **CUDA** (Windows/Linux): build `llama.cpp` with `LLAMA_CUBLAS=1`.
- **Metal** (macOS Apple Silicon): build with `LLAMA_METAL=1`.

Copy your platform-built `llama-server` binary into:
- `runtime/llama/win/llama-server.exe`
- `runtime/llama/mac/llama-server`
- `runtime/llama/linux/llama-server`
