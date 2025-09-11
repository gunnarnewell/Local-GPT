# Local Assistant

# Local Assistant

**Offline** desktop app that runs a local LLM + RAG with **no Docker** and **no Ollama**. Ships Electron + React + TypeScript, spawns **two** `llama.cpp` servers (chat & embeddings) bound to `127.0.0.1`.

- Downloads GGUF models on first run (resume + SHA256).
- Simple RAG: drop docs → chunk → embed locally → cosine search → citations.
- Single installers: Windows `.exe`, macOS `.dmg`, Linux `.AppImage`.
- No telemetry. Loopback-only.

## Project Layout

local-assistant/
app/
main/ # Electron main (TS)
preload/
renderer/ # React UI (TS)
shared/
runtime/
llama/win/llama-server.exe
llama/mac/llama-server
llama/linux/llama-server
assets/prompts/instructions.md
data/ # created on first run: models/, knowledge/, index/, logs/
scripts/
model_manifest.json
electron-builder.yml
LICENSES/
README.md

markdown
Copy code

## Prereqs

- Node 20+
- (Packaging) Xcode CLT for macOS, build-essentials for Linux, MSVC Build Tools for Windows.
- **Binaries:** Replace `runtime/llama/*/llama-server*` with your `llama.cpp` `llama-server` build (CPU recommended for widest compatibility). Make executable (`chmod +x`) on mac/linux.

Build notes for CUDA/Metal/CPU in `scripts/sign_and_notarize_notes.md`.

## Models

Edit `model_manifest.json` with your URLs and SHA256 sums. Example entries:
- Chat: `gpt-oss-20b-q4_k_m.gguf` (or any GGUF chat model)
- Embedding: `bge-small` or `nomic-embed` GGUF

> First run prompts to download into `data/models/`.

## Dev Run

```bash
# install deps
npm install
# build main & preload once for dev runner
npm run build:main && npm run build:preload
# start vite renderer + electron
npm run dev
Renderer at Vite dev server.

Electron loads renderer via VITE_DEV_SERVER_URL.

Build Installers
bash
Copy code
npm run dist
Outputs to release/:

Windows: Local Assistant-Setup-<version>.exe

macOS: Local Assistant-<version>.dmg

Linux: Local Assistant-<version>.AppImage

Estimated Installer Sizes (without models)
Windows: ~90–110 MB

macOS: ~85–100 MB

Linux: ~80–95 MB

(Varies with Electron version and dependency tree.)

First-Run Flow
Welcome prompt asks to download models (~X GB) — resume + SHA256 verified.

Starts two llama.cpp servers:

Chat: 127.0.0.1:11435

Embeddings: 127.0.0.1:11436

Chat UI opens.

If a server crashes, open Settings → Open data folder then check data/logs/.

RAG How-To
Go to Knowledge → Add Documents (TXT/MD/PDF).

Ask a question in Chat with Use Knowledge enabled.

See citations under the answer.

Security & Privacy
Servers bind to 127.0.0.1 only.

No telemetry. (No outgoing requests besides local servers.)

CSP in renderer blocks remote origins.

Swapping Models
Update model_manifest.json (URL + SHA256). Delete old file in data/models/ to force re-download.

Tests
bash
Copy code
npm test
Covers:

SHA256 helper

Downloader resume logic (local range server)

Vector math (cosine)

Known Issues
For large corpora (>5k chunks), retrieval is in-memory; consider paging or ANN later.

GPU toggles are not exposed in UI by default; app ships CPU-first for compatibility.

Demo Script
Launch app; accept model download.

Add a .txt and a .pdf in Knowledge.

In Chat, enable “Use Knowledge”, ask a question; answer should cite both sources.

Licenses
See About → Licenses and LICENSES/.

markdown
Copy code

---

# How to run & build (quick)

- **Dev:** `npm install && npm run build:main && npm run build:preload && npm run dev`
- **Build installers:** `npm run dist`

# Platform caveats

- **macOS:** You’ll likely need signing + notarization (see `scripts/sign_and_notarize_notes.md`). Unsigned apps show “can’t be opened” Gatekeeper prompts.
- **Windows:** Without code signing, SmartScreen may warn on first installs.
- **Linux:** AppImage should run on most mainstream distros; `chmod +x` if needed.

