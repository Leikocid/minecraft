---
type: "concept-process"
node_id: "L0-ring-p001"
source_channel: "rollout"
analysis_version: 5
title: "Process · Ring rasterisation (`layout`)"
aliases: ["L0-ring-p001"]
is_a: ["process"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1659
tags: ["is_a:process", "geometry", "relates_to:L0-ring-ent1", "relates_to:L0-ring-r001", "relates_to:L0-xasm8"]
level: 2
---
# Process · Ring rasterisation (`layout`)

**Links:** `part_of: ["L0-ring"]` · `is_a: ["process"]` · `relates_to: ["L0-ring-ent1", "L0-ring-r001", "L0-xasm8", "L0-orbc-r014"]`

This runs once at module load. `layout(target)` only translates the table.

1. **Centre.** Add `{0,0}` (d = 1: one charge exactly over the target, §10).
2. **For each r ∈ {2.5, 5, 7.5, 10}** (d = 5/10/15/20), apply the midpoint circle with a real radius:
   - Start at `x = 0, z = round(r)`.
   - While `x ≤ z`:
     - Emit `(x, z)` and its 7 mirrors.
     - Let `x += 1`.
     - If `x² + (z − 0.5)² > r²`, then `z −= 1`.
   - The result is an 8-connected closed ring.
   - A `Set` keyed `dx,dz` removes mirror duplicates at the octant boundaries.
3. **Validate** (unit test, not at runtime):
   - Every ring satisfies the `L0-ring-ent1` invariants: closed, 8-connected, radial error ≤ 0.75.
   - The rings do not overlap. The gap between r = 2.5 and r = 5 is ≥ 1 cell, so none is expected. Any overlap is de-duplicated anyway.
4. **Order.**
   - The centre goes first, then the rings by ascending r.
   - Within a ring, cells go by `atan2` angle.
   - The order is irrelevant to behaviour (charges are independent), but it keeps the `slot` values and the gametest diffs stable.
5. **`layout(target)`** returns `columns.map(o => ({x: target.x + o.dx, z: target.z + o.dz}))`.

`orbc` then spawns one `andrew:orbital_charge` per column at `spawnY` in the activation tick (`L0-orbc-p002`). `ring` does not spawn anything itself.

**Expected counts:**
- Midpoint circle with a real radius: 1 + ~16 + ~28 + ~44 + ~56 ≈ 145.
- `xasm8` estimate: ≈ 160.
- `as06` fixes the budget at ≤ 200.
