# Underwater Bow

Def #8 (`andrew:underwater_bow`, `src/legendary/registry.ts`). Three modules, each with its rules in a file that has no
engine import and a node test beside it:

| Module | What | Rules / tests |
|---|---|---|
| `flight.ts` | the bow's vanilla arrow keeps its air path in water and lava (C-42) | `flight-rules.ts`, `tests/ubow-flight.test.mjs` |
| `fire.ts` | 2 s of vanilla fire on a hit; `igniteSuperFire` — 5 s that water does not put out | `fire-rules.ts`, `tests/ubow-fire.test.mjs` |
| `ability.ts` | the armed charge: arm, mark the arrow, set the hit to 14, spend | `ability-rules.ts`, `tests/ubow-ability.test.mjs` |

## Input — sneak + the start of Use arms the charge (`CX-L0-33` / `xcx33`, `xasm38`)

Spec §1: "Активное умение … включение заряжает следующий УСПЕШНЫЙ выстрел". It names no input for switching it on,
and on a bow Use already *is* the draw and the shot. What ships:

- **Use while sneaking arms** the charge while the bow is ready. The draw is never cancelled, so one sneak-draw-release
  both arms and fires the armed arrow.
- **Use without sneaking is a plain shot** and never arms.
- **Already armed:** nothing happens.
- **On cooldown:** refused, and the action bar shows the seconds left at once.

Why this gesture:
- It is the trident's precedent for "one input, two behaviours" (`xcx28`, decision trident-input; the operator accepted
  the trident's sneak gesture on the iPad on 12.10).
- Sneaking is the only modifier stable 2.10.0 reads on the server (`player.isSneaking`), and it works with a finger on
  a touch screen.
- Rejected: claiming Use through `resolveActivation`, which would start the cooldown at activation and leave the bow
  unable to shoot; the draw's length, which is not readable on a touch screen; a separate item or command.

The press is read in `beforeEvents.itemUse`, with the hands and `isSneaking` read live there, before any other module's
after-handler has moved anything. A Use aimed at a block raises no `itemUse` for a custom item (CNTR-XCX14), so
`beforeEvents.playerInteractWithBlock` with the bow in hand counts too, once per player per tick. The charge enters
the module's cache in the press tick, so even a one-tick draw's arrow carries it. The world write waits for
`system.run`, because a before-event may not write.

**This is a default, not a final choice.** It holds until `xcx33` is answered. The UBOW-IPAD-01 acceptance sheet asks
Andrey about it, and he can replace it by feel. A different gesture changes `onPress` and `armDecision` only.

## The charge

- **Where it lives.** World property `andrew:ub_armed:<player id>`. It survives logout, death and a restart, and it does
  not depend on which bow is held. `L0-uwbw-earm` names a player property. A real player keeps both kinds equally
  long, but a SimulatedPlayer comes back after a restart with a new id and none of its own properties. Only a world
  ledger can be read back by the restart scenario.
- **Which arrow carries it.** The first arrow fired after arming, attributed in `entitySpawn` to an owner holding a live
  bow in the main hand. While it flies, later arrows are plain. An arrow fired before arming never carries it.
- **Not across a restart.** An armed arrow still in flight at a restart is plain afterwards. The charge itself stays.

## A successful hit (`R-uwbw-001`, `R-uwbw-003`, `L0-uwbw-phit`)

An armed arrow lands on a **living** target. That means a player or a mob — not an armour stand, boat or minecart,
not a Creative or Spectator player, and not the shooter. The hurt before-event must read damage above 0. In that
before-event, `setHit(event, 14, { causes: [projectile] })` (`src/storm/damage.ts`) sets the hit to f(14), the
post-armour value of exactly 14 before armour. It replaces the arrow's own damage, so Power and crit do not matter.
Punch still pushes. A lethal f(14) is written as 0, and an overkill `entityAttack` from the shooter follows. That way
the totem and the kill credit stay native (storm deviation 4).

