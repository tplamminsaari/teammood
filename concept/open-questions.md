# Teammood — Open Questions

Use this file to track questions that need answers before or during the architecture/planning phase.
Mark items `[x]` when resolved and add the decision below the question.

---

## Critical — answers needed before implementation planning

**[x] Q1. Session persistence after Welcome view**
**Decision:** Use browser `localStorage`. When the user successfully joins, their name is saved to localStorage. On subsequent visits, the name field on the Welcome view is pre-filled with the stored name. The Welcome view is always shown (not skipped) — the pre-fill just removes the need to retype.

**[x] Q2. "Name in use" — returning user flow**
**Decision:** No warnings or conflict prompts. Pressing **Join** always navigates to Mood Selection. If the user has already submitted today, their previous mood and canvas image are pre-loaded into the view, and a label "Already submitted today at [HH:MM]" is shown. Pressing **Continue** silently overwrites the previous submission.

**[x] Q3. Viewer access (non-submitting)**
**Decision (revised):** Users land on the Team view immediately after entering their name on the Welcome view. Submitting a mood is optional and triggered via a floating **+** button (FAB) in the bottom-right corner of the Team view. Flow: Welcome → Team view → (optional) Mood Selection → Team view.

**[x] Q4. Like attribution**
**Decision:** Likes are anonymous — only the total count is shown, not who liked what. However, the backend tracks which user liked which badge to support the toggle. Each user can like a badge once; pressing the heart again unlikes it. The heart icon reflects the current user's state: hollow = not liked, filled = liked. Liking does not require having submitted a mood — any named user can like.

**[x] Q5. Likes on historical entries**
**Decision:** Likes can only be given on the current day's entries. Past days are read-only — no liking, no sprint name editing.

---

## Important — answers improve the design but can be decided later

**[x] Q6. Canvas state persistence**
**Decision:** Covered by Q2 resolution. If the user has already submitted, their image is reloaded from the server. Mid-drawing drafts (before first submit) are not persisted — an accidental refresh before first submit loses the in-progress drawing. Acceptable given the lightweight nature of the app.

**[x] Q7. Sprint name scope**
**Decision:** The sprint name is stored per day. It is a lightweight bonus feature — on sprint review day the team can type the sprint name so it appears on the shared screen. No date ranges, no automatic propagation between days. Each day starts with an empty sprint name field.

**[x] Q8. Badge sizing**
**Decision:** Team size is ~20 people. Target resolution is 1600×1080. Badges are fixed size (no dynamic resizing). The view can scroll vertically if needed. At ~160px wide per badge with gutters, roughly 8–9 badges fit per row, giving 2–3 rows for a full team — likely fitting on one screen without scrolling in most cases.

**[x] Q9. Mood scale representation**
**Decision:** Numbers + emojis. The scale reflects frustration at the low end rather than sadness. Agreed emoji set:
- 1 → 😠 Angry
- 2 → 😕 Unhappy
- 3 → 😐 Neutral
- 4 → 🙂 Happy
- 5 → 😄 Enthusiastic

Used on both the Mood Selection buttons and the badge display.

**[x] Q10. Empty canvas policy**
**Decision:** A blank white canvas is submitted and displayed as-is. No placeholder, no confirmation prompt.

**[x] Q11. Maximum likes per badge**
**Decision:** Resolved by Q4. One like per user per badge, binary toggle. No clap-counter style multi-liking.

**[x] Q12. Notification when new member joins**
**Decision:** No audio notifications. New badges fade in smoothly when they appear. No other visual alert.

**[x] Q13. "Go to date" — future dates**
**Decision:** Future dates are not selectable. If a future date is somehow entered, the view resets to the current date. The FAB (+) is only shown when the current date is selected — hidden when browsing history.

---

## Nice to have — can be deferred to a later version

**[x] Q14. Badge click — full-image overlay interaction**
**Decision:** Single image view only — close button (or click outside) to dismiss. No prev/next navigation. Can be added later if requested.

**[x] Q15. Sprint name history**
**Decision:** Sprint names are persisted per day and shown when browsing historical dates. The field is read-only on past dates (consistent with the rest of the history view).

**[x] Q16. Maintenance view — bulk reset**
**Decision:** Include a "Reset today" option that wipes all of today's mood entries. Requires the same confirmation + dry-run count pattern as other destructive operations.

**[x] Q17. Eraser tool**
**Decision:** No dedicated eraser. White is included in the color palette and serves as the eraser.

**[x] Q18. Undo/Redo**
**Decision:** Undo (Ctrl+Z) is supported for drawing actions. No redo. Uploading an image to the canvas resets the undo history — the upload cannot be undone.
