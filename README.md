# Local Assistant WebUI Kit

This repository packages the documentation, prompt template, helper scripts, and launcher shortcuts needed to distribute {{PRODUCT_NAME}} as an Ollama-based assistant exposed through Open WebUI.

## Contents

-   `QUICKSTART.md` – concise setup instructions for installing Ollama, baking the {{ASSISTANT_NAME}} model, and running Open WebUI without Docker.
-   `Modelfile` – template for `ollama create`; replace `{{INSTRUCTIONS_PLACEHOLDER}}` with the full prompt from `prompts/instructions.md` before building the model.
-   `prompts/` – system instructions template with placeholders for {{COMPANY_NAME}} to customize.
-   `knowledge/` – placeholder directory where users can drop PDFs/TXTs/CSVs prior to uploading through Open WebUI’s Knowledge feature.
-   `scripts/` – cross-platform helpers to pull the base model, bake instructions, and launch Open WebUI against the local Ollama service.
-   `launchers/` – OS-specific shortcuts that open http://localhost:8080 in the default browser.
-   `CONFIG.example.env` – sample environment variables for default Ollama and WebUI endpoints.

## Usage Workflow

1.  Read and follow `QUICKSTART.md` to install prerequisites, customize the Modelfile, and create the {{ASSISTANT_NAME}} model from {{MODEL_TAG}}.
2.  Update placeholders (`{{PRODUCT_NAME}}`, `{{ASSISTANT_NAME}}`, `{{CONTACT_EMAIL}}`, etc.) across the prompt and documentation before sharing with end users.
3.  Use the helper scripts (`create_model_*`, `start_webui_*`) for a streamlined setup on macOS, Linux, or Windows.
4.  Share the launchers with end users so they can open the hosted WebUI quickly once the server is running.

## Network & Public Access

-   **Local network sharing:** run Open WebUI with `--host 0.0.0.0` and a fixed port (e.g., 8080), ensure the firewall allows inbound traffic, then have teammates visit `http://<your-hostname>:8080`. Keep Ollama bound to `127.0.0.1` so only the UI is network-exposed, and require authentication inside WebUI.
-   **Public exposure:** front the WebUI with a reverse proxy (Nginx, Caddy, or cloud load balancer) that terminates TLS, enforces authentication, and optionally adds rate limits. If hosting externally, lock down the Ollama endpoint with a VPN or IP allow-list to prevent unauthorized access. Avoid publishing the raw Ollama port to the internet.

## Customization & Maintenance

-   Tailor `prompts/instructions.md` whenever {{COMPANY_NAME}} updates operating policies, then rebuild the model via the create script.
-   Mirror edits to `QUICKSTART.md` or this README whenever processes change.
-   Keep binaries, build artifacts, and large files out of version control; rely on the scripts and instructions instead of packaging compiled assets.

## Support & Licensing

Document licensing separately (e.g., add a `LICENSE` file) and direct customers to {{CONTACT_EMAIL}} for assistance. Update copyright notices with {{YEAR}}.