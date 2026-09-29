---
type: "concept-contradiction"
node_id: "L0-xcx12"
source_channel: "rollout"
analysis_version: 3
title: "CX-L0-12 · The v2 tree describes structures as \\"analysis only\\"; v1.2.0 ships them"
aliases: ["L0-xcx12"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0","L0-strf","L0-loot","L0-wind","L0-airs","L0-wrdn","L0-bast"]
see_also: ["fourstructuresspecruencopy-part-1"]
priority: 540
size_chars: 913
tags: ["title:CX-L0-12 · The v2 tree describes structures as \"analysis only\"; v1.2.0 ships them","alias:L0-xcx12","is_a:contradiction","relates_to:L0","relates_to:L0-strf","relates_to:L0-loot","relates_to:L0-wind","relates_to:L0-airs","relates_to:L0-wrdn","relates_to:L0-bast","see_also:fourstructuresspecruencopy-part-1","category:stale-sibling","severity:low","status:open","target:L0","resolved"]
level: 1
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx12
---

# CX-L0-12 · The v2 tree describes structures as "analysis only"; v1.2.0 ships them

**KV (v2).** `L0` overview and `L0-airs`/`L0-wind` are tagged `not-implemented`. They state that no structure code or `structures/` directory exists. Every structure decision is still `proposed` until the `strf` probe reports.

**Repo (2026-09-29).**
- `src/structures/` exists: `bodies`, `discovery`, `collision`, `loot`, `loot-table` and more.
- `af024e4 meta(v1.2.0): release with the structures brought to real scale`, followed by Airship and Warden City quickfixes.
- Sizes changed to "real scale" relative to the spec's figures (memory: v1.2.0 sizes).

**Impact.** Downstream readers of `wind`/`airs`/`wrdn`/`bast` get outdated sizes and states. That matters to the Cannon only through C-13 (structure blocks are ordinary).

**Action.** Queue a scan-code reconcile of the six structure nodes. It is not part of this run.
