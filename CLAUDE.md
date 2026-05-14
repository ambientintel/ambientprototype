@AGENTS.md

## Engineering domain config — single source of truth

Per-domain config (totals, defaults, localStorage keys, freeze keys, hrefs, server keys for `/api/eng/state`) lives in **`src/lib/eng-domains.ts`** and is consumed by `/eng`, `/engineering` (board NavCards, Topbar Platform button, Timeline lanes + Workstream Status panel), and every domain detail page (`/firmware`, `/ee`, `/mechanical`, `/cloudengineering`, `/webapp`, `/mobileapp`).

If you need to change a checklist total, default, localStorage key, freeze key, href, or add a new engineering domain, **edit `eng-domains.ts` only** — every consumer pulls from it. Do not redeclare these as literals in a page; it caused real percentage drift between `/eng` and `/engineering` (fixed in `67571a9`). Detail pages do `const { lsKey: LS_KEY, freezeKey: LS_FREEZE_KEY } = ENG_DOMAIN_BY_ID.<id>;`; `/eng`'s `DOMAINS` array spreads `..._m.<id>` into each entry; `/engineering` maps over the shared list for its NavCards / `DOMAIN_MAP` / Timeline `STREAMS`.

## Timeline view (`/engineering` → Timeline tab)

Programme Gantt view. Notes for editing:
- Anchors: `TL_START = May 14, 2026` is fixed (project planning start); the TODAY marker reads from `new Date()` at render — never hardcode "today" as a date literal.
- Bars come from a per-stream `BARS` array in the Timeline IIFE; each entry can set `ms: "M2"` to feed a milestone (renders a colored callout chip).
- `packBars()` chains edge-touching bars (one bar's end day == another's start day) onto the same row. To avoid them blending visually, every bar is `width: calc(N% - 4px)` plus an `inset -2px 0 0 rgba(0,0,0,…)` shadow on the right edge.
- Lane height = `max(MIN_LABEL_H, trackH)`; bars are vertically centered via `trackTopOffset` so single-bar lanes don't look top-anchored.
- Bars too narrow to fit their text are NOT given floating sibling labels. Every bar has `cursor: pointer` and `onClick` opens a Jira-style popover anchored to the bar with: workstream tag, full task title, date range + day count, status badge, milestone callout, and a link to the workstream page. Popover state lives at the parent component level (the IIFE can't host hooks).
