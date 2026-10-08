# Storm Blade

## `damage.ts` — the only place the blade deals damage (`L0-strm-rdmg`, `L0-adr-sbdm` R and C, `L0-xcx26`)

Spec §02/§05: 10 HP (active) and +6 HP (passive) **before armour**, as two separate events, never doubled and never
swallowed by the engine's 10-tick hurt window. The arithmetic is `damage-rules.ts` (no engine import, unit-tested by
`tests/storm-damage.test.mjs`); f(d) is vanilla armour + toughness + Protection, then Resistance:

    f(d) = d · (1 − min(20, max(A/5, A − d/(2 + T/4)))/25) · (1 − EPF/25) · max(0, 1 − 0.2·R)

with A = `equippable.totalArmor`, T = `totalToughness`, EPF = Protection levels on the four armour slots, R = Resistance
`amplifier + 1`. It reproduces the ten armoured hits of diagnose-CNTR-X26 and the ten Resistance rows of probe-storm P2
to 0.01.

`registerStormDamage()` must run at script load: it records every landed hit (`afterEvents.entityHurt`, damage > 0), and
a window opened before it is armed is not known. The release entry and the GameTest pack each arm their own copy.

**Passive — `raiseHit(event, 6)`**, called from the passive's own `beforeEvents.entityHurt` handler on the blade's melee
(cause `entityAttack`, damaging entity the wielder). The hit itself grows by f(6): one native hurt event, absorption
first, kill credit native. Measured: 14.00 bare, 3.80 diamond, 1.30 netherite + Protection IV, (melee + f(6))·0.6 under
Resistance II. The plan (`planRaise`):
- `raise` — `event.damage = read + f(6)`;
- `lethal` — the raise would kill: the hit is left alone and an overkill `applyDamage` follows through `system.run`
  (on BDS still in the hit's tick). A rewrite that makes the hit lethal eats a totem and still kills (probe-storm P3);
- `kills-alone` — the melee kills by itself: nothing is added.

Inside `beforeEvents.entityHurt` the target's health already reads `hp − event.damage`, so the lethal checks use the
health left.

**Active — `stormDamage(target, 10, wielder)`** (`planStrike`):
- `native` — no known window: `applyDamage(10, entityAttack, wielder)` alone is exact and lethal natively;
- `window` — `applyDamage(10)`, then the health write to `hp_before − f(10)` when the window swallowed part of it:
  10.00 bare and 3.00 diamond at k = 1, 3, 9 after a melee and after a raised melee;
- `lethal` — in a window with hp ≤ f(10): `applyDamage(hp + 1000)`, so the totem, the death message and the credit stay
  native. A health write to 0 eats the totem and the death is `override` with no source.

`applyDamage` returning `false` means a raised shield faced the wielder (< 90°, vanilla rule, CNTR-X27): nothing is
written, in or out of a window. From 90° on the hit lands with armour. `applyDamage` returning `true` proves nothing: a
swallowed hit returns it too; the reports carry the health read before and after.

`observeStorm(fn)` hands every raise and strike report to its observers.

Scenarios: `src/gametest/storm-damage.ts` (`storm_damage_passive`, `_active`, `_shield`, `_lethal`), each with its
negative controls in the same test: plain `applyDamage(6)` in the melee tick takes 0.00 and returns true; a flat +6
raise is true damage (8.24 on diamond); an unguarded window write passes a front shield; a lethal raise eats the totem;
a window write to 0 loses the credit.

### Deviations (C-16)

1. **Mobs' armour is invisible.** Mobs have no `minecraft:equippable` in 2.10.0, so f() reads them as bare (Resistance
   still counts). The passive raise and the active's window write then pass a mob's worn and natural armour: +4.44 HP
   on a husk in full diamond, +0.09 on a bare husk (natural armour 2) (probe-storm P2). The active out of a window is
   native and exact on mobs.
2. **Absorption is not readable.** With an absorption effect the passive always raises (exact, absorption first), but a
   raise that is lethal with a totem in hand then eats the totem. The active's window write goes to health past the
   absorption; in a window with hp ≤ f(10) it stays native instead of the overkill, so it never kills through
   absorption.
3. **A window opened by someone else before the blade's melee.** The raise grows the melee, and the engine compares the
   grown hit with the window's last one: where another hit stronger after armour landed within 10 ticks, the bonus is
   swallowed in part or whole with the melee.
