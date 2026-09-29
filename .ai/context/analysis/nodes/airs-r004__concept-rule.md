---
type: "concept-rule"
node_id: "L0-airs-r004"
source_channel: "rollout"
analysis_version: 2
title: "Rule: the Windmill-linked search is a hard 40–100-block ring, tried once, never widened, never forced, never deduplicated against an independent Airship"
aliases: ["L0-airs-r004"]
is_a: ["rule"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 2111
tags: ["is_a:rule", "linked-search", "ring", "collision", "relates_to:L0-wind", "relates_to:L0-strf-r002", "relates_to:L0-strf-d004", "relates_to:L0-airs-cx01"]
level: 2
---
# Rule: the Windmill-linked search is a hard 40–100-block ring, tried once, never widened, never forced, never deduplicated against an independent Airship

**Links:** `part_of: ["L0-airs"]` · `is_a: ["rule"]`

- Every placed Windmill instance — including the guaranteed spawn one — triggers exactly one call to `airs.tryLinked(parentInstance)` from the Placer's `finish` step, guarded by `la` on the Windmill's `InstanceRecord` so it never runs twice for the same instance (`L0-strf-p003` step 7; §5.6).
- `airs` searches only `strf.searchRing(airsDef, windmillCentre, rMin=40, rMax=100)` — an annulus, not a point. Every candidate in the ring is run through the same validation and collision checks as independent generation (`L0-airs-r003`), plus one extra, `airs`-specific 2D exclusion: a candidate is rejected if its horizontal (X/Z) footprint intersects the parent Windmill's own footprint, regardless of vertical separation (`L0-strf-d004`; §5.6 "не должен висеть прямо над Мельницей/полями"). This exclusion is `airs`'s own filter, not part of `strf`'s generic 3D collision test.
- **No dedup, either direction** (`L0-strf-r002` item 6): a pre-existing independent Airship already inside [40,100] of the Windmill does **not** satisfy the linked attempt — `airs` still tries to place its own. Conversely, a successful linked Airship does not consume, or block, that chunk's own independent 2 % roll.
- **No widening, no forcing.** If no position anywhere in [40,100] validates, the linked Airship is simply not created for that Windmill instance. `airs` never expands the search past 100 blocks and never force-prepares a site — that asymmetry with `wind`'s guaranteed-spawn (which always succeeds by forcing terrain) is intentional (§5.6 "не расширять... и не форсировать размещение любой ценой").
- Two Windmills close together each run their own independent linked search; results are never merged or deduplicated between them (§5.6).
- Far ring candidates are loaded by temporary ticking areas. One that cannot be loaded leaves the attempt `pending`.
