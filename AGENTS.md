<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Archive rule — mandatory

Whenever you create a new `page.tsx` under `src/app/`, you **must** also add an entry for it in `src/app/archive/page.tsx` in the same session.

- Choose the right `GROUPS` section (Investor & Partnerships, Product & Clinical, Operations & Internal, Hardware & Firmware, Labs & Prototypes, Marketing & Design).
- Set `label`, `tag`, `tagColor`, `description` (one sentence, factual), and `meta` (dot-separated keywords) based on what the page actually does.
- Skip: dynamic-segment routes (`[id]`, `[shareId]`), sub-apps (`/*/app`), auth flows (`/login`, `/verify`, `/forgot-password`, `/callback`), and sub-nav pages (`/dashboard/*`, `/humancapitalmgmt/orgchart`, etc.) — these are intentionally unlisted.
- A `PostToolUse` hook (`scripts/check-archive.js`) will warn if a listable route is missing. Resolve warnings before finishing.
