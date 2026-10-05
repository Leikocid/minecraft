---
type: "concept-assumption"
node_id: "L0-xasm28"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "ASM-L0-28 · A sculk bolt is invisible to every legendary and magnet predicate"
aliases: ["L0-xasm28"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 1674
tags: ["v7", "sculk-crossbow", "CAN_ASSUME", "reduce"]
---
---
title: "ASM-L0-28 · A sculk bolt is invisible to every legendary and magnet predicate"
aliases: ["L0-xasm28", "Bolts are not legendaries"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-lgnd", "L0-magn", "L0-sclk-ent2", "L0-sclk-ad03", "L0-lgnd-r016", "L0-xasm26"]
governs_files: ["src/sculk/", "src/legendary/registry.ts", "src/ufo/magnet-select.ts"]
---
# ASM-L0-28 · A sculk bolt is invisible to every legendary and magnet predicate

**Assumption (CAN_ASSUME).** `andrew:sculk_bolt` is a projectile entity (`sclk-ent2`), not an item stack, and it holds no item. So:
- `isLegendaryStack` / `isLegendaryWeaponStack` / `isLegendaryItemEntity` never match it, and `protectLegendariesIn` never moves it out of a crater box. That is harmless, because a bolt has already resolved by the time its own crater is planned.
- The UFO magnet (`magn`) selects legendary item entities and holders through `hasitem` (`lgnd-r016`). A bolt is neither, so a magnet in flight range never captures it.
- A bolt that leaves loaded chunks or exceeds 100 ticks is removed with no outcome. It has no owed entry or recovery path in `lgnd`.

**Why it is an L0 assumption.** Each child states only its own half: `sclk` says "bolts are not item stacks", and `lgnd`/`magn` select by stack type. Neither checks the other.

**Check (cheap, in the `sclk` pipeline task).** A GameTest fires a bolt across an active magnet zone and asserts that it resolves exactly once on its natural path. If the magnet turns out to move generic projectile entities, the bolt needs a magnet exclusion. That exclusion would be a `magn` change, filed as a new L0 contradiction, not patched in `sclk`.
