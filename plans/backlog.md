# Teammood — Implementation Backlog

Status values: `todo` · `in progress` · `done`

Reference documents:
- Product concept: `concept/revised-concept.md`
- Architecture: `plans/architecture.md`

---

## Phase 1 — Project Foundation

### T01 · Initialise Next.js project
**Status:** `done`
**Description:** Create the Next.js 14 app with TypeScript and CSS Modules inside the `mood-app/` directory.
**Produces:** `mood-app/` with working `npm run dev`, base `app/layout.tsx`, global CSS with light theme and `#4aad58` accent colour variable, `.env.local.example` with `DATABASE_URL`.

### T02 · Database schema and connection layer
**Status:** `done`
**Description:** Write the PostgreSQL schema (4 tables) and the `lib/db.ts` pool singleton. On first connection, auto-run the schema if the `users` table does not exist.
**Requires:** T01
**Produces:** `lib/db.ts`, `lib/schema.sql`, schema auto-init logic.

### T03 · Docker Compose setup
**Status:** `done`
**Description:** Write `Dockerfile` and `docker-compose.yml` that run the Next.js app and a PostgreSQL container together. No named volume (data loss on restart is intentional).
**Requires:** T01
**Produces:** `mood-app/Dockerfile`, `mood-app/docker-compose.yml`. Verified with `docker-compose up --build`.

---

## Phase 2 — Users API & Welcome View

### T04 · Users API
**Status:** `done`
**Description:** Implement `GET /api/users` (list all, ordered by last_active) and `POST /api/users` (create or update last_active; enforce 128-user limit).
**Requires:** T02
**Produces:** `app/api/users/route.ts`

### T05 · useCurrentUser hook
**Status:** `done`
**Description:** React hook that reads/writes the current user's `{ name, userId }` to `localStorage`. Exposes `setUser(name, id)` and `clearUser()`. Used by all views to identify the current user.
**Requires:** T01
**Produces:** `hooks/useCurrentUser.ts`

### T06 · Welcome view
**Status:** `done`
**Description:** Build the `/` page. Name text input pre-filled from localStorage. Quick-select name chips fetched from `GET /api/users`. Join button calls `POST /api/users`, saves result via `useCurrentUser`, navigates to `/team`. ⋮ menu button (top-right) with a "Maintenance" item that navigates to `/maintenance`.
**Requires:** T04, T05
**Produces:** `app/page.tsx`, `components/WelcomePage/` (WelcomePage.tsx, NameInput.tsx, CSS)

---

## Phase 3 — Team View Skeleton & Polling

### T07 · Entries and config API (read)
**Status:** `done`
**Description:** Implement `GET /api/entries?date=YYYY-MM-DD&userId=N` (returns entries with likeCount and likedByMe) and `GET /api/config?date=YYYY-MM-DD` (returns sprint name).
**Requires:** T02
**Produces:** `app/api/entries/route.ts`, `app/api/config/route.ts`

### T08 · useTeamData hook
**Status:** `done`
**Description:** SWR hook that polls `GET /api/entries` and `GET /api/config` for a given date. Entries poll every 3 seconds; config every 10 seconds. Detects newly arrived entries (for fade-in) and entries with increased likeCount (for like animation) by diffing previous and next results.
**Requires:** T07
**Produces:** `hooks/useTeamData.ts`

### T09 · Team view layout and date navigator
**Status:** `done`
**Description:** Build the `/team` page shell. Header bar with: app name, date display + date picker (no future dates; selecting future resets to today), sprint name field (editable today, read-only on past dates), average mood display, ⋮ menu button (top-right) with a "Maintenance" item that navigates to `/maintenance`. Badge grid area (placeholder). Empty state. FAB (`+` button, hidden on past dates). Redirects to `/` if no user in localStorage.
**Requires:** T08
**Produces:** `app/team/page.tsx`, `components/TeamPage/TeamPage.tsx`, `components/TeamPage/DateNavigator.tsx`, CSS

