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

## `active.ts` — the Use (`L0-strm-pact`, `L0-strm-rcd`, `L0-xasm31`)

`registerStormActive()` arms the input and the damage helper's record. `src/main.ts` and the GameTest pack each arm
their own copy, after every other legendary's input. Everything up to the cooldown runs in the press tick:
1. press: `itemUse` (air) or `itemStartUseOn` (a block), a legendary in the main hand, one per player per tick;
2. hand: `resolveActivation` is read in the press's before-event and again now; the blade fires only if both name it
   (deviation 6);
3. validity: alive, not Spectator, the eye's chunk loaded — otherwise a refusal that writes nothing;
4. line: `planLine` (`trace.ts`);
5. target: `pick` (`trace.ts`);
6. `stormDamage(target, 10, wielder)` — the only damage the active deals;
7. `startCooldown` on every valid release: a hit, a miss into air, a wall at half a block;
8. the line and, on a hit, three strikes, queued on `visuals.ts` with coordinates copied now.

`observeReleases` hands every press the blade owned (a release or a refusal) to its observers, after the cooldown.
A press on cooldown is not the blade's: nothing is observed, written or drawn, and the HUD keeps counting.

## `trace.ts` — the line and its one target (`L0-strm-adtr` A)

Engine types only; `tests/storm-active.test.mjs` runs it on a fake block reader that keeps the cell-step budget.
- **The line** is the Katana's own `trace` from `src/katana/plan.ts`, exported with a `range` (default 20, so the
  Katana is unchanged) and called with 10: the cell-step budget, part-blocks caught on exit, unreadable chunks. The
  line ends on the hit face (the Katana pulls its endpoint 0.3 back; the blade does not), at 10.0 Euclidean, or 0.05
  short of an unloaded cell. Grass, flowers, torches, cobweb, carpet and liquids do not stop it.
- **The target** is the nearest hit of `getEntitiesFromRay(head, dir, { maxDistance: stop, ignoreBlockCollision:
  true })` that is alive, not the wielder, not a Creative or Spectator player and not `inanimate`. Without
  `ignoreBlockCollision` the entity ray stops at grass and torches the line passes; with `maxDistance: 10` alone it
  passes diagonal walls (probe-storm P5).

## `visuals.ts` — spectacle that never acts (`L0-strm-rvis`, `L0-adr-sblt` A, C-30)

- **Line:** an `electric_spark_particle` every 0.5 block from just past the eye to the end, a `wind_explosion_emitter`
  on every second point. Drawn once, one tick after the release.
- **Strike:** a zigzag spark column from 6 blocks above the target's feet down to them, a
  `huge_explosion_lab_misc_emitter` flash where the line entered the target, and `ambient.weather.lightning.impact`.
  The active plays three, at +1, +3 and +5 ticks. `playStrikes(dimension, foot, flash, delays)` is the passive's way in.
- The ids are probe-storm P1's, pinned by a unit test to the vanilla list of 1.26.50.4: the server cannot tell a
  real particle id from a made-up one. Whether they read as lightning is the iPad's call.
- One `system.runInterval(…, 1)` serves every release and exists only while a burst is queued; it is cleared after
  the last strike. No `runJob`, no entity, no block write, no damage.

Measured on BDS 1.26.51.1 (`src/gametest/storm-active.ts`):
- the cap: a target 9.5 out is hit and one 10.5 out is not, on the axis and on the xz diagonal; the line is 10.00 both
  ways;
- walls: a wall 4.5 out ends the line at 4.50 and the target behind it is untouched. A stepped wall across the
  diagonal ends it at 7.78. There a `maxDistance: 10` block ray meets nothing, and the plain entity ray hits the
  player behind the wall at 9.43;
- grass on dirt, a torch and cobweb at head height: the target 6 out is hit. The plain entity ray sees nothing;
- one target: a second player 2 behind the first is untouched, also when the first is a 5-HP villager the hit kills;
- harmless: with the blade, the pig, the villager and a player beside the line take no hurt and move 0.000. No fire,
  no block change, no new entity;
- cooldown: 29 999–30 000 ms left after a hit, a miss and a wall at 0.50. On cooldown a press writes nothing, also 3 s
  before the deadline. Past the deadline it fires again;
- refusals write nothing: Spectator, a stale copy, a blade in neither hand, a dead wielder. These four go through
  `activate()` called directly, not a press; with `keepInventory` the blade stays in the dead hand and is refused as
  `dead`;
- two releases in one tick start one interval, which runs 5 ticks and stops.

### Deviations (C-16)

1. **The three lightning strikes are drawn with particles; no vanilla lightning entity is spawned.** Spec §02 says
   "три визуальных удара молнии"; §05 allows particles where vanilla lightning cannot be purely visual.
   - The proof is `storm_active_harmless`. In the same layout and run as the blade, it strikes a vanilla bolt at the
     blade's strike point, twice.
   - Plain bolt: the pig turns into a zombie pigman and the villager into a witch. The bystander player takes 5.00
     `lightning` and burns (`fireTick`). Fire appears on three cells of the oak floor.
   - Second bolt, with every `lightning`, `fire` and `fireTick` hurt cancelled in `beforeEvents.entityHurt` — the
     only stable hook against a bolt's damage in 2.10.0 (75 and 92 hurts cancelled in two runs). The bolt's own damage
     is gone, yet the pig and the villager are still converted, both players still burn and fire is still placed.
   - Stable 2.10.0 has no before-event for a mob's conversion or for a block a bolt sets on fire, so a vanilla bolt
     cannot be made harmless.
   - The id appears nowhere in this directory (unit test).
