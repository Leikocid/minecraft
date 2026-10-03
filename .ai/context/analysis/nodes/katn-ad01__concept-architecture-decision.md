---
type: "concept-architecture-decision"
node_id: "L0-katn-ad01"
source_channel: "rollout"
analysis_version: 6
title: "AD-katn-01 · How \"the player fits\" is measured"
aliases: ["L0-katn-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 2276
tags: ["architecture-decision", "katana", "safe-position", "status:proposed", "is_a:architecture-decision", "relates_to:L0-adr-ktob", "refines:L0-adr-ktob"]
level: 2
---
---
title: "AD-katn-01 · Fit check = a vertical column ray through the cell centre, not a one-cell segment along the view"
is_a: ["architecture-decision"]
part_of: ["L0-katn"]
relates_to: ["L0-adr-ktob", "L0-katn-r004", "L0-katn-ac08", "L0-katn-cx01"]
---
# AD-katn-01 · How "the player fits" is measured

**Status:** proposed. It refines `L0-adr-ktob` §3 and is confirmed by probe (3) in `L0-katn-ac08`.

## Context
- `L0-adr-ktob` §3 says the passable test "reuses the same ray primitive on a one-cell segment" but does not say which segment.
- A ray only tests a line. A horizontal ray through the cell's middle (y+0.5) misses a bottom slab (y 0–0.5) and only grazes a top slab. A player placed there is shoved up or stuck.
- Stable 2.10.0 has no `Block.isSolid` and no collision-box query.

## Decision
1. **Column ray.** For a candidate feet cell `F`, cast one ray from `(F.x+0.5, F.y+2−ε, F.z+0.5)` straight down, `maxDistance 2−2ε`, with the trace flags (`includePassableBlocks:false, includeLiquidBlocks:false`). A hit means "does not fit". One call covers both the feet and head cells.
2. **Air shortcut.** If `getBlock(F)` and `getBlock(F+up)` are both `isAir`, skip the ray.
3. **Hazard filter.** A `typeId` check of the two cells against `{minecraft:lava, flowing_lava, fire, soul_fire}` (`L0-katn-as03`). This is a hazard list, not a solid list, so `L0-adr-ktob`'s rejection of hand-kept solid lists still stands.
4. **Centring.** The player is placed at the cell centre. With a 0.6-wide hitbox and a centre ray, only blocks of the cell itself matter.
5. **Cost.** At most ~40 candidates × (2 reads + 1 ray) per use. It runs only on activation (C-5e).

## Rejected alternatives
- **A one-cell ray along `d`.** It misses slabs and depends on the aim angle.
- **Four corner rays per cell.** That is 4× the cost. Centring already makes the corners irrelevant for full-cube neighbours.
- **`getBlock().isAir || isLiquid` only.** Flowers and grass would count as "no fit", so the Katana would refuse meadows.

## Consequences
- A thin edge block inside the cell, for example an open trapdoor at the cell edge, may be missed. Its collision does not reach the centred hitbox, so it is accepted.
- If probe (3) fails, fall back to two horizontal rays, at y+0.1 and y+1.9.
