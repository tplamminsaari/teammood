# Teammood — Architecture & Implementation Plan

> Based on `concept/revised-concept.md` and all resolved questions in `concept/open-questions.md`.

---

## 1. Architecture Overview

Teammood is a full-stack Next.js application. The frontend and backend live in a single Next.js project — React pages for the UI, Next.js Route Handlers for the API. The database is PostgreSQL in both deployment scenarios; only the connection string changes.

```
Browser
  │
  ├── React pages (Next.js App Router)
  │     /              → Welcome view
  │     /team          → Team view
  │     /mood          → Mood Selection view
  │     /maintenance   → Maintenance view
  │
  └── API calls (fetch / SWR)
        │
        └── Next.js Route Handlers (/api/*)
              │
              └── PostgreSQL (Supabase in cloud, container in Docker)
```

There is no separate backend service. Everything runs inside the Next.js process.

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 14 (App Router) | React-based, native Vercel support, API routes included, containerises cleanly |
| Language | TypeScript | Type safety across shared DB types and API contracts |
| Database client | `pg` (node-postgres) | Lightweight, direct PostgreSQL access, no ORM overhead |
| Data fetching | SWR | Built-in polling with `refreshInterval`, pauses on hidden tabs, simple cache invalidation |
| Drawing canvas | HTML5 Canvas API | Sufficient for the required features; no library needed |
| Styling | CSS Modules | Scoped styles, no runtime overhead, easy to theme |
| DB (cloud) | Supabase PostgreSQL | Managed PostgreSQL, connects via standard `pg` connection string |
| DB (Docker) | `postgres:16-alpine` | Lightweight official image |
| Hosting (cloud) | Vercel | Zero-config Next.js deployment |
| Hosting (intranet) | Docker Compose | Single `docker-compose up` to run app + database |

**No ORM.** The data model is small and stable. Raw SQL with `pg` is simpler and more transparent for a codebase that may be maintained by different people over time.

---

## 3. Project Structure

```
teammood/
├── mood-app/                         # Next.js application root
│   ├── app/
│   │   ├── layout.tsx                # Root layout (fonts, global styles)
│   │   ├── page.tsx                  # Welcome view  (/)
│   │   ├── team/
│   │   │   └── page.tsx              # Team view  (/team)
│   │   ├── mood/
│   │   │   └── page.tsx              # Mood Selection  (/mood)
│   │   ├── maintenance/
│   │   │   └── page.tsx              # Maintenance view  (/maintenance)
│   │   └── api/
│   │       ├── users/
│   │       │   └── route.ts          # GET /api/users, POST /api/users
│   │       ├── entries/
│   │       │   ├── route.ts          # GET /api/entries?date=, POST /api/entries
│   │       │   └── [id]/
│   │       │       └── route.ts      # PUT /api/entries/:id
│   │       ├── likes/
│   │       │   └── route.ts          # POST /api/likes (toggle)
│   │       ├── config/
│   │       │   └── route.ts          # GET /api/config?date=, PUT /api/config
│   │       └── maintenance/
│   │           └── route.ts          # GET stats, DELETE operations
│   │
│   ├── components/
│   │   ├── WelcomePage/
│   │   │   ├── WelcomePage.tsx
│   │   │   ├── NameInput.tsx
│   │   │   └── WelcomePage.module.css
│   │   ├── TeamPage/
│   │   │   ├── TeamPage.tsx
│   │   │   ├── BadgeGrid.tsx
│   │   │   ├── MoodBadge.tsx
│   │   │   ├── ImageOverlay.tsx
│   │   │   ├── DateNavigator.tsx
│   │   │   └── TeamPage.module.css
│   │   ├── MoodPage/
│   │   │   ├── MoodPage.tsx
│   │   │   ├── MoodSelector.tsx
│   │   │   ├── DrawingCanvas.tsx
│   │   │   └── MoodPage.module.css
│   │   └── MaintenancePage/
│   │       ├── MaintenancePage.tsx
│   │       └── MaintenancePage.module.css
│   │
│   ├── lib/
│   │   ├── db.ts                     # PostgreSQL pool singleton
│   │   ├── types.ts                  # Shared TypeScript types
│   │   └── dateUtils.ts              # Date formatting helpers
│   │
│   ├── hooks/
│   │   ├── useTeamData.ts            # SWR hook for polling team entries
│   │   └── useCurrentUser.ts         # localStorage name management
│   │
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env.local.example
│   └── package.json
│
├── plans/
├── concept/
└── CLAUDE.md
```