The hit counts once it lands: its after-event comes with damage above 0, or it was the lethal plan. Then, in one block:
1. the charge is spent;
2. the 600-tick cooldown starts — here, never at arming;
3. one `playStrikes` is drawn: particles and a sound. There is no `minecraft:lightning_bolt`, because the vanilla one
   converts pigs and villagers and places fire even with every hurt cancelled;
4. Super Fire is lit for 5 s (`fire.ts`). The ordinary 2 s fire is weighed after it and kept off, because
   `registerUbowAbility()` runs before `registerUnderwaterBowFire()`.

Anything else is a **miss** and costs nothing — no cooldown, no spent charge:
- a block;
- a raised shield;
- an armour stand;
- the shooter;
- an arrow that despawns or leaves the loaded world;
- a hit the hurt window or a cancel swallowed.

## The two probe readings this module decides (`docs/feedback/probe-ubow.md` rows 5 and 6)

1. **Projectile Protection is counted.** The vanilla arrow on diamond with Projectile Protection IV read 0.312, which
   is f(6) × 0.2, the EPF cap. `defenceOf(target, cause)` now adds 2 EPF per Projectile Protection level when the cause
   is `projectile`, and `setHit` passes the hit's cause. Against that target the armed hit is 0.952, not the 4.76 that
   Protection alone would give. The Storm Blade reads `entityAttack` and the trident calls `defenceOf(target)`, so
   neither moves.
2. **A raised shield stops the armed arrow, and that is a miss.** `R-uwbw-001` lists the shield block as a miss. The
   engine raises no hurt event at all for it, so there is nothing to rewrite. The charge stays, and no cooldown starts.
   `projectileHitEntity` still arrives, and this module never counts it as a hit: it only settles an arrow that no
   landing claimed. The engine decides which side the shield faces from where the shooter stands, not from the
   arrow's flight. In play the two agree; they differ only for a lobbed shot around a shield.
   - The Scythe's way through a shield, cause `sonicBoom`, was not taken. It ignores armour and Protection too, which
     would break "14 before armour". Also, `applyDamage` cannot use cause `projectile` at all.

## Limitations (C-16)

- **Mobs' armour is invisible** to `defenceOf` (storm deviation 1), so a mob in worn armour takes the bare 14.
- **Absorption is not readable** (storm deviation 2). A lethal hit on an absorbing target with a totem eats the totem.
- **A target hit by something else in the last 10 ticks:** the engine weighs f(14) against that hit and may swallow
  part of it. A partly swallowed hit still landed and spends the charge.
- **A shooter who left the game before the arrow landed:** the charge is spent, but no cooldown starts, because the
  cooldown lives on the player.
- **The framework's hand rule:** with the bow on cooldown in the main hand and a ready active legendary in the off hand,
  a draw also casts the off hand. `resolveActivation` falls through to a ready off hand, and this module does not
  change it (Q-010).

## Scenarios

`src/gametest/ubow-ability.ts`. Each logs `[gametest] ubow-ability <name> ROW …` and `RESULT` lines:

| Scenario | Holds |
|---|---|
| `ubow_ability_arm` | a plain draw shoots and arms nothing; sneak + draw arms, from the air and at a block; a second arming does nothing |
| `ubow_ability_miss` | an armed arrow into a wall, a raised shield and an armour stand: charge kept, cooldown 0; then the same charge lands |
| `ubow_ability_exact` | 14.00 on a bare player, f(14) = 9.52 in full iron, 0.952 in diamond + Projectile Protection IV; cooldown 600 ticks from the hit; one strike, no `lightning_bolt`, Super Fire lit; an unarmed hit stays vanilla |
| `ubow_ability_mob` | an iron golem loses 14.00; a pig the armed hit would kill dies of the overkill, credited to the shooter, and the charge is spent |
| `ubow_ability_hud` | ready, armed, cooldown, resolved through both shipped lang files: three different lines in each; arming during the cooldown is refused |
| `ubow_ability_restart_seed` / `_check` | a charge armed by the gesture is still read as armed by the module after a server restart |