### T10 · Sprint name update API and inline edit
**Status:** `done`
**Description:** Implement `PUT /api/config` (upsert sprint name for date). Wire up the sprint name field on the Team view: blur saves, Escape reverts, disabled on past dates.
**Requires:** T09
**Produces:** `PUT` handler in `app/api/config/route.ts`, sprint name edit behaviour in `TeamPage`

---

## Phase 4 — Mood Submission

### T11 · Entries submit API
**Status:** `done`
**Description:** Implement `POST /api/entries` — upserts a mood entry for today (INSERT ... ON CONFLICT DO UPDATE). Accepts `{ userId, moodRating, imageData, hasTrophy }`. Returns the entry id and submitted_at timestamp.
**Requires:** T02
**Produces:** `POST` handler in `app/api/entries/route.ts`

### T12 · Mood selector component
**Status:** `done`
**Description:** 5 circular buttons in a row. Each shows emoji + number: 1 😠 · 2 😕 · 3 😐 · 4 🙂 · 5 😄. Selected state is visually distinct (filled, accent colour). Clicking selects/deselects.
**Requires:** T01
**Produces:** `components/MoodPage/MoodSelector.tsx` + CSS

### T13 · Drawing canvas — core drawing
**Status:** `done`
**Description:** 500×500 HTML5 Canvas. Freehand drawing on mousedown+mousemove. Toolbar: 3 brush sizes (10/20/40px), 2 shapes (round/square), 16-colour palette (black, white, mid-grey, light-grey, red, dark-red, orange, yellow, lime-green, forest-green, sky-blue, navy, purple, pink, brown, beige), Clear button. Default: medium brush, round, black.
**Requires:** T01
**Produces:** `components/MoodPage/DrawingCanvas.tsx` + CSS

### T14 · Drawing canvas — undo and image upload
**Status:** `done`
**Description:** Add Ctrl+Z undo (useRef stack of ImageData snapshots captured on mousedown). Add "Upload from device" button: opens file picker (PNG/JPEG), loads image onto canvas scaled+center-cropped to 500×500, clears undo history.
**Requires:** T13
**Produces:** Additions to `DrawingCanvas.tsx`

### T15 · Mood Selection view and submit flow
**Status:** `done`
**Description:** Build the `/mood` page. Shows "Hi [Name]!" label, MoodSelector, DrawingCanvas, "I have the trophy" checkbox (unchecked by default), Cancel (→ /team) and Continue (enabled only when mood selected) buttons. On Continue: export canvas as JPEG base64 via `toDataURL('image/jpeg', 0.85)`, POST `{ userId, moodRating, imageData, hasTrophy }` to `/api/entries`, navigate to `/team`. Redirects to `/` if no user in localStorage.
**Requires:** T11, T12, T14
**Produces:** `app/mood/page.tsx`, `components/MoodPage/MoodPage.tsx` + CSS

### T16 · Pre-load existing submission in Mood Selection
**Status:** `done`
**Description:** When opening `/mood` and the user has already submitted today, fetch their existing entry and pre-populate the mood selector, canvas image, and trophy checkbox. Show "Already submitted today at HH:MM" label. Pressing Continue overwrites silently.
**Requires:** T15
**Produces:** Addition to `app/mood/page.tsx` / `MoodPage.tsx`

---

## Phase 5 — Mood Badges & Image Overlay

### T17 · MoodBadge component
**Status:** `done`
**Description:** Fixed 160×200px card. Shows: mood image (or white square if none), name, mood rating with emoji (e.g. "3 😐"), like section (hollow/filled heart + count). The image area has two corner overlays: like section bottom-left, 🏆 emoji bottom-right (only when `hasTrophy` is true). Heart is non-interactive on past dates. Clicking the image area opens the overlay.
**Requires:** T01
**Produces:** `components/TeamPage/MoodBadge.tsx` + CSS

### T18 · Badge grid and fade-in animation
**Status:** `done`
**Description:** Render the list of MoodBadges in the Team view using data from `useTeamData`. New badges (detected by diffing entry ids against previous poll) fade in with a CSS animation. Badges are ordered by `submitted_at` and never reorder.
**Requires:** T17, T08
**Produces:** `components/TeamPage/BadgeGrid.tsx` + CSS animation