---

## 4. Database Schema

```sql
-- Users registry (max 128 rows)
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  name_lower  VARCHAR(100) NOT NULL UNIQUE,  -- lowercased, used for conflict detection
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_active TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- One mood entry per user per day
CREATE TABLE mood_entries (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER      NOT NULL REFERENCES users(id),
  entry_date   DATE         NOT NULL,
  mood_rating  SMALLINT     NOT NULL CHECK (mood_rating BETWEEN 1 AND 5),
  image_data   TEXT,                          -- base64-encoded JPEG; NULL if no image submitted
  submitted_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entry_date)
);

-- One like per user per entry (toggle)
CREATE TABLE likes (
  id         SERIAL PRIMARY KEY,
  entry_id   INTEGER     NOT NULL REFERENCES mood_entries(id) ON DELETE CASCADE,
  user_id    INTEGER     NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entry_id, user_id)
);

-- Sprint name stored per calendar day
CREATE TABLE daily_config (
  config_date  DATE         PRIMARY KEY,
  sprint_name  VARCHAR(200) NOT NULL DEFAULT ''
);
```

**Notes:**
- `name_lower` is populated on insert as `LOWER(name)`. Used for case-insensitive uniqueness checks without a function index.
- `image_data` is `TEXT` (base64 JPEG). A 500×500 JPEG at medium quality is roughly 20–80 KB, which is fine for PostgreSQL text storage at the expected data volumes (biweekly sprints, ~20 users).
- `UNIQUE(user_id, entry_date)` on `mood_entries` enforces one entry per user per day at the DB level. The API uses `INSERT ... ON CONFLICT DO UPDATE` (upsert) for re-submissions.
- Deleting a `mood_entry` cascades to its `likes`.

---

## 5. API Design

All endpoints return JSON. Error responses follow `{ error: string }`.

### Users
```
GET  /api/users
     Response: { users: [ { id, name, lastActive } ] }
     Returns all users ordered by last_active DESC (for name chips on Welcome view)

POST /api/users
     Body:    { name: string }
     Action:  INSERT user if new (check 128-user limit); UPDATE last_active if existing
     Response: { user: { id, name } }
```

### Entries
```
GET  /api/entries?date=YYYY-MM-DD
     Response: { entries: [ { id, userId, userName, moodRating, imageData, submittedAt, likeCount, likedByMe } ] }
     likedByMe requires ?userId=N query param

POST /api/entries
     Body:    { userId, moodRating, imageData }  (imageData is base64 JPEG string)
     Action:  Upsert — INSERT or UPDATE for today's entry for this user
     Response: { entry: { id, submittedAt } }
```

### Likes
```
POST /api/likes
     Body:    { entryId, userId }
     Action:  If like exists → DELETE it (unlike). If not → INSERT (like).
     Response: { liked: boolean, likeCount: number }
```

### Config
```
GET  /api/config?date=YYYY-MM-DD
     Response: { sprintName: string }

PUT  /api/config
     Body:    { date, sprintName }
     Action:  Upsert daily_config row
     Response: { sprintName: string }
```

### Maintenance
```
GET    /api/maintenance
       Response: { userCount, entryCount, daysWithEntries, imageDataCount }

DELETE /api/maintenance?op=reset-today
       Action:  Delete all mood_entries WHERE entry_date = TODAY

DELETE /api/maintenance?op=entries&before=YYYY-MM-DD
       Action:  Delete mood_entries WHERE entry_date < before

DELETE /api/maintenance?op=images&before=YYYY-MM-DD
       Action:  SET image_data = NULL WHERE entry_date < before (keeps entry record)

DELETE /api/maintenance?op=users&inactiveSince=YYYY-MM-DD
       Action:  Delete users WHERE last_active < inactiveSince (entries remain, user FK becomes orphan — use SET NULL or keep user rows and just flag them)
```