2. **The beam's hit knocks the target back like a sword hit; the strikes add none** (`L0-adr-sbkb`, probe-storm P4).
   - `applyDamage(…, entityAttack, wielder)` carries the source's knockback. Measured: the target moved 1.67
     horizontally (P4: 1.79).
   - The bystanders around the strikes moved 0.000.
3. **Strikes play only on a hit.** §02 places them "в точке попадания". A miss or a wall draws the line alone.
4. **Not targets:** Creative and Spectator players, which the damage helper cannot hurt either, and `inanimate`
   entities. An armour stand has health 6 (P5 F). The line passes through all of them to the next living entity.
5. **A block ray that throws is a refusal.** `L0-strm-rcd` §2 does not list it. Where the solid lies is unknown, so
   nothing is drawn and no cooldown is spent (the Katana refuses its jump the same way).
6. **The press belongs to the hands as they were at the press.**
   - `L0-strm-pact` step 1 resolves the hands in the after-event. Every other legendary resolves them there too, and
     its handler runs first.
   - Measured: with a ready Katana in the main hand and the blade in the off hand, the Katana jumped and spent its
     cooldown. A live reading after its handler then named the off-hand blade.
   - So the blade also reads the hands in the press's before-event, and fires only when that reading names it too:
     one press, one ability.
   - The other legendaries still read live. Registering the blade last keeps its own main-hand release from handing
     their off hand the same press.

### The item's melee

`minecraft:damage` 7, not 8. A custom item's damage value adds to the hand's base 1. In one row of
`storm_active_hands_and_melee`, the value 8 landed 9.00 against the vanilla diamond sword's 8.00, and the Katana's 7
landed 8.00. §02 asks for the Diamond Sword's hit.

## `passive.ts` — 30 % per landed hit, +6 before armour, one strike (`L0-strm-ppas`, spec §02)

`registerStormPassive()` subscribes `beforeEvents.entityHurt`. A hit rolls once when it is an `entityAttack` by a
player whose **main hand** holds a live `andrew:storm_blade`, on a target with health that is not `inanimate`. The
decision is `passive-rules.ts` (`decidePassive`, no engine import, `tests/storm-passive.test.mjs`): a skip draws nothing
from the source, an eligible hit draws exactly one number, `roll < 0.30` procs, nothing is kept between hits.
`setStormRng(fn)` replaces `Math.random`.

- **Proc:** `raiseHit(event, 6)`, then one strike via `system.run`, queued on `visuals.ts` (`drawStrike`); plans
  `kills-alone` and `none` draw none.
- **Miss:** the hit is left alone. The blade's `minecraft:damage` is 7: a custom item hits for its value + 1, so it
  hits like the diamond sword (8.00 bare, 2.24 in diamond; at 8 it hit 9.00 / 2.61).
- **No timer:** nothing here reads or writes the `sb` cooldown or busy keys.
- **Never on a scripted hit:** the before-event runs inside `applyDamage`, where the pack's own `entityAttack` from a
  player reads like that player's swing. Every such call goes through `src/legendary/scripted-damage.ts`
  (`applyScriptedDamage`), and the passive skips while `isScriptedDamage()`. Unmarked, the active's 10 became 16, and a
  Scythe volley from a caster holding the blade killed a target at 8 HP on its first hit through a lethal-plan
  overkill.

`observePassive(fn)` hands every roll to its observers; `setStrikeVisual(fn)` replaces the strike.

Scenarios `src/gametest/storm-passive.ts`: `storm_passive_damage` (sword reference, forced proc and miss, the naive
`applyDamage(6)` control, the active with the blade in hand, off hand, stale copy, harmless strikes),
`storm_passive_cooldown` (deadline the same number, a ready blade stays ready), `storm_passive_rate` (probe-storm P6:
N = 3 700 landed hits from 12 wielders, half on cooldown, share in [27.5 %; 32.5 %], every roll one landed hit, every
miss the sword's hit and every proc the sword's hit + f(6)), `storm_passive_scripted` (Scythe volleys, inanimate).

The rate scenario also logs the uniformity of the passive's own draws beside a tight loop (`RATE ROW draws`). Three
samples gave 0.2838, 0.2822 and 0.2973 (pooled 0.2877, z = −2.8); the third logged the callback draws uniform (χ² 7.37
over ten bins, 9 df) and the loop at 0.2991. A share that falls out low again is read from those rows first.

### Deviations (C-16), passive

4. **The strike is the active's, drawn with particles** (deviation 1 of the active): `drawStrike` is
   `playStrikes(dimension, feet, feet, [0])`, one zigzag spark column from 6 blocks above the target's feet with the
   flash at the feet (a melee has no line, so no entry point) and `ambient.weather.lightning.impact`. The shared
   interval draws it on its next step; `passive.ts` draws nothing itself (`storm_passive_damage` counts one impact
   sound per forced proc from that interval).
5. **The `inanimate` filter is unproven on BDS.** An armour stand takes neither a melee nor a scripted `entityAttack`
   into the hurt events at all (0 before-events, 0 hurts): nothing reached the filter. It stays for an inanimate that
   does (probe-storm P5: "health" alone does not exclude the stand).
