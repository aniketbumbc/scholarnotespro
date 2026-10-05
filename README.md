# Scholar Notes Pro

Upload PDFs and YouTube videos, then chat with your sources, generate study guides, mind maps and video timelines — with answers grounded in your own material.

Live: **https://scholarnotespro.tech**

## Features

- **Sources** — upload PDFs or add YouTube videos / playlists
- **Chat** — ask questions answered from your sources (RAG over Pinecone)
- **Study guides** and **mind maps** generated from a source
- **YouTube timeline** — chaptered breakdown of a video
- Email/password auth with JWT cookies, light/dark theme

## Tech stack

| Layer | Tech |
|---|---|
| App | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| AI | OpenAI (chat + `text-embedding-3-small`), LangChain / LangGraph |
| Vector store | Pinecone |
| Database | MongoDB (Atlas) |
| File storage | Supabase Storage |
| Background jobs | BullMQ + Redis |

## Architecture

```
Browser ──► Next.js (web) ──► MongoDB / Pinecone / Supabase / OpenAI
                 │
                 └── enqueue job ──► Redis ──► ingestion worker
                                                 └─ extract → chunk → embed → Pinecone + MongoDB
```

Ingestion runs in a separate worker process (`app/src/workers/ingestion.worker.ts`) so slow PDF/transcript processing never blocks web requests. The UI polls `/api/sources/[id]/status` until a source is ready.

## Project structure

```
app/
  api/            route handlers (auth, sources, query, study-guide, mind-map, ...)
  src/
    components/   UI
    config/       mongo, pinecone, redis clients
    lib/          chunking, embedding, retrieval, storage, youtube helpers
    models/       MongoDB data access
    queue/        BullMQ queue
    workers/      ingestion worker
```

## Local development

Requirements: Node 22+, a local Redis (`brew install redis && brew services start redis`), and accounts for MongoDB Atlas, Pinecone, OpenAI and Supabase.

```bash
npm install
# create .env — see below
npm run dev            # web app → http://localhost:3000
npm run worker         # ingestion worker (separate terminal)
```

### Environment variables

| Variable | Purpose |
|---|---|
| `MONGO_URL` | MongoDB connection string |
| `REDIS_URL` | Redis URL (`redis://localhost:6379` locally) |
| `OPENAI_API_KEY` | Chat + embeddings |
| `PINECONE_API_KEY`, `PINECONE_INDEX` | Vector store (index dimension 1536) |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET` | PDF storage |
| `YOUTUBE_API_KEY`, `YOUTUBE_API_VIDEO_DETAILS_URL`, `YOUTUBE_API_PLAYLIST_ITEMS_URL` | YouTube metadata |
| `JWT_SECRET` | Signs auth cookies — use a long random value in production |

## Deployment (VPS + Docker + Caddy)

Production runs on a VPS with Docker Compose, behind a shared Caddy reverse proxy.

```
Internet ──► Caddy (shared, "web" network, HTTPS)
               └─► scholarnotes-web:3000
                      │  (default network)
                      ├─► scholarnotes-redis
                      └─  scholarnotes-worker
```

| Container | Networks | Role |
|---|---|---|
| `scholarnotes-web` | `default`, `web` | Next.js app |
| `scholarnotes-worker` | `default` | BullMQ ingestion worker (same image, runs via `tsx`) |
| `scholarnotes-redis` | `default` | Job queue, persisted to a volume |

No ports are published on the host; Caddy reaches the app over the external `web` network.

### First-time setup on the VPS

1. Point DNS A records for `scholarnotespro.tech` and `www` to the VPS IP.
2. Allow the VPS IP in MongoDB Atlas → Network Access.
3. Clone and configure:
   ```bash
   mkdir -p ~/projects && cd ~/projects
   git clone https://github.com/aniketbumbc/scholarnotespro.git
   cd scholarnotespro
   nano .env                                  # production values
   docker network create web 2>/dev/null || true
   docker compose up -d --build
   ```
4. Add the site to the Caddyfile and reload Caddy:
   ```caddy
   scholarnotespro.tech {
       encode gzip zstd
       request_body {
           max_size 50MB
       }
       reverse_proxy scholarnotes-web:3000 {
           flush_interval -1
       }
   }

   www.scholarnotespro.tech {
       redir https://scholarnotespro.tech{uri} permanent
   }
   ```

> **Note:** `next build` needs real env values because some clients are created at import time. Compose passes `.env` to the build as a BuildKit secret, so it is never stored in an image layer. `.env` must exist on the VPS before building.

### Continuous deployment

`.github/workflows/deploy.yml` deploys on every push to `main` (or manually from the Actions tab). It SSHes into the VPS, runs `git pull`, `docker compose up -d --build`, and prunes old images.

Required repository secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`.

### Operations

```bash
docker compose ps                              # status
docker compose logs -f scholarnotes-web        # app logs
docker compose logs -f scholarnotes-worker     # ingestion logs
docker compose restart scholarnotes-worker     # restart one service
```
