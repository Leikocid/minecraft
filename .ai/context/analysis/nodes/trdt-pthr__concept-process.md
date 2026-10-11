---
type: "concept-process"
node_id: "L0-trdt-pthr"
source_channel: "rollout"
analysis_version: 9
title: "Process · Throw, flight, hit, steered return, re-insert"
aliases: ["L0-trdt-pthr"]
is_a: ["process"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 2679
tags: ["above-water-trident", "throw", "return", "custody"]
level: 2
---
# Process · Throw, flight, hit, steered return, re-insert

**Links.** is_a: process. relates_to: L0-adr-twth, L0-trdt-adcl, L0-trdt-ecus, L0-trdt-pfbk, L0-trdt-addm, L0-trdt-r001.

1. **Release.** `itemReleaseUse` with the trident, charge ≥ 10 ticks, **not** sneaking (`xcx28` default) → throw. A sneaking release goes to `L0-trdt-pmov`. A charge under 10 ticks does nothing.
2. **Throw, one sync block:**
   1. Read the slot (main hand or off hand) and clone the stack.
   2. Write the custody record (`state: flying`, `since`).
   3. Clear the slot.
   4. Spawn `andrew:thrown_above_water_trident` at the eye. Set `andrew:tr.throw`, the projectile owner = thrower, and `shoot(view × vanilla speed)` (measured by probe P7).
   5. Store the `entityId`.

   This fires `playerInventoryItemChange`. lgnd notes a departure and ignores it, because there was no DropItem swing (T3).
3. **Flight.** Vanilla gravity and drag come from the entity's projectile data. Flight cap: 10 s since `since` → treated as a miss (`xasm36`).
4. **Entity hit** (`projectileHitEntity`):
   - native impact damage, plus the +2 raise and one strike (`L0-trdt-addm`, `r002`);
   - then the swap to returning (step 6), starting at the hit point.
5. **Block hit or miss** (`projectileHitBlock`, or the flight cap): the swap to returning, starting at the projectile's position.
6. **Swap, one sync block:**
   1. Remove the projectile, recording its id as "removed by us".
   2. Spawn `andrew:returning_above_water_trident` with the same `andrew:tr.throw`.
   3. Update the record: `state: returning`, the new `entityId`, `returnSince`.
   4. Keep the in-memory clone: it is dropped only at the insert or a delivery.
7. **Steered return** (the shared `runInterval`, 1 tick):
   - Move the entity 0.5 blocks toward the owner's chest (`location + 1.2 y`) by `teleport`, facing the owner. Teleport ignores blocks, as Loyalty passes through them.
   - Every 20 ticks, refresh `record.last`.
   - Before each step, check the fallback triggers (`pfbk`).
8. **Arrival** (distance ≤ 1.5, or within the 0.5 b step), one sync block:
   1. If `!isLive(mark)`: remove the entity and delete the record, with no insert.
   2. Otherwise, take the clone, scrub it (`r003`), and insert it: the selected slot if it is empty, else `addItem`, else `spawnItem` at the feet.
   3. Remove the entity, delete the record and drop the clone.
9. **Re-throw lock.** None is needed: the thrower holds no copy until step 8 (C-33). A Creative copy is a separate item with its own record.

**Measured outputs** (`L0-trdt-a004`):
- return speed 10 b/s ± 5 % (20 blocks in 1.9–2.1 s);
- at every tick: held + entity + record count ≤ 1 for the marked instance.
