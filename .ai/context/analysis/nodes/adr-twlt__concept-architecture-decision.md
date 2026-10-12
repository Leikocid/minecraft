---
type: "concept-architecture-decision"
node_id: "L0-adr-twlt"
source_channel: "rollout"
analysis_version: 10
level: 2
title: "ADR-L0-twlt · Trident lightning and +2 HP"
aliases: ["L0-adr-twlt"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 3667
tags: ["v9", "above-water-trident", "status:proposed", "amended-at-reduce"]
---
---
title: "ADR-L0-twlt · Trident lightning and +2 HP: the shared strike visual plus scripted bonus damage"
aliases: ["L0-adr-twlt", "Trident lightning decision"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-strm", "L0-xcx29", "L0-xq10", "L0-adr-sblt", "L0-adr-sbdm", "L0-xcx26", "L0-trdt-addm", "L0-trdt-r002", "L0-trdt-cx02"]
requires: ["L0-strm"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2"]
governs_files: ["src/storm/visuals.ts", "src/storm/damage.ts", "src/trident/"]
---
# ADR-L0-twlt · Trident lightning and +2 HP

**Status:** proposed. It is the default until `xq10` is answered.

**Amended at the v9 reduce** (`L0-trdt-cx02` §2):
- The sharing choice is fixed: import, don't extract (`L0-trdt-addm`).
- The thrown raise needs an opt-in cause list on `raiseHit`. As read during reduce at v9, `src/storm/damage.ts:338` raises only `entityAttack`.

**Context.** Every landed hit, melee or thrown, on a living entity must add +2 HP and show exactly one lightning. That means no recursion and no double processing. Two facts constrain this:
1. **Real bolts leak side effects.** On 1.26.51.1, real `lightning_bolt`s cause fire and mob conversion even with their hurt cancelled (`xcx29`).
2. **Bonus damage can be swallowed.** A same-tick bonus after a landed hit falls inside the 10-tick hurt window (`xcx26`). The Storm Blade solved this in `src/storm/damage.ts` (modes `native | window | lethal`, diagnose-CNTR-X26).

**Decision.**
1. **Visual.** One `playStrikes` call (`src/storm/visuals.ts`, imported) per accepted hit. A copy is not allowed.
2. **+2, through the same helper as the Storm Blade passive.**
   - `raiseHit(event, damage, { causes? })` gains an optional cause list that defaults to `[entityAttack]`. The Storm Blade's behaviour is unchanged.
   - **Melee:** in `beforeEvents.entityHurt`, cause `entityAttack` with the trident in the attacker's main hand: `raiseHit(event, 2)`.
   - **Thrown:** cause `projectile` whose `damagingProjectile` carries a live `throwId`: `raiseHit(event, 2, {causes:[projectile]})`. The lethal follow-through stays an `entityAttack` from the thrower, the only cause that does not throw.
   - **Fallback if probe P10 shows no owner or no `damagingProjectile`:** the projectile deals no impact damage, and `projectileHitEntity` applies base + 2 as one scripted `entityAttack` hit through the same window/lethal path.
   - Pre-armour by default (`xasm34`).
   - One bonus per hit, keyed on (`throwId`, target id) for a thrown hit and on (attacker id, tick, target id) for melee. Keys are swept after the 10-tick window. Living targets only.
3. **No recursion by construction.** No entity deals damage, so nothing can re-trigger the bonus.

**Rejected alternatives.**
- **A real `lightning_bolt` with its hurt cancelled.** Fire and conversions still leak. C-30′ forbids that unless the client opts in.
- **`/summon lightning_bolt` plus the extinguish and conversion undone afterwards.** Not reversible for conversions (a pig → zombified piglin cannot be restored with the same entity id).
- **Applying +2 as a separate `applyDamage` after the hit.** It is swallowed by the hurt window (measured in the xcx26 diagnosis).
- **Extracting a neutral `src/legendary/bonus-damage.ts` now.** It is a larger diff for no behaviour gain. Revisit it when a third weapon needs the helper.

**Consequences.**
- A trident change can touch `src/storm/damage.ts`, so the `strm` scenarios join the trident's merge gate.
- The iPad sheet asks whether the strike still reads as lightning.
- The README reports "no lightning entity" as a stable-API-driven limitation.
