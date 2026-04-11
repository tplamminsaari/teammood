# Teammood — Revised Product Concept

> Revised from `initial-concept.md`. Combines Product Owner and UX analysis.
> Open questions are tracked in `open-questions.md`.

---

## Product Vision

Teammood is a frictionless, internal-network web app that helps a Scrum team warm up before their sprint review. It gives every team member a small moment of self-expression — pick a mood, draw something — and naturally produces the order in which people demo their work. The social element (likes, seeing everyone's faces/drawings) builds psychological safety and energy before the meeting starts.

**Core value proposition:**
- Zero barrier to entry (no accounts, no passwords)
- Playful and personal (custom drawings)
- Structurally useful (submission order = demo order)
- Real-time and social (live updates, likes)

---

## Design Principles

1. **Lightweight first.** The whole interaction should take under 60 seconds for a returning user.
2. **Desktop-primary, mobile-aware.** Primary use is on a laptop/desktop before or during a meeting. Mobile is a secondary concern; the drawing canvas may not work well on touchscreens without specific optimization.
3. **Trust over security.** No authentication. The app trusts that users are who they say they are. This is an internal team tool.
4. **Visible progress.** The Team view is typically projected on a shared screen, so it needs to look good at a distance and communicate state clearly without verbal explanation.

---

## Visual Style

- **Theme:** Light. White or very light grey backgrounds. No dark mode.
- **Accent color:** Light green `#4aad58`. Used for primary buttons (Join, Continue, FAB), active/selected states, and highlights.
- **Mood scale colors** should complement the light theme — the accent green can represent mood 5, with the scale shifting toward reds/oranges at the low end.

---

## Users

**Team Member** — the primary user. Joins before or during sprint review, lands on Team view immediately after entering their name. May give likes to colleagues' badges regardless of whether they have submitted their own mood.

**Facilitator** — typically the Scrum Master. May manage the sprint name, monitor who has submitted, and navigate to past dates for retrospective purposes. Uses the same interface as a team member; no special role.

**Maintainer** — anyone who knows the `/maintenance` URL. Performs occasional cleanup. Not a regular user.

---

## User Flows

### First-time team member
1. Receives the app URL from a colleague.
2. Opens the app → Welcome view appears.
3. Types their name → clicks **Join** → lands on Team view.
4. Watches the Team view. When ready to submit, presses the **+** button (bottom-right corner).
5. Selects a mood and optionally draws something → clicks **Continue** → returns to Team view with their badge now visible.

### Returning team member (same device/browser)
1. Opens the app → Welcome view appears with name pre-filled from localStorage.
2. Confirms name and clicks **Join** → lands on Team view.
3. If they have **not yet submitted today**: the **+** button is prominent, inviting them to submit.
4. If they have **already submitted today**: their badge is visible in the grid. They can still press **+** to open Mood Selection and update their submission.

### Facilitator tasks
- Edit sprint name inline on Team view.
- Navigate to a past date to review that day's badges.
- The demo order is implicit from the left-to-right, top-to-bottom badge layout; no manual reordering.

---

## View Specifications

### 1. Welcome View

**Purpose:** Identity entry point. Minimal friction.

**Elements:**
- App name / logo (small, top area)
- Heading: something like "What's your mood today?"
- Text input for name
- A "previously used names" section below the input showing names from the system (quick-tap chips or a small list)
- **Join** button (primary action)

**Behavior:**
- On load, the name field is pre-filled from `localStorage` if a previously used name is found on this device/browser. The field is editable so the user can change it.
- Previously used names are also fetched from the server and shown as quick-select chips below the input. Clicking a chip overwrites the field value; the user still presses **Join**.
- The list shows all stored names, up to a reasonable display limit (e.g. 20 most recently active).
- When the user presses **Join**, their name is saved to `localStorage` and the app navigates to Mood Selection — always, with no warnings or conflict prompts.
- Names are case-insensitive (`Alice` and `alice` are treated as the same person).
- Max 128 registered users total. If the limit is reached, new unknown names are rejected with a friendly message to contact the maintainer.

**UX notes:**
- If a name was pre-filled from localStorage, the cursor should be placed at the end of the field so the user can immediately edit or press Join.
- Previously used names chips should be visually distinct from the input to avoid confusion.
- Keep the view vertically compact; it should feel like a fast doorstep, not a form.

---

### 2. Mood Selection View

**Purpose:** Express mood + personal touch. Should be fun, not clinical.

**Elements (top to bottom):**
- Brief contextual label: "Hi [Name]! How are you feeling today?"
- **Mood selector:** 5 large circular buttons in a horizontal row. Each shows an emoji and a number: 1 😠 · 2 😕 · 3 😐 · 4 🙂 · 5 😄. The scale intentionally uses angry rather than sad at the low end, reflecting that low moods in a team context are typically frustration-driven. Selected state is visually prominent (filled, colored).
- **Canvas area:** 500×500px drawing surface with a visible border. Below the mood selector.
- **Drawing toolbar** (positioned above or beside the canvas):
  - Brush size: 3 options (Small 10px / Medium 20px / Large 40px) — shown as sample dots
  - Brush shape: Round / Square toggle
  - Color palette: 16 colors in a grid. Suggested palette: black, white, mid-grey, light-grey, red, dark-red, orange, yellow, lime-green, forest-green, sky-blue, navy, purple, pink, brown, beige.
  - **Clear canvas** button (resets to white)
- **Upload from device** button — opens file picker, accepts PNG and JPEG. Loaded image is resized and center-cropped to fill the 500×500 canvas. User can then draw over it. Uploading resets the undo history.
- **Undo** (Ctrl+Z) — steps back through drawing actions. History is cleared on image upload or clear canvas.
- **"I have the trophy" checkbox** — self-reported. When checked, a 🏆 emoji is shown on the user's badge in the Team view. Unchecked by default.
- **Cancel** button (secondary, left) — returns to Team view, no data saved
- **Continue** button (primary, right) — enabled only when a mood (1–5) is selected; canvas drawing is optional (a blank/white image is valid)

**Behavior:**
- On load, the app checks whether the current user (name from localStorage) has already submitted today.
  - If **yes**: the previously selected mood is pre-selected, the previously submitted image is loaded onto the canvas, and the trophy checkbox reflects the previous value. A label is shown near the top of the view: "Already submitted today at [HH:MM]". The user can modify any field and press **Continue** again to overwrite silently.
  - If **no**: the view starts empty (no mood selected, blank canvas, trophy unchecked).
- Mood must be selected before **Continue** is enabled. The canvas and trophy checkbox are optional.
- On **Continue**: canvas content is exported as JPEG, bundled with the selected mood, trophy flag, and user name, and submitted to the backend. On success, navigate to Team view.
- If submission fails: show an inline error and stay on this view; do not lose the canvas content or mood selection.

**UX notes:**
- The mood buttons should be large enough to be satisfying to press (min ~60px diameter).
- The emoji set makes the scale's direction self-evident. A color accent per mood level can reinforce it (e.g. red for 1, orange for 2, grey for 3, light-green for 4, green for 5).
- The upload flow must be fast: select file → image appears on canvas → no intermediate confirmation screen.
- Drawing tools should default to: medium brush, round, black color.
- On smaller screens, the canvas and toolbar may need to scroll; this view is not expected to fit a phone screen without scrolling.

---

### 3. Team View

**Purpose:** Social dashboard. Shows everyone's mood. Typically projected during sprint review. Real-time.

**Elements:**
- **Header bar:**
  - App name (small)
  - Displayed date (shows today by default). Editable: clicking/tapping the date opens a date picker. Future dates are not selectable — selecting one resets to today. A **Go to date** button confirms navigation.
  - Sprint name field. Stored per day — each day starts empty. When viewing today: inline editable, changes saved immediately and synced to all connected users in real-time. When viewing a past date: shown as read-only text. Intended as a bonus display feature on sprint review days.
  - Average mood indicator (e.g. "Team mood: 3.8 ★" or a visual bar). Updates live as new submissions arrive.
- **Badge grid:** Left-to-right, top-to-bottom layout. Submission order = badge order = demo order.
- **Empty state:** When no submissions exist for the selected date: "No moods submitted for this day."
- **Floating action button (FAB):** A large **+** button fixed to the bottom-right corner. Only visible when today's date is selected. Pressing it navigates to Mood Selection. Hidden when browsing a past date.

**Mood Badge (per person):**
- Size: fixed at approximately 160px wide × 200px tall. No dynamic resizing — the view scrolls vertically if badges overflow the viewport.
- Contents (top to bottom):
  - Mood image (square, fills most of the badge width). The image area has two corner overlays:
    - Bottom-left: like section (heart icon + count)
    - Bottom-right: 🏆 trophy emoji, shown only if the user checked "I have the trophy"
  - Name (truncated if long)
  - Mood rating: number + emoji (e.g. "3 😐")
  - Like section: heart icon + like count. The heart is hollow when the current user has not liked this badge, and filled when they have. Tapping toggles between liked and unliked. Only the total count is shown — who liked whom is not displayed.
- **Click/tap on badge** → opens the image in a full-size overlay (500×500px). Overlay has a close button (top-right corner, or click outside to close).
- Like animation: a brief burst/bounce animation plays on the badge when a new like is received, visible to all viewers in real-time.

**Behavior:**
- New badges fade in when a team member submits. No audio or other notification.
- Sprint name edits are debounced and synced to all connected clients.
- Date navigation loads the static data for that day. Past days are fully read-only — likes and sprint name editing are disabled. The heart icon is not interactive when viewing history.

**UX notes:**
- Target display is 1600×1080. At ~160px badge width with gutters, roughly 8–9 badges fit per row. A full team of ~20 people fits in 2–3 rows, likely without needing to scroll.
- Badge order must be stable — badges do not shift position when new ones arrive (new badges append at the end).
- The projected-screen use case means the view should be readable at ~2m distance: large enough images, high-contrast text.
- Sprint name edit: clicking elsewhere (blur) saves the value. Pressing Escape reverts to the previous value.

---

### 4. Maintenance View

**Purpose:** Housekeeping for the maintainer. Minimal, functional, hidden.

**Access:** Via a known URL path (e.g. `/maintenance`). No authentication; security by obscurity.

**Summary section:**
- Total registered users
- Total mood entries (all time)
- Total days with at least one entry
- Storage estimate for image data (nice to have)

**Cleanup operations** (each is a separate action with confirmation):
1. **Reset today** — wipes all mood entries for the current day; useful if a session needs to be restarted from scratch.
2. **Remove mood entries older than [date]** — deletes mood records (but not users)
3. **Remove image data older than [date]** — deletes stored images but keeps the mood rating and name in the record
4. **Remove users not active since [date]** — removes users from the name registry; their historical mood entries remain (names become "orphaned" entries)

**UX notes:**
- Each cleanup action should have a visible confirmation step ("This will delete X records. Are you sure?") to prevent accidents.
- Show a dry-run count before the destructive action ("Found 47 entries before 2025-01-01").
- After each action, update the summary section to reflect the new state.

---

## Business Rules Summary

| Rule | Detail |
|------|--------|
| Name uniqueness | Per-day only. Historical names are reusable. Case-insensitive. |
| Max users | 128 total registered users. |
| Re-submission | Allowed on same day; overwrites previous entry with confirmation. |
| Demo order | Defined by submission timestamp; displayed as badge left-to-right order. Cannot be manually changed. |
| Canvas | Optional. Blank white canvas is a valid submission. |
| Image format | Stored as JPEG. User can upload PNG or JPEG; both are converted/stored as JPEG. |
| Past day data | Read-only. Date picker can navigate to any past date. |
| Sprint name | One per day. Editable by anyone. Persists until changed. |
| Likes | Real-time. Toggle (like/unlike). *See open questions for details.* |

---

## Out of Scope (for initial version)

- Authentication or role-based access
- Multiple teams or namespaces
- Email or push notifications
- Exporting mood data (charts, CSVs)
- Mobile-optimized drawing (touch/stylus support)
- Internationalization / localization
- Dark mode
- Accessibility audit (WCAG compliance)
