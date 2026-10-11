# Above-Water Trident

## `damage.ts` — +2 HP and one strike per landed hit (`L0-trdt-r002`, `L0-adr-twlt`, `L0-trdt-addm`, `CX-L0-29`)

Spec §02 item 1: the base damage of a melee or thrown hit is the vanilla trident's. Every successful hit on a living
entity adds 2 HP and one lightning, with no recursive lightning damage and no double processing of one throw. The
decisions and the bookkeeping are in `damage-rules.ts`, which has no engine import; `tests/trident-damage.test.mjs`
runs it under node.

`registerTridentDamage()` must run at script load. `src/main.ts` and the GameTest pack each arm their own copy.

**Melee.** `beforeEvents.entityHurt` with cause `entityAttack`, from a player holding the trident in the main hand. The
copy must not be stale and the target must be living. The handler calls `raiseHit(event, 2)`, the Storm Blade
passive's helper from `src/storm/damage.ts`. The engine's own hit grows by f(2) inside the same hurt event. The base is
9: `minecraft:damage` 8 plus 1 for the hand (probe-trident P2).

**Thrown.** A throw is any projectile carrying the dynamic property `andrew:tr.throw`, the throw's id, whatever its
entity type. Its hit is raised by the trident's own path, which covers both kinds of body:
- **A body with impact damage of its own** hits as cause `projectile`, with the body as the damaging projectile.
  `onThrownNative` raises that hit in its before-event: the event's damage becomes read + f(2). On the snowball runtime
  the hurt's damaging entity is the body itself, so the thrower is read from the body's `projectile.owner`.
- **A body without impact damage** (probe-trident P10) leaves no engine hit to raise. Here `thrownHit(target, thrower,
  throwId, at)` deals the vanilla thrown base 8 itself, as one scripted `entityAttack` from the thrower
  (`applyScriptedDamage`). It raises that hit inside its own before-event. `projectileHitEntity` calls `thrownHit`, and
  the throw code may call it directly too.

Both use `planRaise` from `src/storm/damage-rules.ts`:
- `raise`: read + f(2);
- `lethal`: the hit is left alone and an overkill `applyDamage` from the thrower follows through `system.run`, so the
  totem and the kill credit stay native;
- `kills-alone`: the hit kills by itself and nothing is added.

The comment above `thrownHit` says why this is not `raiseHit`.

**f(2).** It is `afterArmour(2, defenceOf(target))`: the bonus as a separate +2 hit would take it through the target's
armour, Protection and Resistance. This is the meaning the Storm Blade passive gives "+6 before armour".

**One per hit.** The keys are (attacker, tick, target) for melee and (throwId, target) for a throw. A throw's key is
held for 1200 ticks. A second event whose key is already held does nothing and is reported `duplicate`. Nothing the
trident does spawns an entity or deals damage of its own accord, so nothing can trigger a second bonus.

**The hurt window.** The +2 is part of the hit, so the engine's 10-tick rule judges the grown hit. A second hit within
10 ticks that is not above the last one takes 0 and gets no bonus. Because it never produces an after-event with damage
above 0, it also gets no strike.

**Strike.** `playStrikes(dimension, foot, flash, [0])` from `src/storm/visuals.ts`: a spark column onto the target's
feet, the flash and the lightning impact sound. It plays once, when `afterEvents.entityHurt` from the same attacker on
the same target arrives with damage above 0 within 2 ticks of the accepted hit. The flash is the target's head for a
melee and the hit point for a throw.

**Not living.** These get nothing: no health, the `inanimate` family (armour stand, boats, minecarts), Creative and
Spectator players, and the thrower itself.

`observeTrident(fn)` hands every hit decision and every strike to its observers.

Scenarios: `src/gametest/trident-damage.ts`. Until the throw itself exists (TRDT-THROW-01), a throw is the gametest
pack's `andrew:probe_trident_thrown`: snowball runtime, `impact_damage` 8, no `stop_on_hit`. It carries
`andrew:tr.throw` and is shot from the thrower's eye with the thrower as owner, at 3.9 blocks/tick (P7).

Measured on BDS 1.26.51.1, 2026-10-11, private copy of the checks instance:
- **Melee on a zombie in full iron** (`trident_damage_melee`). The vanilla trident's melee on the same zombie takes
  4.50 (natural armour 2 + iron 15). The Above-Water Trident takes 6.50 = 4.50 + 2, on three hits 22 ticks apart. Each
  hit gets one strike report and one impact sound.