### T19 · Image overlay
**Status:** `done`
**Description:** Clicking a badge image opens a full-size 500×500 overlay showing the image and the user's name. Closed by a top-right close button or clicking outside the image.
**Requires:** T17
**Produces:** `components/TeamPage/ImageOverlay.tsx` + CSS

---

## Phase 6 — Likes

### T20 · Likes API
**Status:** `done`
**Description:** `POST /api/likes` with body `{ entryId, userId }`. If the like exists → DELETE (unlike); if not → INSERT (like). Returns `{ liked: boolean, likeCount: number }`.
**Requires:** T02
**Produces:** `app/api/likes/route.ts`

### T21 · Like toggle and animation
**Status:** `done`
**Description:** Wire the heart button on MoodBadge to `POST /api/likes`. Optimistically update the SWR cache (flip liked state, adjust count) before the request completes; revert on error. Entries with an increased likeCount (detected in `useTeamData`) trigger a brief bounce/burst CSS animation on the heart icon.
**Requires:** T20, T17, T18
**Produces:** Like interaction logic in `MoodBadge.tsx` + CSS animation

---

## Phase 7 — Maintenance View

### T22 · Maintenance API
**Status:** `done`
**Description:** `GET /api/maintenance` returns `{ userCount, entryCount, daysWithEntries, imageDataCount }`. `DELETE /api/maintenance?op=reset-today|entries&before=|images&before=|users&inactiveSince=` performs the corresponding cleanup. Each delete returns `{ deletedCount: number }` (used for dry-run preview).
**Requires:** T02
**Produces:** `app/api/maintenance/route.ts`

### T23 · Maintenance view
**Status:** `done`
**Description:** Build the `/maintenance` page. Accessible via the ⋮ menu on Welcome and Team views (or directly via URL). Stats summary at top. Four cleanup actions, each with: a date input (where applicable), a "Preview" button (calls API and shows count without deleting), and a "Confirm" button that performs the deletion and refreshes stats. Reset Today has no date input — just Preview + Confirm.
**Requires:** T22
**Produces:** `app/maintenance/page.tsx`, `components/MaintenancePage/` + CSS

---

## Phase 8 — Polish & Deployment

### T24 · Visual polish
**Status:** `done`
**Description:** Apply consistent light theme across all views. Accent colour `#4aad58` on primary buttons (Join, Continue, FAB), active mood button, filled heart. Mood scale colours on buttons (red for 1 → green for 5). Check layout at 1600×1080. Ensure badge grid looks good at 20 badges.
**Requires:** All UI tasks
**Produces:** Updated CSS across all components

### T25 · Route guards and edge cases
**Status:** `done`
**Description:** Ensure `/team` and `/mood` redirect to `/` when no user is in localStorage. FAB is hidden when a past date is selected. Sprint name field is read-only on past dates. Date picker prevents future date selection (resets to today). Heart button is non-interactive on past dates.
**Requires:** T09, T15, T21
**Produces:** Guard logic additions across Team and Mood pages

### T26 · Vercel deployment
**Status:** `done`
**Description:** Connect repo to Vercel. Set `DATABASE_URL` pointing to Supabase PostgreSQL. Run schema SQL against Supabase via the Supabase SQL editor. Verify full end-to-end user journey on the deployed URL.
**Requires:** All tasks
**Produces:** Live Vercel deployment

### T27 · Update README.md
**Status:** `done`
**Description:** Rewrite `README.md` to document the application — what it is, how to run it locally with Docker, how to deploy to Vercel + Supabase, and the environment variable required. Should be clear enough for a new team member to get it running without reading the concept or plans documents.
**Requires:** T03, T26
**Produces:** Updated `README.md`

---

## Finetuning

### T28 · Continuous brush strokes on canvas
**Status:** `done`
**Description:** Fast mouse movement produces dotted/gapped lines because the canvas only stamps the brush at individual mouse event positions. Fix by interpolating intermediate stamps along the straight-line segment between the previous and current mouse position on every `mousemove` event. Stamp spacing should be small enough (~1px step) to guarantee no visible gaps at any brush size or mouse speed.
**Produces:** Updated `DrawingCanvas.tsx`
