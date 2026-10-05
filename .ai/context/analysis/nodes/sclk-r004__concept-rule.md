---
type: "concept-rule"
node_id: "L0-sclk-r004"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-r004"]
is_a: ["rule"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1151
tags: ["rule", "sculk", "patch", "C-27", "T10", "T13"]
level: 2
---
**R-sclk-004 · Sculk placement (§5, §7, C-27)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-xasm24", "L0-sclk-ent4", "L0-sclk-p004", "L0-sclk-p005"]`

- The only block placed is `minecraft:sculk`. Never a sensor, shrieker, catalyst or vein.
- **Eligible cell:** a solid full block (not a liquid, a container, a block entity, the deny list, or air) with an air or passable block on the exposed side.
  - Block hit: the cells form the crater's new inner surface plus the rim surface, inside the 5×5 around the impact.
  - Entity hit: the top surface under the target.
- **Box:** ≤ 5×5 in footprint, centred on the impact column (block hit) or on the target's feet column (entity hit). For an entity hit, the surface is searched ≤ 6 blocks below the feet (`xasm24`); if there is none, there is no patch.
- **Ragged edge:** the corner cells and about 30 % of the outer-ring cells are skipped by `seed` (§5, "not a perfect square").
- Sculk is permanent. There is no timer and no rollback. It survives a chunk or server reload as an ordinary block.
- The patch happens only as a bolt outcome. No other path places sculk (§7).
