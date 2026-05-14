# Sprint 2 — Deferred From Sprint 1

These items were on the original 14-day plan but pushed to Sprint 2 after the 42-day re-ordering on May 13, 2026.

## Paid acquisition (defer until baseline metrics exist)

- **Reddit Ads** — $10/day × 2 creative variants (image ad + text ad). Target r/foodphiladelphia, r/sanfrancisco, r/bayarea, r/foodporn. Estimated burn: $140 over 7 days. Defer until we have organic Reddit traction data from Days 7, 15, 23 (r/SideProject, r/phillyfood, r/bayareafood) to calibrate copy + targeting.
- **Instagram Ads** — $10/day × 2 creative variants (carousel + reel). Target food-interest lookalikes in Philly + SF metros. Estimated burn: $140 over 7 days. Defer until brand-account baseline engagement is established (Days 4–21 dashboard cadence will surface what creative actually works organically).

## Decision points to revisit at Sprint 2 kickoff

- **Day 8 budget-pivot decision** — In the original plan, Day 8 was the pivot moment where if ads weren't producing installs we re-allocated to influencer spend or doubled down on a single channel. Because no ads ran in Sprint 1, that decision deferred. Make it on Sprint 2 Day 8 instead.

## Tooling

- **Full Ayrshare API direct-schedule integration** — Sprint 1 dashboard schedules posts manually via a UI; Sprint 2 should drive Ayrshare directly from the dashboard backend so the entire posting flow is one click.

## Social auto-pipeline re-enablement (DISCOVERY 2026-05-13 evening)

The original AUTOMATION.md described Threads + Bluesky + Pinterest as "active auto-posting." That's not actually the case — the entire `post-social.yml` workflow was deprecated 2026-05-10 (cron disabled, `post_social.py` quarantined to `pipeline/_deprecated/`). The per-platform replacement workflows referenced in the deprecation header (`social-threads.yml`, `social-bluesky.yml`, `social-pinterest.yml`) **do not exist on disk yet**.

The user wants Threads + Bluesky + Pinterest to auto-post going forward (low-risk channels with no Meta-style account suspensions). These are Sprint 2 deliverables:

- **Build `.github/workflows/social-threads.yml`** — single-platform workflow. Reuse the Threads call path from `pipeline/_deprecated/post_social.py` lines that hit `/api/post` with `platforms: ["threads"]`. Schedule: 3x/day matching the old cadence.
- **Build `.github/workflows/social-bluesky.yml`** — text-only, simplest of the three to revive. Same Ayrshare endpoint with `platforms: ["bluesky"]`.
- **Build `.github/workflows/social-pinterest.yml`** — uses `og.jpg` per article. Same shape.
- **Document the new state in `forkfox/AUTOMATION.md`** — the current AUTOMATION.md was updated 2026-05-13 to reflect the real off-state; once these workflows ship, update again to show the new auto-posting matrix.
- Until those ship, all 5 channels go through the social-dashboard manual flow (the dashboard already supports all 5 via Ayrshare).

## Notes

- Sprint 2 plan is drafted on Day 41 (June 21, 2026) using Sprint 1 metrics from Day 40 (June 20).
- These deferred items must be re-prioritized against Sprint 2 fresh ideas before being committed.
