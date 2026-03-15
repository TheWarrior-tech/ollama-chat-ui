# Ollama Chat UI

A **ChatGPT-style** chat interface for your local Ollama LLMs, with Stable Diffusion image generation — all running in Docker.

## Features
- 💬 Stream responses from any Ollama model
- 🎨 Generate images via Stable Diffusion (AUTOMATIC1111 API)
- 📋 Markdown + code highlighting with copy buttons
- 🗂️ Persistent conversation history (per session)
- ⚡ Stop generation mid-stream
- 🌙 Dark theme matching ChatGPT/Claude aesthetics

## Quick Start

### Prerequisites
- Docker & Docker Compose installed
- [Ollama](https://ollama.ai) running locally on port `11434`
- At least one model pulled: `ollama pull llama3`

### Run
```bash
git clone https://github.com/TheWarrior-tech/ollama-chat-ui
cd ollama-chat-ui
docker compose up --build
```

Open **http://localhost:3000**

## Image Generation

Stable Diffusion runs as a separate Docker container on port `7860`. It will auto-start with `docker compose up`. The first run downloads models automatically (~4GB).

In the chat input, toggle **Image Gen** mode and type your prompt.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_HOST` | `http://host.docker.internal:11434` | Ollama API URL |
| `STABLE_DIFFUSION_HOST` | `http://stable-diffusion:7860` | SD WebUI API URL |

## Manual Build
```bash
docker build -t ollama-chat .
docker run -p 3000:3000 --add-host=host.docker.internal:host-gateway ollama-chat
```
