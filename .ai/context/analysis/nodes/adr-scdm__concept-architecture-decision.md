---
type: "concept-architecture-decision"
node_id: "L0-adr-scdm"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "ADR-L0-scdm · How a bolt hits (status: proposed, probe-gated)"
aliases: ["L0-adr-scdm"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 3168
tags: ["v7", "sculk-crossbow", "status:proposed", "probe-gated"]
---
---
title: "ADR-L0-scdm · Bolt substitution and true damage for the Sculk Crossbow"
aliases: ["L0-adr-scdm", "Sculk bolt and damage pipeline"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-xcx22", "L0-xcx23", "L0-xasm23", "L0-xasm27"]
see_also: ["sculkcrossbowspecv1ruen-part-2", "sculkcrossbowspecv1ruen-part-3", "sculkcrossbowspecv1ruen-part-4"]
governs_files: ["src/scythe/volley.ts", "src/scythe/volley-rules.ts"]
---
# ADR-L0-scdm · How a bolt hits (status: proposed, probe-gated)

**Context.** §5, §9 and §14 put the most weight on this: vanilla arrow damage must be **replaced**, never stacked. Stable 2.10.0 has no before-event that cancels projectile damage. `projectileHitEntity` is an after-event: by the time it fires, the arrow has already dealt armour-reduced, shield-blocked damage.

**Decision (proposed).**
1. **Substitution at spawn.** When an arrow-type projectile spawns whose owner holds a marked crossbow (main or off hand), the script removes it in the same tick. It spawns one `andrew:sculk_bolt` in its place with the same location, velocity and owner (`minecraft:projectile` `shoot`). One spawn gives one bolt, so each Multishot projectile has its own record (C-26).
   - The bolt is a **snowball-runtime** entity with zero damage. Engine facts: an entity without `runtime_identifier` pushes mobs; snowball-runtime entities persist and reload through `entityLoad`, and the reload removes them (C-23).
   - Gravity and drag match the arrow (tuned constants, probe-measured), so the bolt still falls like a bolt (§9: physical, not hitscan).
2. **Hit.** `projectileHitEntity` and `projectileHitBlock` are filtered to `andrew:sculk_bolt`. The bolt's record is resolved exactly once, then the bolt is removed.
3. **Damage.** `SONIC_BOOM_DAMAGE` (`xasm23`) goes through the shipped Scythe true-damage pattern (`volley.ts:114`, `decision-scythe-true-damage`): `applyDamage(D, {cause: projectile, damagingEntity: owner})` for the flash, the sound and kill credit, then `health.setCurrentValue(hp − D)`. If D ≥ hp, it is an overkill `applyDamage`. This makes D exact through armour, Protection and the invulnerability window (`xcx22`).
4. **Visual.** While a bolt lives, the shared interval emits `minecraft:sonic_explosion` (or a look-alike RP particle if the iPad shows it badly) at the bolt's real position and the previous one (C-5f).

**Gate.** The probe confirms:
- that the spawn event carries the owner and velocity of a crossbow/shooter arrow in time to swap it with no damage;
- what a snowball-runtime bolt does against a raised shield (`xcx23`);
- that three bolts in one tick each take the full D (T17).

**Rejected.**
- **Keep the vanilla arrow and top up the difference after the hit.** The arrow's damage depends on armour, Power and the shield. A lethal arrow cannot be undone. There is also no reliable way to tell "arrow damage" from other damage in the same tick (violates C-26 and §14 "no stacking").
- **A hitscan ray from the shooter.** Forbidden by §9.
- **Arrow runtime with damage 0.** The arrow runtime keeps knockback, sticks in targets and can be picked up, and the shield still deflects it.
