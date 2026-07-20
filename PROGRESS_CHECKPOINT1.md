# CHECKPOINT1 — Journey checkpoint route

## Status

**DONE** — a visual-only Edo checkpoint route now augments the Journey screen.
The illustrated map background and circular distance/progress ring are retained.
No movement, Dispatch, Arrival, GPT, or mission-flow logic was changed.

## Waypoints

The fixed 20% route markers are:

1. **日本橋** (20%) — this is the historical point already named in the curated
   mission briefing and historical note, so it keeps the route vocabulary
   consistent.
2. **両国橋** (40%) — a recognizable Edo river crossing on the north-eastward
   journey.
3. **浅草寺** (60%) — a landmark that reads immediately in the Edo setting.
4. **駒形堂** (80%) — a nearby final landmark that gives the last segment a
   concrete destination-side feeling.

The row also has implicit **出立** (0%) and distinct **到着** (100%) nodes.

## Transition contract

`src/checkpointRoute.ts` contains the pure `checkpointRouteState(progress,
targetDistanceMetres)` helper. It clamps progress to 0–100 and marks each
named checkpoint:

- `completed` once its percentage is reached;
- `current` during the 15 percentage points before it (the requested 45%
  example therefore makes the 60% 浅草寺 marker current);
- `upcoming` before that approach window.

The finish node remains visually distinct and becomes gold when reached. The
next-line uses `ceil(targetDistanceMetres * (checkpointProgress - progress) /
100)`. Once all named points are passed it reads: `Final stretch — the
destination awaits.`

For the default 10-minute / Steady 800m mission, traced in the rendered app:

| Progress | Checkpoint row | Next line |
| --- | --- | --- |
| 0% | 出立 completed; 日本橋, 両国橋, 浅草寺, 駒形堂 upcoming; 到着 distinct | `Next: 日本橋 — 160m` |
| 45% | 出立, 日本橋, 両国橋 completed; 浅草寺 current; 駒形堂 upcoming | `Next: 浅草寺 — 120m` |
| 100% | all named nodes completed; 到着 reached and gold | `Final stretch — the destination awaits.` |

## Test and build evidence

The following completed with exit code 0:

```text
npm run lint       # eslint .
npm run typecheck  # tsc -b --pretty false
npm run test       # 1 test file passed, 8 tests passed
npm run build      # tsc -b && vite build; 19 modules transformed
git diff --check
```

The new unit test asserts that at 45% the four named states are
`[completed, completed, current, upcoming]`, and that the next checkpoint is
浅草寺 with 120m remaining on an 800m route.

## Mobile visual check

I captured and viewed the actual local Journey flow at **375×812** for 0%,
45%, and 100%, plus the Dispatch screen at mobile and desktop. At 375px the
six-node grid fits within the 335px screen content width with no right-edge
cutoff or horizontal scroll. The checkpoint strip is a normal block below the
map stage, so it does not overlap the existing circular ring; the screenshots
show clear separation at all three states.

Visual self-review: layout 3, typography 3, color 3, spacing 3, imagery 3,
responsive 3, motion/detail 3 (average 3.0). The existing map remains the
primary visual, while the current purple pennant adds a single focused route
cue. `VISUAL_SELF_REVIEW_PASS`.

Non-claim: **USER_VISUAL_REVIEW_REQUIRED**; this is local branch visual and
automated validation evidence, not a deployed-product acceptance claim.
