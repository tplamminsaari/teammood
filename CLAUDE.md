# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Teammood** is a lightweight, no-auth browser app for project teams to share their weekly mood before sprint reviews. Key behaviors:
- Team members submit a mood rating (1–5) and a hand-drawn or uploaded 500×500px canvas image.
- Submission order determines demo order in sprint review.
- The Team view updates dynamically (real-time) as members join and as likes are given.
- Data is stored per-day; historical days can be browsed via a date picker.
- Up to 128 users; re-submitting on the same day overwrites the previous entry.
- No authentication — anyone with the URL can use it.

## Intended Directory Structure

Per the README, the project is organized as:
- `concept/` — Product requirements and initial prompts (already exists)
- `plans/` — Architecture and technical breakdown; also holds the backlog
- `mood-app/` — All application source code (frontend + backend)

## Views

1. **Welcome** — name entry or selection from previously used names; blocks duplicate active names
2. **Mood Selection** — 5 circular mood buttons + 500×500 drawing canvas (freehand, 3 brush sizes, 2 shapes, 16 colors) + image upload (PNG/JPEG); submits mood + JPEG canvas to backend then navigates to Team view
3. **Team** — shows all submitted badges for the current day with real-time updates; supports date navigation, editable sprint name, average mood, per-badge likes with animation
4. **Maintenance** (`/maintenance` or similar hidden URL) — cleanup operations (purge old moods/images/users by date) + summary stats

## Technical Notes

- Canvas images are converted to JPEG before upload.
- Team view and likes must update in real-time (WebSockets or SSE likely).
- Backend needs a database for badge data (mood rating, JPEG image, name, timestamp, likes).
- The `plans/` directory is the place to store architecture decisions and the task backlog once implementation begins.