---

## 6. Real-time Strategy

**Approach: SWR polling at 3-second intervals.**

The Team view uses SWR's `refreshInterval: 3000` to re-fetch entries and like counts. This works identically on Vercel (serverless) and Docker (persistent Node.js process) with no additional infrastructure.

For 20 concurrent users polling every 3 seconds, that is ~7 requests/second — negligible load.

**Why not SSE or WebSockets:**
- Vercel's serverless functions don't support persistent connections across function instances. Shared in-memory state (required to broadcast to all connected SSE clients) is not possible without an external pub/sub service.
- WebSockets require a persistent server process — incompatible with Vercel's serverless model.
- For 20 users and 3-second latency tolerance, polling is indistinguishable from true push for this use case.

**Animation trigger:**
- The `useTeamData` hook compares previous and next poll results.
- New entries (present in new poll, absent in previous) trigger a fade-in CSS animation.
- Entries with an increased `likeCount` trigger the like burst animation.
- These comparisons happen entirely on the client; no server-side event system is needed.

**Sprint name and config** are polled separately at a slower interval (10 seconds) since they change rarely.

---

## 7. Frontend Architecture

### Routing & Navigation

```
/           Welcome view      Always accessible
/team       Team view         Requires name in localStorage; redirects to / if missing
/mood       Mood Selection    Requires name in localStorage; redirects to / if missing
/maintenance Maintenance view  No access control
```

Navigation is handled with `next/navigation` (`useRouter`, `redirect`). There is no auth middleware — the localStorage check is a client-side guard.

### State Management

No global state library needed. State is kept close to where it's used:

- **User identity**: `useCurrentUser` hook reads/writes `localStorage`. Exposed as `{ name, userId, setUser, clearUser }`.
- **Team data**: `useTeamData(date)` hook wraps SWR polling. Returns entries, loading state, and a manual mutate function for optimistic like updates.
- **Canvas state**: Local React state inside `DrawingCanvas` component. Undo history is a `useRef` stack of ImageData snapshots.

### Drawing Canvas

Implemented with the HTML5 Canvas API directly — no library.

Key implementation points:
- Canvas ref holds the 2D context.
- `mousedown` / `mousemove` / `mouseup` events draw strokes.
- Undo stack: push a copy of the canvas ImageData before each stroke begins (`mousedown`). `Ctrl+Z` pops the stack and restores via `putImageData`.
- Image upload: use `drawImage` on a loaded `Image` object, scaled and center-cropped to 500×500. This clears the undo stack.
- On submit: `canvas.toDataURL('image/jpeg', 0.85)` exports the base64 JPEG string.

### Optimistic Updates for Likes

When a user presses the heart icon:
1. Immediately update the local SWR cache (optimistic).
2. Fire `POST /api/likes`.
3. If the request fails, revert the optimistic update.
4. Next poll confirms the true server state.

---

## 8. Deployment

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

This is the only required environment variable. The same Next.js build runs in both environments.

### Cloud — Vercel + Supabase

1. Create a Supabase project → copy the connection string → set as `DATABASE_URL` in Vercel environment variables.
2. Run the schema SQL against the Supabase database (via Supabase SQL editor or `psql`).
3. Connect the GitHub repo to Vercel → deploys on every push to `main`.

No additional configuration needed — Next.js is Vercel's native framework.

### Intranet — Docker Compose

`docker-compose.yml` in `mood-app/`:

```
services:
  app:
    build: .
    ports: 3000:3000
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/teammood
    depends_on: [db]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: teammood
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    # No named volume → data does not persist across container restarts (by design)
```

`Dockerfile` in `mood-app/`:

