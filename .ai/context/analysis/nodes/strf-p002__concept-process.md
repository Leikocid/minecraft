---
type: "concept-process"
node_id: "L0-strf-p002"
source_channel: "rollout"
analysis_version: 2
title: "Process — footprint validation of a candidate"
aliases: ["L0-strf-p002"]
is_a: ["process"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 2188
tags: ["is_a:process", "validation", "footprint", "relates_to:L0-strf-r005", "relates_to:L0-strf-r006", "relates_to:L0-strf-r013", "relates_to:L0-airs", "relates_to:L0-wind", "relates_to:L0-wrdn", "relates_to:L0-bast"]
level: 2
---
# Process — footprint validation of a candidate

**Links:** `part_of: ["L0-strf"]` · `is_a: ["process"]`

**Input.** A `Candidate` `{def, dim, origin(x,z), rot}`, with the rotated footprint `W'×D'` (x/z swap for 90/270) and the height `H`.

**Steps (a generator; yields every `PROBE_BATCH` block reads)**
1. **Dimension gate.** `def.dimension === dim`, otherwise reject (C-14).
2. **Loaded gate.** Every chunk under the footprint plus `MARGIN` (2 blocks) must be loaded. If not, return `pending` (`L0-strf-r007`).
3. **Surface sampling.** On a grid with step `s` (2 for footprints ≤ 20, 4 above that), plus the four corners and the centre, read the column surface:
   - Overworld: `dimension.getTopmostBlock({x,z})`. Record Y, the block type, and whether it is liquid (water/lava, including waterlogged surface blocks such as kelp and seagrass tops).
   - Nether: the downward floor probe in `L0-strf-r013`, because `getTopmostBlock` returns the bedrock roof.
4. **Profile checks** (`def.validity`, see `L0-strf-r005`):
   - `dryLand`: liquid samples ≤ `maxLiquidShare` (Windmill 5 %, Airship 10 %, Warden City 0 % over the centre plus 8-point ring).
   - `flat`: `maxY − minY ≤ maxSpread` (Windmill 3).
   - `lavaOcean` (Nether): reject if any floor sample is lava at Y ≤ 32, or if supported share < 80 %.
   - `altitude` (Airship): `bottomY = maxSurfaceY + clearance`. Clearance is seeded in [40, 70], clamped down to 40 if needed. Reject if `bottomY + H − 1 > heightRange.max − 1`.
   - `depth` (Warden City): top Y seeded in [−45, −35]. Reject if `bottomY < heightRange.min + 1` (bedrock band).
5. **Collision** (`L0-strf-r006`): registry AABB overlap, then a sparse volume probe for spawners and signature blocks.
6. Return `valid(originY, rot, extras)`, `reject(reason)` or `pending`.

**Outputs.** Every `reject(reason)` increments a counter per `(def, reason)`, logged every 5 min at debug level. The statistical tests (23/32/41/51) use these counters to explain lower effective rates.

**Budget.** At most ≈ `(W'/s)(D'/s)` surface reads plus `(W'·D'·H)/(4³)` volume reads. For the 35×35 Windmill that is ≈ 330 surface reads and ≈ 600 volume reads, spread over ticks by `runJob`.
