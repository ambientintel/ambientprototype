# ambientprototype

Prototype UI for Ambient Intelligence. Not for production use.

## Local dev

```bash
npm install
npm run dev
```

Opens at http://localhost:3000

## Live site

[https://ambientprototype.vercel.app](https://ambientprototype.vercel.app)

| Page | URL |
|---|---|
| Home | [/](https://ambientprototype.vercel.app) |
| Patient Dashboard | [/dashboard](https://ambientprototype.vercel.app/dashboard) |
| 21 CFR 820 Gap Analysis | [/gapanalysis](https://ambientprototype.vercel.app/gapanalysis) |
| PLM — Bill of Materials | [/bom](https://ambientprototype.vercel.app/bom) |
| SaMD Regulatory Dashboard | [/samd](https://ambientprototype.vercel.app/samd) |

### Engineering

| Page | URL | Notes |
|---|---|---|
| Project board (Sprint + Backlog + **Timeline** + People) | [/engineering](https://ambientprototype.vercel.app/engineering) | Timeline view is a Gantt-style programme view: 5 milestones (Advanced PCT board order, EI Microcircuits handoff, Pilot start/end, Summary) × 7 workstream swimlanes. Click any bar for the task popover. |
| Platform Status (all 6 domains) | [/eng](https://ambientprototype.vercel.app/eng) | Aggregator dashboard with per-domain progress, freeze locks, open decisions. |
| Firmware (AM62x build chain) | [/firmware](https://ambientprototype.vercel.app/firmware) | |
| EE Hardware (IWR6843AOP + OSD62x-PM PCB) | [/ee](https://ambientprototype.vercel.app/ee) | |
| Mechanical (enclosure + harness) | [/mechanical](https://ambientprototype.vercel.app/mechanical) | |
| Cloud Engineering (CDK v2, AWS) | [/cloudengineering](https://ambientprototype.vercel.app/cloudengineering) | |
| Web App (Ella nurse dashboard) | [/webapp](https://ambientprototype.vercel.app/webapp) | |
| Mobile App (Expo + RN) | [/mobileapp](https://ambientprototype.vercel.app/mobileapp) | |

Per-domain progress data (totals, defaults, localStorage keys, freeze keys, hrefs, server keys) is centralized in [`src/lib/eng-domains.ts`](src/lib/eng-domains.ts) — `/eng`, `/engineering`, and every domain detail page consume it so percentages can't drift. Runtime state for "items checked" lives in Vercel Blob behind [`/api/eng/state`](src/app/api/eng/state/route.ts).

## Deploy

Pushes to `main` auto-deploy via Vercel.

## Stack

- [Next.js](https://nextjs.org) (App Router)
- TypeScript
- Tailwind CSS
