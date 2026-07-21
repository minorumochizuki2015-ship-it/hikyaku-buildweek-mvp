# SEAL1 — Arrival Seal

## Status: DONE

## What changed

- Added `src/ArrivalSeal.tsx`, a self-contained Arrival Seal component and its Canvas 2D renderer.
- The certificate contains the HIYAKU arrival brand, mission title, vermilion `飛` delivery stamp, courier rank, distance, duration, completion percentage, and the browser's modern local date (`EDO · YYYY.MM.DD`).
- Integrated the seal immediately below the existing arrival-video hero; the existing epilogue, historical note, pacer note, meal modal, and restart action remain in place.
- Replaced the previous text-only share action with `Share Seal`.

## Canvas export and sharing

`sealCanvasDataUrl` draws a 1080×1350 PNG with native Canvas 2D shapes and text (no DOM screenshot library and no external assets). It has no coordinate or location fields; neither the exported image nor the share summary takes position data.

Fallback chain:

1. Create the PNG and use `navigator.canShare({ files })` plus `navigator.share` to share the image file.
2. If file sharing is unavailable but `navigator.share` exists, share the present-tense English courier summary as text.
3. Otherwise download the PNG through an anchor with `download`.
4. If Canvas is unavailable, copy the same summary to the clipboard; if Clipboard is unavailable, render the summary as visible status text.

The Node test suite stubs a Canvas 2D context and asserts a non-empty `data:image/png;base64,...` result. It also asserts the exact text-summary fallback and verifies it has no coordinate/location terms. A real native share sheet is outside this test environment.

## 375px layout

At 375px, the seal is a 5px vermilion-and-gold framed certificate that overlaps the dark arrival hero by 26px. Its warm red 184px circular `飛` stamp is centered, visually dominant, and surrounded by a dark indigo certificate field, cream title/rank typography, a compact three-column metric strip, and a gold modern-date line. It is intentionally much warmer and more collectible-looking than the surrounding dark UI.

## Validation run

All commands exited 0:

```text
npm run lint       # exit 0
npm run typecheck  # exit 0
npm run test       # 1 file passed, 12 tests passed
npm run build      # exit 0; Vite build completed
```