- **In the window.** A second trident melee from another player 3 ticks after a hit takes 0.00. It reaches no
  before-event at all, so the handler saw nothing to raise. It gets no strike. A
  plain `applyDamage(2)` 6 ticks after the hit takes 0.00 and returns true.
- **A bare villager** takes 11.00 = 9 + 2 and stays a villager. There is no witch and no fire.
- **No lightning entity.** The scenarios count `lightning_bolt` entities every tick for 40 ticks after each watched
  hit: the maximum is 0.
- **Thrown on the same zombie** (`trident_damage_thrown`). A vanilla trident thrown by the player takes 3.84; so does
  a scripted `entityAttack` of 8. The stand-in body hits natively for 3.84 as cause `projectile`, and the raise makes it
  5.84 = 3.84 + 2.
  - The body raised two `projectileHitEntity` events for that one hit, as it passes through the target. The second one
    and a direct repeat for the same throw both came out `duplicate` and took 0.00.
  - A new throw 3 ticks into the window takes 0.00. `thrownHit` with no body behind it deals the scripted base: 5.84.
- **Thrown on a bare player.** The vanilla throw takes 8.00 and the stand-in body 10.00.
- **Lethal** (`trident_damage_lethal`). On both paths, a totem holder at base + 1 HP keeps their life and loses the
  totem, with one strike.
- **An armour stand** gets `not-living`: 0.00 taken and no strike. A melee on a stand reaches no hurt event at all.

The body's own damage contradicts probe-trident P10, which read no hurt from the same entity. Both kinds of body are
handled, so the throw's entity may carry impact damage or not.

### Limitations (C-16)

1. **No lightning entity is spawned.**
   - §02 asks for "одну молнию" ("exactly one lightning strike"). Each hit gets the Storm Blade's drawn strike instead:
     particles and the thunder sound.
   - The measurement behind this is `storm_active_harmless`, described in `src/storm/README.md`, `visuals.ts`,
     deviation 1. On BDS 1.26.51.1 it struck a vanilla `minecraft:lightning_bolt` beside the blade's strike, twice.
   - The pig became a zombie pigman and the villager a witch. Players burned and fire was placed. All of this happened
     even with every `lightning`, `fire` and `fireTick` hurt cancelled in `beforeEvents.entityHurt`, the only stable hook
     against a bolt's damage.
   - Stable 2.10.0 has no before-event for a mob's conversion or for a block a bolt sets on fire.
   - A bolt's own hit is also a second hurt event, so "base + 2" would no longer be exact.
   - The decision is trident-lightning (CX-L0-29, `L0-adr-twlt`). It holds until question `xq10` opts in to a real bolt.
   - The id appears in no `.ts` file of this directory (unit test). The scenarios count `lightning_bolt` entities every
     tick for 40 ticks after a hit.
2. **"+2 before armour" is f(2) on top of the vanilla hit, not one hit of base + 2.**
   - On a bare target both readings give 11.00 for a melee and 10.00 for a throw.
   - On a player in full iron the melee takes f(9) + f(2) = 5.22 + 0.88 = 6.10, where f(11) would be 6.82.
3. **Mobs' armour is invisible** (Storm deviation 1). Mobs have no `minecraft:equippable` in 2.10.0, so f(2) reads them
   as bare and the bonus is a flat 2.00. On a zombie in iron the hit is afterArmour(vanilla) + 2.
4. **A thrown hit's base is the body's, not the thrown item's.**
   - A body's impact damage, or the scripted 8, is the base. Impaling on the thrown copy adds nothing to a thrown hit.
     A melee keeps Impaling, because the engine deals that hit itself: +12.00 at Impaling V on a target in water (P2).
   - The scripted base knocks back like a melee, away from the thrower (`applyDamage` with a source), not along the
     flight.
5. **The throw code must call `thrownHit` if it removes a body without impact damage first.** `projectileHitEntity` reads
   `andrew:tr.throw` off the projectile. A body already removed when the after-event runs reads as invalid, and its hit
   gets nothing from the subscription. A call from both ways is safe: the key keeps it to one bonus. A body with impact
   damage is raised in its hurt event, before any after-event.
6. **Absorption is not readable** (Storm deviation 2). With an absorption effect the raise is always taken. A lethal
   raise on a totem holder with absorption then eats the totem.
