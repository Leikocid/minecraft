---
type: "concept-contradiction"
node_id: "L0-ring-cx02"
source_channel: "rollout"
analysis_version: 3
title: "CX-ring-02 · The `lgnd` protection volume and safe-spot search are too small for RMB"
aliases: ["L0-ring-cx02"]
is_a: ["contradiction"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1423
tags: ["is_a:contradiction", "category:source-vs-engine", "severity:medium", "status:resolved", "target:L0-lgnd", "relates_to:L0-lgnd-p008", "relates_to:L0-lgnd-r013", "relates_to:L0-ring-r008", "relates_to:L0-ring-ad04", "resolved"]
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: L0-adr-oprt
level: 2
---
# CX-ring-02 · The `lgnd` protection volume and safe-spot search are too small for RMB

**Target:** `L0-lgnd` (`p008`, `r013`). **Category:** source-vs-engine. **Severity:** medium. **Status:** resolved by `L0-adr-oprt` (reduce, v3).

1. **Radius.**
   - `L0-lgnd-r013` §2 protects "the blast AABB (centre ± power)". `L0-lgnd-p008` sizes it at about 9³ (± 4).
   - Bedrock explosions *damage entities*, including item entities, out to about 2 × power = 8 blocks, and destroy item entities that take damage.
   - So a ground legendary 5–8 blocks from a ring blast is outside the protected volume and gets destroyed. It then goes through tier-3 "return" instead of tier-1 "not destroyed". That violates §5 and `L0-lgnd-ad10`'s claim that the Cannon meets §5 literally.
2. **Safe spot.**
   - `p008` searches outward "up to 16 blocks" for a column outside `volume` and `avoid`.
   - The RMB footprint is 21 × 21. Plus the ±8 margin, `avoid` becomes 37 × 37. From the centre, the nearest column outside it is ≥ 19 blocks away.
   - The search therefore always fails for inner-ring blasts and falls to step 6, "hand to holder": the item leaves the world. That is the only C-16 deviation `p008` allows, and here it becomes the normal path.

**Proposed resolution** (for `lgnd`):
- margin = 2 × power for explosions;
- start the safe-spot search at the edge of `avoid`, not at the centre of `volume`, or raise the search limit to `max(16, halfExtent(avoid) + 4)`.