```
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**First-run DB init:** On first startup, the app should run schema migrations automatically (or a separate init script). A simple approach: check if the `users` table exists on startup and run the schema SQL if it does not. This avoids needing a migration framework.

**To run:** `docker-compose up --build` — that's it.

**To reset today's data:** Use the Maintenance view or `docker-compose down && docker-compose up` (wipes entire DB).

---

## 9. Implementation Phases

### Phase 1 — Project foundation
- Initialise Next.js 14 project with TypeScript and CSS Modules in `mood-app/`
- Set up `lib/db.ts` (pool singleton, auto-init schema on first connection)
- Write and test DB schema
- Set up `docker-compose.yml` and `Dockerfile`
- Verify: `docker-compose up` starts app and DB; DB schema is created automatically

### Phase 2 — Users API + Welcome view
- `GET/POST /api/users`
- Welcome page: name input, localStorage pre-fill, name chips from API, Join button
- `useCurrentUser` hook
- Verify: entering a name saves to localStorage and creates/updates user in DB

### Phase 3 — Team view skeleton + polling
- `GET /api/entries?date=` and `GET /api/config?date=`
- Team page: header bar (date navigator, sprint name, average mood), badge grid, empty state, FAB
- `useTeamData` hook with 3-second SWR polling
- DateNavigator component (date picker, no future dates, resets to today on future selection)
- Sprint name inline edit (read-only on past dates)
- Verify: navigating to /team shows today's empty state; changing date works

### Phase 4 — Mood submission
- `POST /api/entries` (upsert)
- Mood Selection page: mood buttons (1–5 with emojis), canvas, drawing toolbar, upload, undo, submit
- `DrawingCanvas` component: freehand drawing, brush size/shape, colour palette, clear, undo (Ctrl+Z), image upload (resets undo)
- On Continue: export canvas as JPEG base64, POST to API, navigate to /team
- On return to /mood when already submitted: pre-load previous mood and image, show "Already submitted today at HH:MM"
- Verify: submit a mood → badge appears on team view within 3 seconds

### Phase 5 — Mood badges + image overlay
- `MoodBadge` component: image, name, mood rating (number + emoji), like section
- Badge fade-in animation on new entry detection
- `ImageOverlay` component: full 500×500 image, close button / click-outside to close
- Verify: badges display correctly; clicking image opens overlay

### Phase 6 — Likes
- `POST /api/likes`
- Like toggle on badge (hollow/filled heart, like count)
- Like count change animation
- Optimistic update in SWR cache
- Likes disabled on past dates
- Verify: like/unlike updates count; animation plays on change

### Phase 7 — Maintenance view
- `GET /api/maintenance` (stats)
- `DELETE /api/maintenance` (reset today, purge entries, purge images, purge inactive users)
- Maintenance page: stats summary, 4 cleanup actions each with dry-run count + confirmation
- Verify: reset today wipes entries and they disappear from team view

### Phase 8 — Polish & deployment
- Visual styling (light theme, `#4aad58` accent, mood scale colours)
- FAB hidden on past dates
- Sprint name read-only on past dates
- Responsive layout check at 1600×1080
- Vercel deployment setup
- `.env.local.example` documentation
- Verify full user journey end-to-end in both Docker and Vercel

---

## 10. Key Decisions & Rationale

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js App Router | Single codebase for frontend + API; native Vercel deployment; standard containerisation for Docker |
| Real-time | SWR polling (3s) | Works on Vercel (serverless) and Docker identically; zero infrastructure; imperceptible latency for this use case |
| Image storage | PostgreSQL TEXT (base64) | No extra service; works everywhere; data volume is small (biweekly use) |
| ORM | None (raw `pg`) | Schema is small and stable; raw SQL is transparent and easy to hand off |
| State management | SWR + local hooks | No global store needed; data lives close to the components that use it |
| Auth | None | Internal tool; name + localStorage is sufficient |
| Drawing | HTML5 Canvas (no library) | The required feature set (freehand, brush, colour, undo, upload) is achievable without a dependency |
| Docker data persistence | None (by design) | Data loss on restart is acceptable; simplifies Docker setup; Maintenance view handles cleanup anyway |
