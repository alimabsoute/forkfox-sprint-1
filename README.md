# ForkFox Acquisition Sprint — Sprint 1

42-day acquisition sprint tracker for ForkFox iOS TestFlight beta. Deployed as static HTML to GitHub Pages at:

**https://alimabsoute.github.io/forkfox-sprint-1/**

## What this is

A daily execution dashboard. Each of the 42 days has its own page (`day-01/index.html` through `day-42/index.html`) with:
- Numbered task cards
- Step-by-step instructions
- Pre-filled copy/paste field references for every directory + form
- Time estimates per task
- Asset links (logo, screenshots, templates) ready to upload

Open the day's page, click each field's copy button, paste into the form, submit, mark off, next.

## Structure

```
public/                                  ← this repo, served by GitHub Pages
├── index.html                           ← 42-day calendar overview
├── style.css + tracker.js               ← shared assets
├── day-01/ ... day-42/                  ← per-day pages
│   ├── index.html                       ← the daily task list
│   └── <directory>.html                 ← field-reference popups (BetaList, Crunchbase, etc.)
│
├── _assets/                             ← all reusable assets
│   ├── brand/                           ← ForkFox logo kit (10 PNGs)
│   ├── app-store/                       ← 10 App Store screenshots
│   ├── images/                          ← directory logos (BetaList, Crunchbase, etc.) + ad creatives
│   ├── templates/                       ← email/DM template stubs
│   ├── forkfox-sprint-tracker.xlsx      ← daily log + cumulative + outreach sheets
│   ├── forkfox-decision-matrix.xlsx     ← Day 8 / Day 40 pivot template
│   ├── forkfox-influencer-db.csv        ← Tier A influencer database
│   └── sprint-2-deferred.md             ← Sprint 2 backlog (paid ads, auto-pipeline rebuild)
│
└── social-dashboard/                    ← IG + FB content prep (new 2026-05-13)
    ├── index.html                       ← 42-day calendar
    ├── day-04.html ... day-42.html      ← per-day post slots
    ├── style.css + dashboard.js
    └── content/day-04.json ... day-42.json  ← generated post content (run `forkfox/pipeline/build_social_calendar.py` to regenerate)
```

## The 42-day arc

Days 1-2 are **backfilled** with what already happened (May 12-13: Zoho alias setup, iOS asset finalization, brand kit v1, Dish/Carte pipeline cadence bumps, GitHub→Vercel deploy fix).

Days 3-42 are forward-looking, ordered **lowest-tier directories first**:

| Day | Date | Theme |
|---|---|---|
| 1 ✅ | May 12 | Setup + iOS kickoff (backfill) |
| 2 ✅ | May 13 | iOS finals + brand kit + pipeline + deploy fix (backfill) |
| 3 | May 14 | IG cleanup + social-dashboard standup |
| 4 | May 15 | BetaBound (lowest-tier warmup) |
| 5 | May 16 | Light day + IG reshare |
| ... | ... | ... (see `index.html` for the full grid) |
| 31 | June 11 | ⭐ BetaList (long-lead-time, submit early for ramp) |
| 35 | June 15 | ⭐⭐ Product Hunt Coming Soon |
| 37 | June 17 | ⭐⭐⭐ Crunchbase (investor signaling, do last) |
| 40 | June 20 | Mid-sprint review #2 |
| 41 | June 21 | Sprint 2 plan draft |
| 42 | June 22 | Final review + Sprint 2 launch |

**All 17 directories preserved.** Reordering only — none cut from the sprint.

**Paid acquisition deferred to Sprint 2** (Reddit Ads, Instagram Ads). See `_assets/sprint-2-deferred.md`.

## Social content dashboard (new 2026-05-13)

`/social-dashboard/` is a hybrid manual posting tool for **IG + FB only**. The original auto-pipeline (`post-social.yml` in the `forkfox` repo) was deprecated 2026-05-10. Threads + Bluesky + Pinterest re-enablement is tracked in `_assets/sprint-2-deferred.md`.

Each day-XX page in the dashboard shows the day's planned posts:
- Image preview (App Store screenshot OR article hero OR novel-post image-gen prompt)
- IG caption with copy button
- FB caption with copy button
- Hashtags (5 max for IG)
- Image-gen prompt (Midjourney/DALL-E style)
- Video-gen prompt (Sora/Runway/Pika style)
- "Open Ayrshare" deep link — copies JSON payload to clipboard, opens `app.ayrshare.com/post` in new tab

Manual posting flow: open day-XX in dashboard → copy caption → click "Open Ayrshare" → paste into composer → schedule.

Sprint 2 will replace the manual hand-off with a Vercel function that schedules directly via the Ayrshare API.

## How to regenerate content

Daily dashboard content lives in `social-dashboard/content/day-XX.json`. Regenerate from the canonical source:

```bash
cd C:\Users\alima\forkfox\pipeline
python build_social_calendar.py
```

This reads the 10 iOS card SLIDES from `forkfox/app-store/compositor.py`, 11 Dish article `social.json` files, and 15 hand-written novel-post objects → outputs 39 day-XX.json files. Deterministic; re-runnable.

## Deploy

GitHub Pages auto-serves from `main` after every push. No build step. Wait ~60s after push, visit the URL.

## Companion repos

- **`alimabsoute/forkfox`** — the main ForkFox monorepo (landing pages, article pipeline, app-store assets, brand kit source-of-truth).
- **`alimabsoute/forkfox-sprint-1`** (this repo) — the sprint tracker, served from `public/`.

Brand assets in `_assets/brand/` and `_assets/app-store/` are **copies**. Source-of-truth lives at `forkfox/brand-kit/` and `forkfox/app-store/output/` respectively. To update: regenerate at source, then copy into `_assets/`.

## Sprint commit log

| Date | Commit | What |
|---|---|---|
| 2026-05-13 evening | `584f8b1` | Brand kit logo + App Store screenshot pack + sprint asset audit |
| 2026-05-13 late evening | `770aa6d` + `60e3ff5` | Recalibrate to 42 days + social-dashboard MVP |
| 2026-05-13 late evening | `0275400` (forkfox repo) | Content generator + AUTOMATION.md correction |
