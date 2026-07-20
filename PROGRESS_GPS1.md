# GPS1 — Walk Mode

## Status

**DONE** — foreground-only Walk Mode is available beside the default Demo Journey. No background location tracking, coordinate transmission, coordinate logging, or coordinate persistence was added.

## What changed

- Dispatch now offers `Walk Mode` and `Demo Journey`, with Demo Journey selected by default.
- Each mission receives one app-calculated distance target, used consistently by Journey, completion, and Arrival:
  - Low: `availableMinutes * 60m`
  - Steady: `availableMinutes * 80m`
  - Ready: `availableMinutes * 100m`
  This makes the three available time choices yield sensible short walking targets (for example, Steady/10 minutes is 800m) without involving GPT in completion decisions.
- Walk Mode starts `navigator.geolocation.watchPosition` only while the journey is `active`, requests high accuracy, turns successive positions into on-device haversine increments, and derives progress from `round(totalDistance / targetDistance * 100)` capped at 100.
- The watch is cleared on a location error, pause, completion, or component teardown. Coordinates are held only in the watch callback's local previous-position variable; app state keeps only aggregate distance/progress.
- If the API is absent or reports a permission/location error, the screen says `Location unavailable — continuing with Demo Journey.` and switches to the original 800ms/+5% timer behavior for that session.
- Demo Journey retains its prior timer cadence; it now maps that same progress to the mission-specific target.

## GPS fallback verification and limitation

The sandbox has no physical GPS route, so I did not claim live-device movement verification. The Vitest test replaces `navigator.geolocation` with a stub, captures `watchPosition`'s error callback, invokes a permission-denied error, and verifies both the fallback callback and `clearWatch(42)`. Pure-function tests also cover the target formula and an independently known 111.195km equatorial one-degree haversine value.

## Coordinate privacy check

`rg -n -U "fetch\\([^)]*(latitude|longitude)|(latitude|longitude)[^\\n]*fetch\\(" src` produced no matches. The only `fetch` remains the existing mission/completion API helper, while latitude/longitude access exists only in `src/movement.ts` for local distance calculation.

## Validation output

```text
$ npm run lint

> hiyaku-buildweek-mvp@0.0.0 lint
> eslint .

$ npm run typecheck

> hiyaku-buildweek-mvp@0.0.0 typecheck
> tsc -b --pretty false

$ npm run build

> hiyaku-buildweek-mvp@0.0.0 build
> tsc -b && vite build

vite v8.1.4 building client environment for production...
transforming...✓ 18 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.55 kB │ gzip:  0.34 kB
dist/assets/index-Djx5YkFt.css    9.56 kB │ gzip:  2.94 kB
dist/assets/index-DuV292Lu.js   202.79 kB │ gzip: 63.68 kB

✓ built in 71ms

$ npm run test

> hiyaku-buildweek-mvp@0.0.0 test
> vitest run

 RUN  v4.1.10 /Users/moc/ORCH-Next/projects/hiyaku-buildweek-mvp/.claude/worktrees/lane-GPS1-walk-mode

 Test Files  1 passed (1)
      Tests  6 passed (6)
```
