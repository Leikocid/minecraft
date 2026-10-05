---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac27"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-ac27"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 610
size_chars: 1450
tags: ["v7", "sculk-crossbow", "holder"]
level: 2
---
**AC-lgnd-27: Crossbow T19, T20 and Void return under C-16, against `returnTarget(mark)`.** Channel: `bds` (the shipped legendary scenarios parameterised by def).

Related: L0-lgnd-ad16, L0-lgnd-ad17, L0-lgnd-cx16, L0-lgnd-ac24, L0-xcx21, L0-xcx25.

`returnTarget(mark)` is `mark.owner` until `LGND-HOLD` ships, then `holder ?? owner` (`ad17`).

- **T19.** P has a marked crossbow in the hotbar or off hand and dies (also by a magnet fall). On respawn P holds the same id and gen; no item entity remains.
- **T20, prevent.** A marked crossbow item entity in fire or lava is still there after 10 s, same id and gen. In a chest in an Orbital LMB column, in an RMB/ring AABB, **or inside a crossbow crater** (`sclk` calls `protectLegendariesIn` first), it ends outside the volume with the same id and gen, no message, nothing in `sk_owed`.
- **T20, return.** On cactus or hit by primed vanilla TNT: exactly one live crossbow exists, with `returnTarget(mark)` (gen + 1, `andrew.legendary.recovered`) or in `sk_owed` if that player is offline.
- **Void.** Dropped into the Void, or inside a chest minecart or held by an armour stand that falls in: it returns to `returnTarget(mark)` exactly once; offline → `sk_owed`, redeemed once on the next join, also after a restart.
- **Known deviation until `LGND-HOLD`:** A crafts, gives to B, B loses it in the Void → A receives it.
- No crossbow-specific line in `src/legendary/` is needed for any clause above.
