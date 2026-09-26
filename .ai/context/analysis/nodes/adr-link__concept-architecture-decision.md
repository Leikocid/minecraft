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
- `wind-ad03`: `tryLinked` returns `placed | none | deferred`, and `x.linkedTried` is set only on `placed`/`none`.
- `airs-cx01`, option (c): unloaded candidates stay `pending` and are retried on later discovery.

**Decision.**
1. **Once = one resolved attempt per Windmill**, recorded once in `x.linkedTried`. Retries touch only the ring candidates that were `pending`. The Windmill is never re-rolled or re-searched, and there is no scan: a retry happens only when `strf` discovery next evaluates a chunk that holds a pending candidate (`strf-r007`'s existing path).
2. **The candidate order is fixed at the first call.** It is seeded from the parent's instance id, so a retry cannot pick a different "first valid" site than a fully loaded run would. The first candidate in order that validates wins. A candidate earlier in order that is still `pending` blocks a later valid one. This keeps the result independent of player movement.
3. **No retry cap.** A pending attempt costs one record field and no ticks. If the player never loads the ring, the linked Airship simply never exists. This is recorded in the deviation report (`strf-r012`).
4. **Spawn Windmill.** Its linked attempt runs inside the one-time tickingarea sweep (`L0-adr-spwn`), so it normally resolves at world start.
5. **Ownership.** `wind` owns *when* and *once* (`wind-r012`, `wind-ad03`). `airs` owns the ring order, validation and the "not over the Windmill" exclusion (`airs-d001`). `strf` owns `pending`.
6. The linked Airship's id is `airship:L:<parentId>` (`wind-ad03`). A replay cannot create a second one.

**Closes:** `L0-wind-cx02` and `L0-airs-cx01`.
