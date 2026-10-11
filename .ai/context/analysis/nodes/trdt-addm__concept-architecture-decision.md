---
type: "concept-architecture-decision"
node_id: "L0-trdt-addm"
source_channel: "rollout"
analysis_version: 9
title: "ADR-trdt-addm · Sharing the Storm Blade helper for the +2 and the strike"
aliases: ["L0-trdt-addm"]
is_a: ["architecture-decision"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 2761
tags: ["above-water-trident", "damage", "shared-helper", "status:proposed"]
level: 2
---
# ADR-trdt-addm · Sharing the Storm Blade helper for the +2 and the strike

**Links.** is_a: architecture-decision. relates_to: L0-adr-twlt, L0-xasm34, L0-xcx26, L0-strm, L0-trdt-r002, L0-trdt-cx02.

**Context.**
- `L0-adr-twlt` forbids a copy. The helper must be imported or extracted.
- In `src/storm/damage.ts`, `raiseHit(event, damage)` returns `plan: none` for any cause other than `entityAttack`. A thrown hit arrives as `projectile`, so the helper cannot raise it as written.
- Project measurements: an `applyDamage` with cause `projectile` throws, with or without a `damagingEntity`. A same-tick separate bonus is swallowed by the hurt window. A before-event rewrite to a lethal value eats the totem.

**Decision.**
1. **Import, don't move.**
   - `src/trident/` imports `raiseHit`, `registerStormDamage` and `observeStorm` from `src/storm/damage.ts`, and `playStrikes` from `src/storm/visuals.ts`.
   - `raiseHit` gains an optional third argument, `{ causes?: EntityDamageCause[] }`, defaulting to `[entityAttack]`, so Storm Blade behaviour is unchanged.
   - The trident passes `[entityAttack]` for melee and `[projectile]` for thrown hits.
   - The lethal follow-through keeps `entityAttack` and the thrower as the source, the only cause that does not throw.
2. **Melee.** In `beforeEvents.entityHurt`, when the cause is `entityAttack` and the damaging entity's main hand `isItemOf(TRIDENT)`: `raiseHit(event, 2)`.
3. **Thrown.**
   - The projectile's native `impact_damage` equals the measured vanilla thrown value, and its owner is the thrower.
   - In `beforeEvents.entityHurt`, when `damageSource.damagingProjectile` carries the `throwId` of a live custody record: `raiseHit(event, 2, {causes:[projectile]})`.
   - Fallback if the probe shows no owner or no `damagingProjectile`: the projectile has no impact damage, and `projectileHitEntity` applies base + 2 as one scripted `entityAttack` hit with the thrower as the source (through the `stormDamage` window/lethal path).
4. **Strike.** One `playStrikes(dim, foot, flash, [0])` per accepted hit.
   - The idempotency key is (`throwId`, target id) for a thrown hit, and (attacker id, `system.currentTick`, target id) for melee.
   - Keys are held for the 10-tick window and then swept.
   - Living targets only: a health component, and not an armour stand, item frame, boat or minecart.
5. **The `strm` scenarios join the trident merge gate.**

**Rejected alternatives.**
- **Extracting a neutral `src/legendary/bonus-damage.ts` now.** It is a larger diff through the Storm Blade's imports and README for no behavioural gain. Revisit when a third weapon needs it.
- **A trident-local copy.** Forbidden by `adr-twlt`.
- **Applying +2 in the after-event.** Swallowed by the hurt window (`xcx26`).
