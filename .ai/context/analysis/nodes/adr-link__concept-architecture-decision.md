---
type: "concept-architecture-decision"
node_id: "L0-adr-link"
source_channel: "rollout"
analysis_version: 2
title: "ADR-L0-link · \"Check the linked Airship once\" means one completed attempt, and unloaded ring candidates defer"
aliases: ["L0-adr-link"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 2308
tags: ["title:ADR-L0 linked Airship is one completed attempt with per-candidate deferral", "reduce", "cross-component", "status:accepted", "resolves:L0-wind-cx02", "resolves:L0-airs-cx01", "relates_to:L0-wind", "relates_to:L0-airs", "relates_to:L0-strf", "relates_to:L0-wind-cx02", "relates_to:L0-airs-cx01", "relates_to:L0-wind-ad03", "relates_to:L0-wind-r012", "relates_to:L0-airs-d001", "relates_to:L0-strf-r007", "relates_to:L0-strf-r002", "relates_to:L0-strf-e002", "relates_to:L0-adr-spwn"]
level: 2
---
# ADR-L0-link · "Check the linked Airship once" means one completed attempt, and unloaded ring candidates defer

**Links:** `is_a: ["architecture-decision"]` · `relates_to: ["L0-wind", "L0-airs", "L0-strf", "L0-wind-cx02", "L0-airs-cx01", "L0-wind-ad03"]` · `requires: ["L0-strf"]` · **status:** accepted

**Context.** Two siblings filed the same conflict, §7 "once, right after the Windmill" against C-12 / `strf-r007` (never read unloaded chunks):
- `L0-wind-cx02`, targeted at `airs`.
- `L0-airs-cx01`. It says `wind-cx02` "was never written". That is wrong: both exist in this run. `airs-cx01` does not supersede `wind-cx02`; they are one issue.

Their proposals agree:
- `wind-ad03`: `LinkedAirships.start` (airship.ts:93). `la=true` is written before the attempt. The outcome is `ls` (airship.ts:32).
- `airs-cx01`, option (c): unloaded candidates stay `pending` and are retried on later discovery.

**Decision.**
1. **Once = one resolved attempt per Windmill**: one attempt (`la`). A pending attempt reruns the seeded ring every 600 ticks and after restart. A resume is not an attempt (`strf-r007`'s existing path).
2. **The candidate order is fixed at the first call.** It is seeded from the parent's instance id, so a retry cannot pick a different "first valid" site than a fully loaded run would. The first candidate in the seeded order that loads and validates wins. A pending one does not block later ones (search-ring.ts:132-141). Loading does not depend on the player.
3. **No retry cap.** A pending attempt costs one retry per 600 ticks. It resolves without the player, because the ring is loaded by ticking areas. This is recorded in the deviation report (`strf-r012`).
4. **Spawn Windmill.** Its linked attempt starts from the same Placer hook when the spawn search places `windmill:spawn`. The ring loader loads its ring after the sweep's areas are released.
5. **Ownership.** `wind` owns *when* and *once* (`wind-r012`, `wind-ad03`). `airs` owns the ring order, validation and the "not over the Windmill" exclusion (`airs-d001`). `strf` owns `pending`.
6. The linked Airship's id is `airship:linked:<parentId>:<slot>` (`wind-ad03`); replay-safe via `la` and the reserved spot `lo` (airship.ts:29,151-159).

**Closes:** `L0-wind-cx02` and `L0-airs-cx01`.
