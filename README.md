# Teammood

A lightweight browser app for project teams to share their mood before sprint reviews.

## Directory Structure

- `concept/` — Product requirements and resolved design decisions
- `plans/` — Architecture and implementation plan, backlog
- `mood-app/` — Next.js application (frontend + API routes + database layer)

## Tech Stack

- **Framework**: Next.js 14 (App Router), TypeScript
- **Database**: PostgreSQL via `pg` (node-postgres), no ORM
- **Styling**: CSS Modules
- **Hosting**: Vercel (frontend + API) + Supabase (PostgreSQL), or Docker Compose (self-hosted)

---

## Development Setup

### Prerequisites

- Node.js 20+
- A PostgreSQL instance (local, Docker, or cloud — e.g. Supabase)

### 1. Install dependencies

```bash
cd mood-app
npm install
```

### 2. Configure environment

Create `mood-app/.env.local`:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>
```

For example, with a local Postgres:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/teammood
```

The database schema is created automatically on first connection — no migration step needed.

### 3. Start the dev server

```bash
cd mood-app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other commands

```bash
npm run build   # Production build
npm run lint    # ESLint
```

---

## Local Testing with Docker

### Option A — Docker Compose (app + database together)

This is the easiest way to run the full stack locally. Both the Next.js app and PostgreSQL run as services; the database connection is wired automatically.

```bash
cd mood-app
docker-compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

To stop and remove containers:

```bash
docker-compose down
```

> **Note:** Database data is not persisted across `docker-compose down` by design. To keep data between restarts, add a named volume to `docker-compose.yml`.

### Option B — Two separate Docker containers

Use this when you want to manage the app container and the database container independently.

#### Step 1 — Start the PostgreSQL container

```bash
docker run -d \
  --name teammood-db \
  -e POSTGRES_DB=teammood \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine
```

#### Step 2 — Build the app image

```bash
cd mood-app
docker build -t teammood-app .
```

#### Step 3 — Run the app container

```bash
docker run -d \
  --name teammood-app \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/teammood \
  -p 3000:3000 \
  teammood-app
```

> **`host.docker.internal`** resolves to the host machine from inside a container on Docker Desktop (Mac/Windows). On Linux, use `--add-host=host.docker.internal:host-gateway` or replace it with your host's IP address.

Alternatively, connect the two containers via a shared Docker network instead of going through the host:

```bash
docker network create teammood-net

docker run -d \
  --name teammood-db \
  --network teammood-net \
  -e POSTGRES_DB=teammood \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:16-alpine

docker run -d \
  --name teammood-app \
  --network teammood-net \
  -e DATABASE_URL=postgresql://postgres:postgres@teammood-db:5432/teammood \
  -p 3000:3000 \
  teammood-app
```

Open [http://localhost:3000](http://localhost:3000).

#### Stopping and cleaning up

```bash
docker stop teammood-app teammood-db
docker rm teammood-app teammood-db
docker network rm teammood-net   # if you created one
```
