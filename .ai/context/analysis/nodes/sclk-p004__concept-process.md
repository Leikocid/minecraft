---
type: "concept-process"
node_id: "L0-sclk-p004"
source_channel: "rollout"
analysis_version: 7
title: "P-sclk-004 · Entity hit"
aliases: ["L0-sclk-p004"]
is_a: ["process"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1706
tags: ["process", "entity-hit", "true-damage", "C-28", "sculk-patch"]
level: 2
---
# P-sclk-004 · Entity hit

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["process"]` · `relates_to: ["L0-sclk-r001", "L0-sclk-r002", "L0-sclk-r004", "L0-adr-scdm", "L0-xasm24", "L0-xcx22", "L0-xcx23"]`

**Trigger.** One of:
- `projectileHitEntity` with `projectile.typeId === "andrew:sculk_bolt"` and a live record;

**Steps:**
1. **Claim the record.** Delete it from the map first. A second event for the same bolt finds no record and does nothing (C-26).
2. `target = hit.getEntityHit()?.entity`. If it is not valid, treat the hit as expiry.
3. **Living test** (`xasm24`): the target has `minecraft:health` and is not a Creative or Spectator player.
4. **If living,** apply true damage with D = `SONIC_BOOM_DAMAGE` (r002):
   - `hp = health.currentValue`;
   - if D ≥ hp: `applyDamage(hp + 100, {cause: sonicBoom, damagingEntity: owner?})`, the overkill path, so the death message, kill credit and totems work;
   - else: `applyDamage(D, {cause: sonicBoom, damagingEntity: owner?})` for the flash and the sound, then — only inside a known window — `health.setCurrentValue(hp − D)`.
5. **Patch** (r004): `sculkPatchCells(target feet column, seed)`. Enqueue it into the carve queue (`ent4`) behind `protectLegendariesIn`. This also happens for non-living targets.
6. `bolt.remove()`. Log `sculk: hit entity <type> hp <hp> -> <after> (D 10)`.

**Never.**
- A crater.
- Damage to any entity other than `target`.
- Vanilla arrow damage. It cannot arise, because the arrow was removed at spawn.
- Tipped or spectral effects (`xasm27`).
- Extra knockback beyond what `applyDamage` itself gives (`as03`).
