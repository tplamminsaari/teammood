# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Teammood** is a lightweight, no-auth browser app for project teams to share their mood before sprint reviews. Key behaviors:
- After entering a name, users land on the Team view. Submitting a mood is optional and triggered via a floating **+** button.
- Submission order determines demo order in sprint review (badge left-to-right order = demo order).
- The Team view polls for updates every 3 seconds (SWR). New badges fade in; like counts animate on change.
- Data is stored per-day; historical days can be browsed via a date picker (no future dates).
- Up to 128 users; re-submitting on the same day silently overwrites the previous entry.
- No authentication — anyone with the URL can use it.

## Directory Structure

- `concept/` — Product requirements (`revised-concept.md`) and resolved design decisions (`open-questions.md`)
- `plans/` — Architecture and implementation plan (`architecture.md`)
- `mood-app/` — Next.js application (frontend + API routes + database layer)

## Tech Stack

- **Framework**: Next.js 14 (App Router), TypeScript
- **Database**: PostgreSQL via `pg` (node-postgres), no ORM
- **Data fetching**: SWR with `refreshInterval: 3000` for real-time polling
- **Styling**: CSS Modules, light theme, accent color `#4aad58`
- **Drawing**: HTML5 Canvas API (no library)
- **Cloud hosting**: Vercel (frontend + API) + Supabase (PostgreSQL)
- **Intranet hosting**: Docker Compose (Next.js app + PostgreSQL container)

## Commands (once mood-app is initialised)

```bash
cd mood-app
npm run dev        # Start development server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint

docker-compose up --build   # Run full stack locally (app + PostgreSQL)
docker-compose down         # Stop (data is not persisted by design)
```

## Routes

| Path | View |
|------|------|
| `/` | Welcome — name input, localStorage pre-fill, name chips |
| `/team` | Team view — badge grid, date navigator, sprint name, FAB |
| `/mood` | Mood Selection — mood buttons, drawing canvas, submit |
| `/maintenance` | Maintenance — stats, cleanup operations (accessible via ⋮ menu on Welcome and Team views) |

`/team` and `/mood` redirect to `/` if no name is found in localStorage.

## Key Architecture Notes

- **Single environment variable**: `DATABASE_URL` (PostgreSQL connection string). Same build runs on Vercel and Docker.
- **DB schema auto-init**: On first DB connection, the app checks for the `users` table and runs the schema if missing — no migration tool needed.
- **Real-time via polling**: SWR polls `/api/entries?date=` every 3 seconds. Animations trigger client-side on data diff. No WebSockets or SSE needed.
- **Images stored in PostgreSQL** as base64 JPEG strings in `mood_entries.image_data`. No separate file/object storage.
- **Likes are tracked per user** in the `likes` table (one row per user+entry). The API toggles on `POST /api/likes`. The UI shows only counts, not attribution.
- **Undo in canvas**: A `useRef` stack of `ImageData` snapshots. Cleared when an image is uploaded via the upload button.

## Database Schema (summary)

```
users          id, name, name_lower (unique), last_active
mood_entries   id, user_id, entry_date, mood_rating, image_data, has_trophy, submitted_at  [UNIQUE user_id+entry_date]
likes          id, entry_id, user_id  [UNIQUE entry_id+user_id, CASCADE on entry delete]
daily_config   config_date (PK), sprint_name
```

See `plans/architecture.md` for full schema SQL and detailed API design.
