---
title: Glossary
type: project-knowledge
generated_at: "2026-10-05T17:12:56.124Z"
source_channel: rollout
node_id: rollout-glossary
aliases: ["rollout-glossary","glossary","project-knowledge/glossary"]
is_a: ["rollout","glossary"]
relates_to: ["L0-lgnd-ac01","L0-lgnd-ac02","L0-lgnd-ac03","L0-lgnd-ac04","L0-lgnd-ac05","L0-lgnd-ac06","L0-lgnd-ac07","L0-lgnd-ac08","L0-lgnd-ac09","L0-lgnd-ac10","L0-lgnd-ac11","L0-lgnd-ac12","L0-lgnd-ac13","L0-lgnd-ac14","L0-lgnd-ac15","L0-lgnd-ac16","L0-lgnd-ac17","L0-lgnd-ac18","L0-lgnd-ac19","L0-lgnd-ac20","L0-lgnd-ac21","L0-lgnd-ac22","L0-lgnd-ac23","L0-lgnd-ac24","L0-lgnd-ac25","L0-lgnd-ac26","L0-lgnd-ac27","L0-lgnd-gl01","L0-lgnd-gl02","L0-lgnd-gl03","L0-lgnd-gl04","L0-lgnd-gl05","L0-lgnd-gl06","L0-lgnd-gl07","L0-lgnd-gl08","L0-lgnd-gl09","L0-lgnd-gl10","L0-lgnd-gl11","L0-lgnd-gl12","L0-lgnd-gl13","L0-lgnd-gl14","L0-lgnd-gl15","L0-lgnd-gl16","L0-lgnd-gl17","L0-lgnd-gl18","L0-lgnd-gl19","L0-lgnd-gl20","L0-lgnd-gl21","L0-sclk-ac01","L0-sclk-ac02","L0-sclk-ac03","L0-sclk-ac04","L0-sclk-ac05","L0-sclk-ac06","L0-sclk-ac07","L0-sclk-ac08","L0-sclk-ac09","L0-sclk-ac10","L0-sclk-ac11","L0-sclk-ac12","L0-sclk-ac13","L0-sclk-ac14","L0-sclk-ac15","L0-sclk-ac16","L0-sclk-ac17","L0-sclk-ac18","L0-sclk-ac19","L0-sclk-ac20","L0-sclk-ac21","L0-sclk-ac22","L0-sclk-ac23","L0-sclk-ac24","L0-sclk-ac25","L0-sclk-ac26","L0-sclk-ac27","L0-sclk-gl01","L0-sclk-gl02","L0-sclk-gl03","L0-sclk-gl04","L0-sclk-gl05","L0-sclk-gl06"]
priority: 610
---

# Glossary

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Lgnd ac01 concept acceptance criterion (L0-lgnd-ac01)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r006", "L0-lgnd-cx07", "L0-adr-wpn2", "L0-lgnd-ad08"]
---
**AC-lgnd-01: An upgrade keeps the craft flags, the pending token and the marks.** Channel: `bds`.

The cooldown clause was dropped by the `wpn2` ruling on `cx07`.

GIVEN a world saved by the pre-v3 build where:
- the Web Sword and the Scythe were Survival-crafted;
- player Q has a single-object `ws_pending`;
- a marked sword and a marked Scythe carry no `_gen` and no `_holder`

WHEN the server restarts on the v3 build
THEN crafting either weapon in Survival (a token arrives) is refunded with its `craft_blocked` message and no broadcast,
AND Q receives exactly one sword on the next spawn,
AND both pre-v3 stacks cast, are retained on death and return to their `owner` after a Void loss (no holder recorded yet),
AND once the pre-v3 sword enters a player's inventory, it carries `_holder` = that player,
AND the Orbital Cannon flag is unset.


- **node**: L0-lgnd-ac01

### Lgnd ac02 concept acceptance criterion (L0-lgnd-ac02)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r002", "L0-lgnd-r014", "L0-lgnd-ac17"]
---
**AC-lgnd-02: Craft budgets are independent per weapon.** Channel: `bds`.

GIVEN the Web Sword flag is claimed and the Scythe and Cannon flags are unset
WHEN a Survival player crafts the Scythe
THEN the craft succeeds, and exactly one broadcast names the crafter and the Scythe,
AND the Scythe flag is set,
AND a second Survival Scythe craft (by any player, also after a restart) is refunded with 2 golden apples, 2 obsidian and 1 diamond hoe,
AND `/andrew:scythe reset` leaves the Web Sword flag set. The as-built command is per weapon; there is no `/andrew:legendary` (`ad07`).
AND the Cannon flag stays unset throughout.


- **node**: L0-lgnd-ac02

### Lgnd ac03 concept acceptance criterion (L0-lgnd-ac03)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r003"]
---
**AC-lgnd-03: Cooldowns do not bleed between weapons.** Channel: `build` (unit, stubbed clock) + `bds`.

GIVEN player P with both abilities ready
WHEN `start(P, "web_sword")` is called
THEN `isReady(P, "web_sword")` is false for 30 000 ms (± 50 ms),
AND `isReady(P, "scythe_of_calamity")` stays true throughout,
AND for another player R, both stay ready.


- **node**: L0-lgnd-ac03

### Lgnd ac04 concept acceptance criterion (L0-lgnd-ac04)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r004"]
---
**AC-lgnd-04: A ready main hand wins, even when it refuses.** Channel: `bds`.

GIVEN P holds the Scythe in the main hand and the Web Sword in the off hand, both ready, and no player is within 20 blocks
WHEN P presses Use
THEN only the Scythe ability runs:
- the "no player here" message is shown,
- no cobweb is placed,
- neither cooldown starts.


- **node**: L0-lgnd-ac04

### Lgnd ac05 concept acceptance criterion (L0-lgnd-ac05)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r004", "L0-lgnd-r009"]
---
**AC-lgnd-05: The off hand fires when the main hand is cooling or busy.** Channel: `bds`.

GIVEN P holds the Scythe in the main hand, cooling or busy with a volley, and a ready Web Sword in the off hand, aimed at a valid trap target
WHEN P presses Use
THEN the Web Sword trap is placed and the Web Sword cooldown starts,
AND the Scythe cooldown and busy state are unchanged.

Also:
- If neither weapon is ready, the same press does nothing, sends no message and changes no state.
- With an empty main hand and a ready Web Sword in the off hand, Use does nothing.


- **node**: L0-lgnd-ac05

### Lgnd ac06 concept acceptance criterion (L0-lgnd-ac06)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r007", "L0-lgnd-p005", "L0-lgnd-ad07", "L0-lgnd-cx08"]
---
**AC-lgnd-06: Two-hand Action Bar, three weapons.** Channel: `build` (stubbed HUD test) + `ipad` (visual; needs `allow_off_hand`, `cx08`).

GIVEN P holds a ready Orbital Cannon in the main hand and a Web Sword with 12 s left in the off hand
WHEN the HUD renders
THEN P's bar shows "Orbital Cannon — Ready" and then "Web Sword — 12s", in P's client language, using `andrew.legendary.ready` / `andrew.legendary.cooldown`,
AND "Ready" stays on while the item is held (continuous, decision-legendary-ready-hud),
AND a player holding no legendary receives no `setActionBar` call.

This replaces the v1 clause "Web Sword-only rawtext equals 0.3.0", which the continuous-Ready decision retired.


- **node**: L0-lgnd-ac06

### Lgnd ac07 concept acceptance criterion (L0-lgnd-ac07)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r008", "L0-lgnd-cx10", "L0-adr-wpn2"]
---
**AC-lgnd-07: Death returns one marked copy of each weapon, including the off-hand one, exactly once.** Channel: `bds` + `ipad` (off hand).

This is narrowed by the `wpn2` ruling on `cx10` (b).

GIVEN P carries a marked Web Sword in the **off hand**, a marked Scythe in the hotbar and a marked Orbital Cannon in the inventory
WHEN P dies (also in the Void), respawns, disconnects and reconnects, and the server restarts
THEN P holds exactly those three instances (same ids, same `gen`),
AND no item entity of any of them is left at the death spot,
AND no fourth copy exists.

A second marked copy of the same weapon is outside this AC (a known limit).


- **node**: L0-lgnd-ac07

### Lgnd ac08 concept acceptance criterion (L0-lgnd-ac08)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r011", "L0-lgnd-ad11", "L0-lgnd-ent4"]
---
**AC-lgnd-08: Void return to the last holder, exactly once.** Channel: `bds`.

GIVEN P last held a marked Orbital Cannon (gen g) and drops it into the Void
WHEN the item entity falls below the dimension's minimum height
THEN P receives it with the same id, gen g + 1 and `holder` = P, plus a private `andrew.legendary.recovered` message,
AND the Cannon craft flag is unchanged.

If P is offline:
- the entry sits in `andrew:oc_owed[P]`;
- it survives a restart;
- it is redeemed exactly once on P's next join.

Two different instances owed to P while P is offline are **both** redeemed (list, not map).

The same holds for the Web Sword and the Scythe.


- **node**: L0-lgnd-ac08

### Lgnd ac09 concept acceptance criterion (L0-lgnd-ac09)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r012", "L0-lgnd-as11"]
---
**AC-lgnd-09: Vanilla item-entity destruction returns the instance; a pickup does not.** Channel: `bds`.

GIVEN a marked legendary item entity (any of the three) last held by P
WHEN it is destroyed by cactus or a **vanilla** TNT explosion, or despawns (in lava or fire it stays where it lies, same gen, nothing owed)
THEN P receives it back per `ac08`,
AND an ordinary pickup of the entity by any player triggers **no** return and no gen bump, and that player becomes `holder`,
AND an unmarked (Creative or vanilla `/give`) copy is destroyed as in vanilla (`as11`).

Destruction by the Orbital Cannon is not covered here, because the item must not be destroyed at all (`ac19`).


- **node**: L0-lgnd-ac09

### Lgnd ac10 concept acceptance criterion (L0-lgnd-ac10)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r005"]
---
**AC-lgnd-10: A stale-generation copy is voided.** Channel: `bds`.

GIVEN an instance whose generation was bumped by a return while the original stack survived (for example collected by a hopper into a chest)
WHEN any player moves the stale stack into their inventory
THEN it is deleted in the handling of that event and the player gets a `voided` message,
AND during that window it could neither cast nor be retained on death,
AND the live copy is unaffected.


- **node**: L0-lgnd-ac10

### Lgnd ac11 concept acceptance criterion (L0-lgnd-ac11)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad07", "L0-lgnd-ad08", "L0-adr-lgnd"]
---
**AC-lgnd-11: Regression gate for the v3 framework change.** Channel: `build` + `bds`.

GIVEN the v3 build
WHEN `npm test`, `bds:check` and `bds:gametest` run
THEN every existing test passes **without edits to its assertions**:
- `tests/web-sword-*.test.mjs`;
- the `andrew:websword_*` and Scythe GameTests;
- the pickaxe and autosmelt suites.

Harness changes are allowed (`L0-adr-lgnd`, cx04 reading), for example a simulated craft now inserting the craft token.

AND `grep -rnE "andrew:(ws|sc|oc)_|andrew:(cd|busy)_|andrew:hidden_until" src/` matches only files in `src/legendary/`,
AND `/andrew:websword`, `/andrew:scythe` and `/andrew:orbital` `give|reset` all work,
AND a node test asserts that `itemId`, `keyPrefix`, `abilityKey`, `command` and `craftTokenId` are unique across `LEGENDARIES`.


- **node**: L0-lgnd-ac11

### Lgnd ac12 concept acceptance criterion (L0-lgnd-ac12)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad03", "L0-lgnd-r007"]
---
**AC-lgnd-12: No standing watcher when nothing is watched.** Channel: `bds`.

GIVEN no marked legendary item entity exists in any loaded dimension and no volley is alive
WHEN the server runs for 60 s
THEN only the HUD interval is registered.

The loss-watcher interval starts on the first watched `entitySpawn` and is cleared when the last watched entity is gone. This is checked via debug log lines in `bds:check`.


- **node**: L0-lgnd-ac12

### Lgnd ac13 concept acceptance criterion (L0-lgnd-ac13)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r009", "L0-lgnd-ad07", "L0-scyt"]
---
**AC-lgnd-13: Busy blocks re-use, expires by deadline, and hands off to cooldown without a gap.** Channel: `build` (unit) + `bds`.

This is rewritten to the as-built durable busy deadline (`ad07` §2).

GIVEN `setBusy(P, "scythe_of_calamity", ms)`
THEN `isReady` is false, and a Use press with the Scythe in the main hand does not call its ability. The HUD keeps showing the Scythe line; there is no `active` segment.

WHEN `clearBusy` and `startCooldown` are called in the same turn
THEN no tick observes `isReady == true`.

WHEN `clearBusy` is called alone
THEN the ability is ready at once.

AND after a server restart with busy set, the ability becomes ready no later than the stored deadline.

AND the Orbital Cannon never sets busy.


- **node**: L0-lgnd-ac13

### Lgnd ac14 concept acceptance criterion (L0-lgnd-ac14)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r010", "L0-stgt", "L0-sqat"]
---
**AC-lgnd-14: `isHiddenFromTargeting` contract.** Channel: `build` + `bds`.

GIVEN player T with no `andrew:hidden_until`
THEN `isHiddenFromTargeting(T)` is false.

WHEN `/andrew:hide 10 T` (or GameTest) sets it to now + 10 s
THEN it is true.

- After 10 s → false.
- After a server restart within the window → still true.
- A non-number value → false, with no throw.


- **node**: L0-lgnd-ac14

### Lgnd ac15 concept acceptance criterion (L0-lgnd-ac15)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r014", "L0-lgnd-ad08", "L0-xcx9", "L0-lgnd-as13"]
---
**AC-lgnd-15: `/give` and Creative copies never touch the craft flag (Orbital AC-2, all three weapons).** Channel: `bds` + `ipad` (crafting preview).

GIVEN a fresh world with every flag unset and Survival player S
WHEN the console runs `/give S andrew:orbital_cannon`, `/give S andrew:web_sword` and `/give S andrew:scythe_of_calamity`,
AND Creative player C takes a Cannon from the Creative inventory and drops it to S
THEN S holds four **unmarked** stacks, and no flag is set, no broadcast is sent and nothing is refunded,
AND S's first Survival Cannon craft afterwards claims the flag, sends exactly one broadcast and yields a stack marked `origin: craft` with `holder` = S,
AND a Cannon crafted by C in Creative is unmarked, and the flag stays as it was.

On the iPad, the crafting-table preview shows the Orbital Cannon icon and name. The token id is never visible in the inventory after the next tick.


- **node**: L0-lgnd-ac15

### Lgnd ac16 concept acceptance criterion (L0-lgnd-ac16)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r015", "L0-lgnd-ad09", "L0-lgnd-p009", "L0-lgnd-as14"]
---
**AC-lgnd-16: Attack and Use resolve through one function and share one cooldown.** Channel: `build` (unit, stubbed hands and clock) + `bds`.

GIVEN P with a ready Cannon in the main hand
THEN `resolveActivation(P, "attack")` and `resolveActivation(P, "use")` both return the Cannon.

WHEN one mode activates (charges spawn)
THEN in the same tick both modes return `undefined` for 30 000 ms (± 50 ms),
AND a second Cannon copy in P's hotbar is also blocked,
AND another player R's Cannon stays ready.

GIVEN P holds a Web Sword in the main hand and a ready Cannon in the off hand
THEN `resolveActivation(P, "attack")` is `undefined`,
AND `resolveActivation(P, "use")` returns the Cannon only while the Web Sword is cooling.

GIVEN no block within 10
WHEN P presses either mode
THEN no cooldown is written and no message or sound is played.

The existing Web Sword and Scythe callers (no `mode` argument) behave as before.


- **node**: L0-lgnd-ac16

### Lgnd ac17 concept acceptance criterion (L0-lgnd-ac17)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent1", "L0-lgnd-p001", "L0-lgnd-r002", "L0-adr-orbc"]
---
**AC-lgnd-17: The Orbital Cannon is a registered legendary with its own craft budget and refund (Orbital AC-1).** Channel: `build` + `bds`.

GIVEN `LEGENDARIES` contains `ORBITAL_CANNON` (`oc`, `orbital_cannon`, 600 ticks, `andrew:orbital`)
WHEN Survival player A crafts the Cannon
THEN one localized broadcast names A and "Orbital Cannon", and `andrew:oc_crafted` is set,
AND after a server restart, player B's Survival craft is refunded with exactly 4 TNT + 1 Fishing Rod, sends `andrew.orbital.craft_blocked`, and removes the result,
AND the Web Sword and Scythe flags are unchanged,
AND `/andrew:orbital reset` clears only `oc_crafted`,
AND `/andrew:orbital give B` yields an `origin: admin` stack without touching the flag.


- **node**: L0-lgnd-ac17

### Lgnd ac18 concept acceptance criterion (L0-lgnd-ac18)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad11", "L0-lgnd-ent2", "L0-adr-hold", "L0-xcx11"]
---
**AC-lgnd-18: A transferred legendary returns to the last holder, not to the crafter.** Channel: `bds`.

GIVEN A crafted the Scythe and hands it to B (drop and pickup, or through a chest)
THEN the stack's `holder` is B, and `owner` is still A.

WHEN B drops it into the Void or lava
THEN B receives it (`gen + 1`), and A receives nothing and no message.

WHEN B is offline at that moment
THEN `andrew:sc_owed[B]` holds it, and B gets it on the next join.

GIVEN the Scythe sits in a chest that A placed it in, and A dies
THEN nothing happens to it.

WHEN it passes through a hopper into another chest
THEN `holder` stays A: a container never becomes the holder.

`L0-adr-hold` was accepted by `decision-resolve-l0-xcx11` (2026-09-29); this AC is unbuilt work, filed as `LGND-HOLD` (`L0-adr-hldb`).


- **node**: L0-lgnd-ac18

### Lgnd ac19 concept acceptance criterion (L0-lgnd-ac19)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p008", "L0-lgnd-r012", "L0-lgnd-r013", "L0-pntr", "L0-ring"]
---
**AC-lgnd-19: The Orbital Cannon never destroys a legendary.** Channel: `bds` (GameTest `orbital:protect_*`).

GIVEN a chest holding a marked Scythe inside the LMB column,
AND a marked Web Sword item entity on the ground inside an RMB blast AABB,
AND a stone block holding nothing, for control
WHEN the Cannon fires LMB, and separately RMB
THEN the chest is gone and its ordinary contents are gone,
AND the Scythe exists as an item entity outside the column footprint, on solid ground, with the same id and gen and no `returned` message,
AND the Web Sword survives the RMB, moved outside the AABB, with the same id and gen,
AND RMB drop suppression removed no legendary,
AND neither owed list changed.

Negative check: a test effect that removes the chest **without** calling `protectLegendariesIn` makes this test fail. That proves the check sees the difference.

In the End, with no support within 16 blocks: the item goes to its holder, the gen is unchanged, and the log line says `handedBack=1`.


- **node**: L0-lgnd-ac19

### Lgnd ac20 concept acceptance criterion (L0-lgnd-ac20)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r013", "L0-lgnd-r012", "L0-lgnd-cx12"]
---
**AC-lgnd-20: A vanilla container destruction spills the legendary and never loses it.** Channel: `bds`.

GIVEN a barrel holding a marked Orbital Cannon last held by P
WHEN a Survival player breaks the barrel
THEN the Cannon lies on the ground as an item entity and is watched.

WHEN instead primed vanilla TNT destroys the barrel
THEN the Cannon ends up either on the ground or back with P (`gen + 1`, `returned` message), and **never** both or neither,
AND a count over the world (every player inventory plus item entities near the spot) finds exactly one live Cannon.

A Cannon inside a **shulker-box item** is outside this AC (`cx12`).


- **node**: L0-lgnd-ac20

### Lgnd ac21 concept acceptance criterion (L0-lgnd-ac21)

**AC-lgnd-21 (v7): Legendary weapons are pulled, tokens are not, and no instance is lost or duplicated (operator tuning 1.6.0).** Channel: `build` (node unit test) + `bds` (GameTest `ufo_magnet_legendaries` and `ufo_magnet_hold*`).

Related: L0-lgnd-r016, L0-magn, L0-lgnd-ac22.

**Predicate.** `isMagneticStack` is true for every def's `itemId` (all five once def #5 lands), marked, unmarked or stale. It is false for every `_crafted` token, for `undefined` and for an empty slot.

GIVEN a magnet zone with iron candidates and:
- a marked Scythe on the ground;
- a hopper **block** holding only a marked Orbital Cannon;
- a craft token item entity on the ground;
- a Survival player holding a marked Katana and no iron
WHEN the magnet runs and releases
THEN the Scythe was selected as a ground candidate,
AND the hopper block is still in place, holding the Cannon (a non-empty hopper is a container),
AND the token was never selected,
AND the player was lifted,
AND after release the world holds exactly one live copy of each marked instance, every gen is unchanged, and no owed list changed.

Negative control: `isLegendaryWeapon` stubbed to `false` makes the "Scythe selected" and "player lifted" clauses fail.

The pre-1.6.0 "never within 6 blocks of the hover column" clause is retired.


- **node**: L0-lgnd-ac21

### Lgnd ac22 concept acceptance criterion (L0-lgnd-ac22)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p002", "L0-lgnd-r008", "L0-lgnd-ac07", "L0-lgnd-r016", "L0-magn", "L0-lgnd-as16"]
---
**AC-lgnd-22: Dying from a magnet fall keeps every held legendary.** Channel: `bds` (GameTest).

UFO §6 makes a fall from the hover height lethal (U2: 33 damage from 37 blocks). Retention is cause-agnostic: `entityDie` path B (`retention.ts:74-152`) does not read the damage source. This AC pins that down for the magnet.

GIVEN Survival player P holds an iron ingot in the main hand, a marked Web Sword in the off hand, and a marked Scythe and a marked Orbital Cannon in the hotbar
WHEN the magnet lifts P to the hold point, the magnet releases, and P dies from the fall
THEN on respawn P holds exactly those three instances (same ids, same gen; the Web Sword is in the inventory or off hand),
AND no item entity of any of them exists at the landing spot, or in the saucer's cloud after the death,
AND the iron ingot dropped as a vanilla death drop,
AND no owed entry and no `returned` message was produced.

Variant: the same after `/andrew:ufo stop` mid-hold, and after a server restart between death and respawn.


- **node**: L0-lgnd-ac22

### Lgnd ac23 concept acceptance criterion (L0-lgnd-ac23)

**AC-lgnd-23: The Dragon Katana is def #4, with its own craft budget (Katana T01–T03, framework side).** Channel: `build` + `bds`. Shipped in 1.5.0 (`KATA-LGND-01-AA`).

Related: L0-lgnd-ad14, L0-lgnd-ac02, L0-lgnd-ac15, L0-lgnd-ac17, L0-lgnd-ac21, L0-katn.

**Build.**
- `tests/legendary-registry.test.mjs` asserts `keysFor(DRAGON_KATANA).crafted === "andrew:dk_crafted"` and the other `dk_*` keys.
- The uniqueness test covers `itemId`, `keyPrefix`, `abilityKey`, `command`, `craftTokenId` and `textPrefix` over all defs.
- `isLegendaryStack` is true for `andrew:dragon_katana` and `andrew:dragon_katana_crafted`, and false for `minecraft:diamond_sword`.

**BDS.** GIVEN the Web Sword, Scythe and Cannon flags are set and `andrew:dk_crafted` is unset
WHEN Survival player A crafts the Katana
THEN exactly one broadcast names A and the localized "Dragon Katana", A holds a marked `andrew:dragon_katana` with origin `craft`, and `dk_crafted` is set.
AND after a restart, B's Survival craft is refunded with exactly 2 golden apples, 2 ender pearls and 1 diamond sword, with `andrew.katana.craft_blocked` and no broadcast.
AND `/give` and Creative copies leave the flag unchanged; `/andrew:katana reset` clears only `dk_crafted`; the other flags never change.
AND (v7, replaces the "never pulled" clause) the Katana is magnetic like the other weapons with no edit to `magn` (`ac21`).


- **node**: L0-lgnd-ac23

### Lgnd ac24 concept acceptance criterion (L0-lgnd-ac24)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r017", "L0-lgnd-ac07", "L0-lgnd-ac08", "L0-lgnd-ac09", "L0-lgnd-ac19", "L0-xcx21", "L0-xasm22", "L0-xcx11", "L0-katn"]
see_also: ["dragonkatanaspecv1ruen-part-3"]
---
**AC-lgnd-24: Katana T16–T18 under C-16, and a teleport trips no recovery.** Channel: `bds` (GameTests `legendary_katana_*`, run with the shipped scenarios parameterised by def).

- **T16.** P has a marked Katana in the hotbar and dies (also in lava, after a teleport). THEN on respawn P holds the same id and gen, and no item entity remains.
- **T17, prevent.** A marked Katana item entity:
  - in fire, or in lava, is still there after 10 s, with the same id and gen;
  - in a chest in an Orbital LMB column, and on the ground in an RMB blast and ring AABB, ends up outside the volume with the same id and gen, and no `andrew.legendary.recovered` message, nothing in `dk_owed`.
- **T17, return (C-16, `L0-xcx21`).** A marked Katana entity on cactus, or hit by primed vanilla TNT: afterwards exactly one live Katana exists, either in the owner's inventory (at their feet if it is full, `retention.ts:270-275`) with `gen + 1` and `andrew.legendary.recovered`, or in `dk_owed` if the owner is offline.
- **T18.** A Katana dropped into the Void, or inside a chest minecart that falls into the Void, returns to **`mark.owner`** exactly once. The clause "to the last holder" waits for `L0-xcx11`.
- **Teleport (`r017`).** GIVEN a marked Katana on the ground near P, and P holding a second def's marked stack
  WHEN P activates the Katana 20 blocks away 3 times, then walks until the ground item's chunk unloads and returns
  THEN no `legendary recovery: … now gen` line appears, both gens are unchanged, `dk_owed` is empty and the ground Katana is watched again.
- **Same dimension.** A Katana teleport whose ray reaches the edge of a loaded area stops before the unloaded cell, and the player's `dimension.id` before and after is equal.


- **node**: L0-lgnd-ac24

### Lgnd ac25 concept acceptance criterion (L0-lgnd-ac25)

**AC-lgnd-25: The Sculk Crossbow is def #5 with its own craft budget (Crossbow T01–T03, framework side).** Channel: `build` + `bds`.

Related: L0-lgnd-ad16, L0-lgnd-as18, L0-lgnd-cx15, L0-lgnd-ac23, L0-sclk.

**Build.**
- `keysFor(SCULK_CROSSBOW).crafted === "andrew:sk_crafted"`, and the other `sk_*` keys.
- The uniqueness test covers `itemId`, `keyPrefix`, `craftTokenId`, `textPrefix`, `command` over all five defs, and `abilityKey` over the four active ones. It fails if def #5 uses `sc`.
- `isLegendaryStack` is true for `andrew:sculk_crossbow` and its token; `isLegendaryWeaponStack` is true for the crossbow only; both are false for `minecraft:crossbow`.

**BDS.** GIVEN the other four flags are set and `andrew:sk_crafted` is unset
WHEN Survival player A crafts the crossbow (the token reaches the inventory)
THEN exactly one broadcast names A and the localized "Sculk Crossbow",
AND A holds a marked `andrew:sculk_crossbow` with origin `craft`, and `sk_crafted` is set,
AND no `andrew:sc_*` key changed.
AND after a restart, B's Survival craft is refunded with exactly 2 echo shards, 2 deepslate and 1 crossbow, with `andrew.crossbow.craft_blocked` and no broadcast (T02).
AND `/give B andrew:sculk_crossbow` and a Creative copy leave the flag unchanged (T03).
AND `/andrew:crossbow reset` clears only `sk_crafted`.


- **node**: L0-lgnd-ac25

### Lgnd ac26 concept acceptance criterion (L0-lgnd-ac26)

**AC-lgnd-26: A passive def has no timer, no Use claim and no HUD line; defs #1–#4 are unchanged.** Channel: `build` (node unit tests, stubbed hands) + `bds`.

Related: L0-lgnd-ad15, L0-lgnd-r018, L0-xcx24.

**Build.**
- `hasAbility` is true for the four shipped defs and false for `SCULK_CROSSBOW`. `defForAbility` never returns a passive def.
- `cooldownKey`/`busyKey` for the four shipped abilities are byte-identical to 1.6.1.

**BDS.** GIVEN P holds the crossbow in the main hand and a ready Katana in the off hand
WHEN P presses Use
THEN `resolveActivation(P)` returns the Katana (off hand),
AND P's Action Bar shows only the Katana line.

GIVEN P holds only the crossbow, in either hand, for 5 s
THEN the HUD makes no `setActionBar` call for P,
AND P has no `andrew:cd_*` or `andrew:busy_*` property that was not there before.

**Regression gate.** `npm test` and the legendary, Web Sword, Scythe, Orbital and Katana GameTests pass **without assertion edits**.


- **node**: L0-lgnd-ac26

### Lgnd ac27 concept acceptance criterion (L0-lgnd-ac27)

**AC-lgnd-27: Crossbow T19, T20 and Void return under C-16, against `returnTarget(mark)`.** Channel: `bds` (the shipped legendary scenarios parameterised by def).

Related: L0-lgnd-ad16, L0-lgnd-ad17, L0-lgnd-cx16, L0-lgnd-ac24, L0-xcx21, L0-xcx25.

`returnTarget(mark)` is `mark.owner` until `LGND-HOLD` ships, then `holder ?? owner` (`ad17`).

- **T19.** P has a marked crossbow in the hotbar or off hand and dies (also by a magnet fall). On respawn P holds the same id and gen; no item entity remains.
- **T20, prevent.** A marked crossbow item entity in fire or lava is still there after 10 s, same id and gen. In a chest in an Orbital LMB column, in an RMB/ring AABB, **or inside a crossbow crater** (`sclk` calls `protectLegendariesIn` first), it ends outside the volume with the same id and gen, no message, nothing in `sk_owed`.
- **T20, return.** On cactus or hit by primed vanilla TNT: exactly one live crossbow exists, with `returnTarget(mark)` (gen + 1, `andrew.legendary.recovered`) or in `sk_owed` if that player is offline.
- **Void.** Dropped into the Void, or inside a chest minecart or held by an armour stand that falls in: it returns to `returnTarget(mark)` exactly once; offline → `sk_owed`, redeemed once on the next join, also after a restart.
- **Known deviation until `LGND-HOLD`:** A crafts, gives to B, B loses it in the Void → A receives it.
- No crossbow-specific line in `src/legendary/` is needed for any clause above.


- **node**: L0-lgnd-ac27

### Lgnd gl01 concept glossary term (L0-lgnd-gl01)

**Legendary weapon** (легендарное оружие)

An item with an entry in the static `LEGENDARIES` array (`src/legendary/registry.ts`), bound by the shared rules:
- one Survival craft per world, spent only by a craft token, with a first-craft broadcast;
- death retention;
- the destruction policy (prevent / spill / return to the last holder);
- one cooldown per ability, shared by all its activation modes, with a busy deadline;
- hand priority;
- one Action Bar HUD.

Today these are the Web Sword (`andrew:web_sword`), the Scythe of Calamity (`andrew:scythe_of_calamity`) and the Orbital Cannon (`andrew:orbital_cannon`, v3). Shadow Blade is named in the Scythe spec but not specified.

Only **marked** copies get protection. Plain `/give` and Creative copies cast, but are ordinary items (`L0-lgnd-as11`).

**Synonyms:** legendary.


- **node**: L0-lgnd-gl01

### Lgnd gl02 concept glossary term (L0-lgnd-gl02)

**Marked instance / live instance**

**Marked:** an `ItemStack` that carries the `andrew:<p>_origin/_owner/_id` dynamic properties, with origin `craft` or `admin`. Only marked stacks get legendary protection. An unmarked stack, for example from Creative, is an ordinary item.

**Live:** a marked stack whose `_gen` equals the ledger generation. Only live stacks are retained or returned, and a stale marked stack cannot cast.

**Opposite:** stale (see gen).


- **node**: L0-lgnd-gl02

### Lgnd gl03 concept glossary term (L0-lgnd-gl03)

**Instance generation (gen)**

An integer stored on each marked stack (`andrew:<p>_gen`) and in the world ledger (`andrew:<p>_gen:<id>`). The framework bumps it every time it re-issues a lost instance.

A stack whose gen is lower than the ledger's is **stale**: it cannot cast, and it is deleted when a player picks it up. Stacks made before the framework have no gen and read as 0.


- **node**: L0-lgnd-gl03

### Lgnd gl04 concept glossary term (L0-lgnd-gl04)

**Busy (ability state)**

A durable deadline, `andrew:busy_<abilityKey>` in epoch ms, that runs from activation until the end of a multi-tick effect. The Scythe volley is the only one today (`L0-lgnd-ad07` §2). While busy:
- the ability is not ready;
- a repeat Use resolves to nothing, silently;
- the HUD keeps showing the weapon line. There is no separate "active" segment.

If the owner never clears it, for example after a crash, busy expires by itself at the deadline.

It is distinct from **cooldown** (`andrew:cd_<abilityKey>`), which the ability owner starts. The Orbital Cannon never sets busy: its cooldown starts at launch.

**States:** Ready → (Busy) → Cooldown or Ready.


- **node**: L0-lgnd-gl04

### Lgnd gl05 concept glossary term (L0-lgnd-gl05)

**Pending / owed (return tokens)**

Durable tokens that each authorise exactly one grant of an instance.

- **Pending:** per player, stored in `andrew:<p>_pending`. Written on death, redeemed on respawn.
- **Owed:** per world, stored in `andrew:<p>_owed`. Written when an item is lost to the Void or destroyed while its last holder is offline. Redeemed on that player's next join.

The token is removed in the same turn as the grant, and there is never a grant without a token.


- **node**: L0-lgnd-gl05

### Lgnd gl06 concept glossary term (L0-lgnd-gl06)

**Last holder**

The player whose inventory most recently contained a given marked instance. Stored in `andrew:<p>_holder` and updated on `playerInventoryItemChange`.

The last holder is who gets the item back after a Void loss or destruction (Scythe §1, "последнему владельцу"). This is not necessarily the crafter (`owner`). On 0.3.0 stacks the field is absent, and the crafter (`owner`) is used instead.


- **node**: L0-lgnd-gl06

### Lgnd gl07 concept glossary term (L0-lgnd-gl07)

**Refund (blocked craft)**

The after-the-fact reversal of a Survival craft once the weapon's per-world budget is spent (Q-008):
- the unmarked result is removed;
- that weapon's `refundIngredients` are added back to the inventory, and any leftovers spawn at the player's feet.

The base tool comes back as a new stack, so its enchantments and durability are lost. This is a known limitation.


- **node**: L0-lgnd-gl07

### Lgnd gl08 concept glossary term (L0-lgnd-gl08)

**Activation resolver (`resolveActivation`)**

The single function in `src/legendary/hands.ts` that answers "which held legendary does this Use press activate?". The answer is:
- the main hand, if its ability is ready and not busy;
- otherwise, the off hand, if its ability is ready and not busy;
- otherwise, none.

Every ability module calls it and acts only when the answer is its own weapon. It replaces the planned central dispatcher (`L0-lgnd-ad07`).

**Synonyms:** hand-priority resolver.


- **node**: L0-lgnd-gl08

### Lgnd gl09 concept glossary term (L0-lgnd-gl09)

**Craft token** (крафт-токен)

A hidden item such as `andrew:orbital_cannon_crafted` that a legendary recipe outputs in place of the weapon itself.
- It has the weapon's icon and name and is not in the Creative menu.
- The craft gate swaps it, in the same slot, for either a marked weapon (claim) or the refund ingredients (refund).
- This is the only way to spend a weapon's one-per-world Survival craft. Plain `/give` and Creative copies of the weapon never touch the flag (`L0-lgnd-r014`).

**Synonyms:** crafted token, `craftTokenId`.


- **node**: L0-lgnd-gl09

### Lgnd gl10 concept glossary term (L0-lgnd-gl10)

**Activation mode** (`"use"` | `"attack"`)

The kind of input a press is: **use** is RMB, or a tap on iPad; **attack** is LMB, or hold on iPad (`L0-xasm10`).
- Each `LegendaryDef` lists the modes it accepts in `activations`. Only the Orbital Cannon accepts `attack`.
- `resolveActivation(player, mode)` picks the activated weapon:
  - use: main hand, then off hand;
  - attack: main hand only.
- All modes of one weapon share one cooldown.

**Synonyms:** LMB/RMB mode, input mode.


- **node**: L0-lgnd-gl10

### Lgnd gl11 concept glossary term (L0-lgnd-gl11)

**Protection pass (`protectLegendariesIn`)**

A synchronous framework call that a destructive effect makes **before** it removes blocks or explodes.
- It takes live marked legendaries out of the containers in a volume and off the ground in it.
- It re-drops them, as the same stack with the same `gen`, at a safe spot outside the volume.
- If no safe spot exists, it hands them to the holder.

This is tier 1 ("prevent") of the destruction policy (`L0-lgnd-p008`).

**Synonyms:** protect pass, legendary evacuation.


- **node**: L0-lgnd-gl11

### Lgnd gl12 concept glossary term (L0-lgnd-gl12)

**Destruction policy tiers: prevent / spill / return**

How the framework meets "a legendary is not destroyed" (Orbital §5) within the stable API. The first tier that applies wins:
1. **Prevent:** destruction this add-on causes, such as the Cannon, runs the protection pass first, so the item stays in the world.
2. **Spill:** vanilla destruction of a container drops its contents, including the legendary.
3. **Return:** when the engine destroys the item entity (cactus, vanilla TNT, despawn, the Void; fire and lava are prevented by `minecraft:fire_resistant`), the item is re-issued to `mark.owner` (last holder waits for `L0-xcx11`) with `gen + 1`. This tier is the documented deviation (C-16).

See `L0-lgnd-r012`.


- **node**: L0-lgnd-gl12

### Lgnd gl13 concept glossary term (L0-lgnd-gl13)

---
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad12", "L0-lgnd-p003"]
---
**Departure (in-flight instance)**

A live marked legendary that has just left a player's inventory slot or off hand. Recovery records it in `inFlight` (`recovery.ts:106`) and resolves it after a short grace period.

- If the player swung to drop within ±2 ticks, the instance is searched for: watched ground entities, every player's inventory and off hand, and block containers around the departure cell. Found nowhere means lost, which means returned (v1.4.2 fix `5a68b84`).
- A departure without a drop swing is a store the script cannot see (a shulker item or the ender chest), and is never a loss.

**Synonyms**: in-flight, left-a-slot.


- **node**: L0-lgnd-gl13

### Lgnd gl14 concept glossary term (L0-lgnd-gl14)

---
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad13", "L0-lgnd-r016"]
---
**Legendary stack vs. legendary item entity**

- **Legendary stack** (`isLegendaryStack(stack)`): any `ItemStack` whose type is a registered legendary `itemId` or craft token, in any mark state (marked, unmarked or stale). It answers "is this a legendary weapon?", and the magnet uses it to never pull one.
- **Legendary item entity** (`isLegendaryItemEntity(entity)`): a `minecraft:item` entity carrying a **live marked** instance. It answers "is this a protected instance?", and `ring` drop suppression and `protectLegendariesIn` use it.

An unmarked `/give` copy is a legendary stack but not a legendary item entity.


- **node**: L0-lgnd-gl14

### Lgnd gl15 concept glossary term (L0-lgnd-gl15)

---
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p008", "L0-lgnd-as15", "L0-lgnd-cx13"]
---
**Holder block vs. entity holder**

- **Holder block**: a block type in `HOLDER_TYPES` (`recovery.ts:491`) that can contain a legendary as a stack: chests, barrels, hoppers, droppers, dispensers, the crafter, furnaces, shulker boxes, copper chests, shelves, decorated pots and item frames. `protectLegendariesIn` and the departure search read only these. Writing over one (`setType`, `fillBlocks`, a structure place) erases its contents, so script writers protect first.
- **Entity holder**: an entity that carries stacks: a chest or hopper minecart, an armour stand or a mob hand. Recovery never reads it. Its contents become watchable only when the entity is destroyed and spills them. The UFO magnet must not select one that carries a legendary (`r016`).


- **node**: L0-lgnd-gl15

### Lgnd gl16 concept glossary term (L0-lgnd-gl16)

**Void holder**

An **entity** with an inventory that the engine removes below the dimension floor with no death event and no spill, so its contents never become item entities. As of 1.4.4, `VOID_HOLDER_TYPES` = `minecraft:chest_minecart` and `minecraft:hopper_minecart` (`recovery.ts:135`). Recovery reads their containers in `beforeEvents.entityRemove`. The armour stand is a Void holder that is **not** covered (`cx14`).

**Not the same as:** `HOLDER_TYPES`, the **block** containers that `protectLegendariesIn` empties before a script removes them.


- **node**: L0-lgnd-gl16

### Lgnd gl17 concept glossary term (L0-lgnd-gl17)

**Wielder teleport**

An ability that moves the **player** holding the legendary, rather than a target or the world. The Dragon Katana is the first. It always stays in the player's own dimension and edits no block. To the framework it is invisible: a wielder teleport is not a loss event (`r017`), because the stacks travel inside the player's inventory.

**Synonyms:** self-teleport, Katana blink.


- **node**: L0-lgnd-gl17

### Lgnd gl18 concept glossary term (L0-lgnd-gl18)

**`hudKeys` / uniqueness flag**

- **`hudKeys`.** An optional `LegendaryDef` field that names the weapon's own Action Bar lang keys (`ready`, `cooldown`). They take the same arguments as the shared `andrew.legendary.ready|cooldown` (`%s: Ready` / `%s: %s s`). A def uses them when its spec asks for a different string shape: the Orbital Cannon, and the Katana with "Dragon Katana — Ready".
- **Uniqueness flag (craft flag).** The world dynamic property `andrew:<keyPrefix>_crafted`: `ws`, `sc`, `oc`, and `dk` for the Katana. It is set by the one legal Survival craft, and it persists across restarts. Only `/andrew:<cmd> reset` clears it.

**Synonyms:** Survival craft flag, `crafted` key.


- **node**: L0-lgnd-gl18

### Lgnd gl19 concept glossary term (L0-lgnd-gl19)

**Passive legendary (passive def)**

A `LegendaryDef` with no ability (`PassiveLegendaryDef`, `hasAbility(def) === false`). It obeys every legendary rule (craft gate, mark, retention, return, protection, magnetism) but has no cooldown or busy key, never claims a Use in `resolveActivation`, and never draws an Action Bar line. The first one is the Sculk Crossbow (def #5). Opposite: **active def** (Web Sword, Scythe, Orbital Cannon, Dragon Katana).

**Synonyms**: no-ability def. Not to be confused with a **stale** copy, which is a voided instance, not a kind of def.


- **node**: L0-lgnd-gl19

### Lgnd gl20 concept glossary term (L0-lgnd-gl20)

**Return target**

The player who receives a legendary after a tier-3 loss (Void, cactus, vanilla TNT, despawn) or a protect hand-back, and whose id keys the `<prefix>_owed` entry when offline. As built at 1.6.1 it is `mark.owner` (the crafter, or the `/give` target of an admin copy). After `LGND-HOLD` it becomes `holder ?? owner` (the last player whose inventory held the stack). GameTests read it through `returnTarget(mark)`.

**Synonyms**: "последний владелец" (spec wording, = last holder); not the same as **owner** (crafter) while the holder is unbuilt.


- **node**: L0-lgnd-gl20

### Lgnd gl21 concept glossary term (L0-lgnd-gl21)

**Magnetic legendary**

A legendary **weapon** stack (any def's `itemId`, marked or not) that the UFO magnet treats like iron since 1.6.0: pulled from the ground and containers, a player holding one is lifted, and a mob or armour stand holding one is a class-3 holder. Decided by `isLegendaryWeaponStack`. A **craft token** is never magnetic. An operator-tuned exception to the UFO spec's "legendaries are never pulled".


- **node**: L0-lgnd-gl21

### Sclk ac01 concept acceptance criterion (L0-sclk-ac01)

**AC-sclk-01 (T01) · First Survival craft** · channel `bds` · the rule is in `lgnd`, this is the crossbow call site

GIVEN a fresh world and a Survival SimulatedPlayer, WHEN a Crafter (a real recipe craft, loaded via `/replaceitem`) is loaded with the pattern ` E / DCD / E ` (E echo shard, D deepslate, C crossbow) and crafts,
THEN:
- the output token becomes one marked `andrew:sculk_crossbow` in the player's inventory;
- the world's `sk` craft flag is set (`L0-adr-sckp`);
- the localized first-craft broadcast names the player.

The same pattern with cobbled deepslate produces nothing.


- **node**: L0-sclk-ac01

### Sclk ac02 concept acceptance criterion (L0-sclk-ac02)

**AC-sclk-02 (T02) · A repeat craft is blocked after a restart** · channel `bds` · the rule is in `lgnd`

GIVEN the `sk` flag was set (ac01) and the BDS was restarted, WHEN the recipe is crafted again in Survival,
THEN:
- no crossbow is produced;
- the token is swapped for the refund (echo shard ×2, deepslate ×2, crossbow ×1);
- the localized `craft_blocked` message is shown.

The proof uses the restart harness: SimulatedPlayers do not survive a restart, so a fresh one is spawned after it.


- **node**: L0-sclk-ac02

### Sclk ac03 concept acceptance criterion (L0-sclk-ac03)

**AC-sclk-03 (T03) · Creative and `/give` do not spend the flag** · channel `bds`

GIVEN the `sk` flag is unset, WHEN `/give @s andrew:sculk_crossbow` runs and a copy is taken from the Creative inventory,
THEN:
- both stacks are usable crossbows (they fire bolts);
- the flag is still unset;
- a following Survival craft still succeeds as a first craft.


- **node**: L0-sclk-ac03

### Sclk ac04 concept acceptance criterion (L0-sclk-ac04)

**AC-sclk-04 (T04) · A shot spawns a bolt with a trail along its real path** · channel `bds` (visual on the iPad: ac23)

GIVEN a shooter SimulatedPlayer with the crossbow and arrows, aimed level at a wall 20 blocks away, WHEN it fires one charged shot,
THEN:
- exactly one `andrew:sculk_bolt` exists and no `minecraft:arrow` survives the spawn tick;
- the bolt's owner is the shooter, and its initial speed is within 5 % of the arrow's;
- the log shows trail emissions on ≥ 5 ticks, at points whose y drops over the flight (they follow gravity, not a straight ray).


- **node**: L0-sclk-ac04

### Sclk ac05 concept acceptance criterion (L0-sclk-ac05)

**AC-sclk-05 (T05) · The trail harms nothing** · channel `bds`

GIVEN a bystander SimulatedPlayer standing 0.6 blocks beside the bolt's line (no collision), plus a column of glass and grass 0.6 blocks off the line, WHEN a bolt flies past both and ends in the Void or expires,
THEN:
- the bystander's health and position are unchanged (an `entityHurt` witness records none);
- no block within 2 of the line changed;
- the record ends as `expired`.


- **node**: L0-sclk-ac05

### Sclk ac06 concept acceptance criterion (L0-sclk-ac06)

**AC-sclk-06 (T06) · A direct hit deals exactly D, and no arrow damage** · channel `bds`

GIVEN an unarmoured target SimulatedPlayer at 20 HP, 8 blocks from the shooter, WHEN one bolt hits it,
THEN:
- its health is exactly `20 − SONIC_BOOM_DAMAGE` (10) after the hit tick, with exactly one `entityHurt` from the shooter;
- no `minecraft:arrow` entity existed during the test.

**Negative control:** with Power V on the crossbow the result is still 10.


- **node**: L0-sclk-ac06

### Sclk ac07 concept acceptance criterion (L0-sclk-ac07)

**AC-sclk-07 (T07) · Difficulty does not change D** · channel `bds`

GIVEN the setup of ac06, WHEN it is repeated at `/difficulty easy` and at `/difficulty hard` (peaceful is skipped: it heals players and empties hostile structures),
THEN the target loses exactly D on each.

The test restores the original difficulty in `finally`.


- **node**: L0-sclk-ac07

### Sclk ac08 concept acceptance criterion (L0-sclk-ac08)

**AC-sclk-08 (T08) · Armour, Protection and a shield do not reduce D** · channel `bds`

GIVEN a target SimulatedPlayer in full netherite with Protection IV,
WHEN:
- (a) it is hit by one bolt;
- (b) it holds a shield in the off hand, raised by sneaking, faces the shooter, and is hit by one bolt;

THEN in each case it loses exactly D. The case (b) bolt resolves once, as an entity hit, either through `projectileHitEntity` or through the shield fallback (`as02`). The log names the path used.


- **node**: L0-sclk-ac08

### Sclk ac09 concept acceptance criterion (L0-sclk-ac09)

**AC-sclk-09 (T09) · Neighbours take nothing** · channel `bds`

GIVEN a target SimulatedPlayer and a bystander SimulatedPlayer 1.5 blocks beside it, plus a zombie 2 blocks behind it (`spawnWithoutBehaviors`), WHEN one bolt hits the target,
THEN:
- only the target loses health;
- the bystander and the zombie record no `entityHurt` during the hit tick and the 40 ticks after it (the patch placement included).


- **node**: L0-sclk-ac09

### Sclk ac10 concept acceptance criterion (L0-sclk-ac10)

**AC-sclk-10 (T10) · An entity hit makes a patch and no crater** · channel `bds`

GIVEN a target standing on a flat 9×9 stone floor, WHEN a bolt hits it,
THEN:
- no floor cell became air;
- 9 ≤ (sculk cells) ≤ 25, all within the 5×5 centred on the target's feet column and all on the top surface;
- at least one 5×5 cell is not sculk (irregular).

A second case: a target 10 blocks above the floor gets no patch (`xasm24`).


- **node**: L0-sclk-ac10

### Sclk ac11 concept acceptance criterion (L0-sclk-ac11)

**AC-sclk-11 (T11) · A block hit carves an irregular crater ≤ 5×5×3** · channels `bds` + node

GIVEN a solid stone block 7×7×5, WHEN a bolt hits the top face centre,
THEN:
- every air cell created lies within the 5×5 footprint and ≤ 3 deep;
- the centre column is ≥ 2 deep;
- 12 ≤ (air cells) ≤ 75, and the footprint is not a full 5×5;
- no item entity spawned.

**Node:** `craterCells` is deterministic for a given seed and never leaves the box across 1000 seeds × 6 faces. Deny-list cells and liquids in the fixture stay.


- **node**: L0-sclk-ac11

### Sclk ac12 concept acceptance criterion (L0-sclk-ac12)

**AC-sclk-12 (T12) · The crater does no explosion damage** · channel `bds`

GIVEN a bystander SimulatedPlayer standing 2 blocks from the impact cell, on a cell outside the crater box, WHEN a bolt hits the block,
THEN:
- the bystander records no `entityHurt` from any cause in the hit tick and the 20 ticks after it;
- no `minecraft:tnt` entity and no explosion event occurred.


- **node**: L0-sclk-ac12

### Sclk ac13 concept acceptance criterion (L0-sclk-ac13)

**AC-sclk-13 (T13) · Permanent sculk around the crater** · channel `bds`

GIVEN the crater of ac11, THEN:
- ≥ 8 exposed surface cells inside the 5×5 around the impact are `minecraft:sculk`;
- no `sculk_sensor`, `sculk_shrieker`, `sculk_catalyst` or `sculk_vein` is present in the box.

AND after a BDS restart (the restart harness), the same cells are still sculk.


- **node**: L0-sclk-ac13

### Sclk ac14 concept acceptance criterion (L0-sclk-ac14)

**AC-sclk-14 (T14) · Quick Charge works, and the reload still limits** · channel `bds`

GIVEN two shooter SimulatedPlayers, one with Quick Charge III and one without, WHEN each repeatedly holds use until the shot fires,
THEN the Quick Charge III shooter's measured charge-to-shot time is ≤ 50 % of the plain one's (vanilla: 0.5 s vs 1.25 s, ±2 ticks).

AND a release after 2 ticks spawns **no** bolt for either shooter (`cx02`).


- **node**: L0-sclk-ac14

### Sclk ac15 concept acceptance criterion (L0-sclk-ac15)

**AC-sclk-15 (T15) · Piercing cannot stay or act** · channels `bds` + node

GIVEN a crossbow stack with `piercing 4` + `multishot 1`, put into a SimulatedPlayer's inventory by script (this fires `playerInventoryItemChange`), THEN by the next tick:
- the stack has no `piercing`;
- it still has `multishot`.

AND a bolt fired by a stack that has Piercing (set in the same tick, before the strip) hitting two targets in a line damages only the first.

**Node:** the strip helper keeps the other enchantments.


- **node**: L0-sclk-ac15

### Sclk ac16 concept acceptance criterion (L0-sclk-ac16)

**AC-sclk-16 (T16) · Multishot: three independent bolts** · channel `bds`

GIVEN a Survival shooter with a Multishot crossbow and 10 arrows, aiming at a wall 15 blocks away, WHEN it fires one charged shot,
THEN:
- three bolts with distinct records exist;
- exactly one arrow was spent;
- three separate block-hit outcomes are logged, each with its own seed and its own crater/sculk job;
- no record resolves twice.


- **node**: L0-sclk-ac16

### Sclk ac17 concept acceptance criterion (L0-sclk-ac17)

**AC-sclk-17 (T17) · Three Multishot bolts, three full hits on one player** · channel `bds`

GIVEN a target SimulatedPlayer in full netherite with Protection IV at 40 HP (health boosted by an effect), placed 2 blocks in front of the shooter so that all three bolts connect within ≤ 2 ticks, WHEN one Multishot shot fires,
THEN:
- three entity-hit outcomes are logged for that target;
- its health drops by exactly 3 × D = 30, despite the invulnerability window (`xcx22`).

**In-test negative control:** the same volley with the `setCurrentValue` step disabled by a test flag must lose less than 30.


- **node**: L0-sclk-ac17

### Sclk ac18 concept acceptance criterion (L0-sclk-ac18)

**AC-sclk-18 (T18) · No durability loss** · channels `bds` + node

GIVEN a Survival shooter, WHEN it fires 30 charged shots and lands 10 melee hits with the crossbow,
THEN:
- the stack's `minecraft:durability` component is absent (option A), or its damage is 0 (option B);
- the stack is the same item, not broken or replaced.

**Node:** the item JSON has no `minecraft:durability`.


- **node**: L0-sclk-ac18

### Sclk ac19 concept acceptance criterion (L0-sclk-ac19)

**AC-sclk-19 (T19) · Death retention, crossbow instance** · channel `bds` · the rule is in `lgnd`

GIVEN a SimulatedPlayer holding a marked crossbow, WHEN it dies, THEN:
- no `andrew:sculk_crossbow` item entity spawns where it died;
- after respawn, the player's inventory holds exactly one marked crossbow, with its enchantments kept.

The framework's per-def retention scenario covers it with def #5 added to its def list.


- **node**: L0-sclk-ac19

### Sclk ac20 concept acceptance criterion (L0-sclk-ac20)

**AC-sclk-20 (T20) · The item entity survives hazards, crossbow instance** · channel `bds` · the rule is in `lgnd` (C-16 reading of `xcx21`)

GIVEN a dropped marked crossbow, WHEN it is put through fire, lava, cactus, TNT, an Orbital LMB blast and the Void,
THEN after each, **exactly one** marked crossbow exists, held or owed to `mark.owner` (`xasm26`).

AND a crossbow lying inside a crossbow crater box is protected by `protectLegendariesIn` before the carve.


- **node**: L0-sclk-ac20

### Sclk ac21 concept acceptance criterion (L0-sclk-ac21)

**AC-sclk-21 · The probe is recorded before any build task** · channel `bds` (checks, 19136)

GIVEN the probe pack (p001), THEN:
- Q1–Q9 each have a logged yes/no and a measured value in the probe artifact;
- `L0-adr-scbs` and `L0-adr-scdm` are marked `accepted` or `superseded`, citing those values;
- `cx01` and `cx02` are updated with the Q2 and Q5 results.

No `sclk` item, pipeline or crater task starts before this.


- **node**: L0-sclk-ac21

### Sclk ac22 concept acceptance criterion (L0-sclk-ac22)

**AC-sclk-22 · The deny-list move changes nothing for the Orbital** · channels `bds` + node

GIVEN `PENETRATOR_KEEP` moved to `src/terrain/keep.ts`, THEN:
- the node set-equality test against the pre-move list passes;
- the Orbital LMB, penetrator and ring GameTests are green (blast-radius gate);
- a crossbow bolt hitting bedrock or a barrier leaves it in place.


- **node**: L0-sclk-ac22

### Sclk ac23 concept acceptance criterion (L0-sclk-ac23)

**AC-sclk-23 · iPad: the trail looks like a Sonic Boom and follows the bolt** · channel `ipad` (manual, by the operator)

GIVEN the production world on the iPad, WHEN the operator fires a bolt at a target 25 blocks away, THEN they see:
- a row of teal Sonic Boom rings that follows the bolt's arc, not a straight beam;
- the rings fade within about 1 s after the bolt ends;
- no visible frame drop with a Multishot volley.

Reopen after every `sclk` epic merge.


- **node**: L0-sclk-ac23

### Sclk ac24 concept acceptance criterion (L0-sclk-ac24)

**AC-sclk-24 · iPad: the crater reads as a small irregular hole** · channel `ipad` (manual)

WHEN the operator shoots grass/dirt ground and a stone wall, THEN:
- each hit leaves a ragged hole about 5 wide and 2–3 deep, not a cube and not a TNT-sized pit;
- no item drops lie around;
- there is no explosion sound or flash.


- **node**: L0-sclk-ac24

### Sclk ac25 concept acceptance criterion (L0-sclk-ac25)

**AC-sclk-25 · iPad: the sculk looks natural and stays** · channel `ipad` (manual)

WHEN the operator hits a mob on flat ground and then shoots the ground, THEN:
- each time, a ragged sculk patch about 5×5 appears on the surface, under the mob or around the crater;
- after leaving and rejoining the world, the sculk is still there;
- there are no sensors or shriekers.


- **node**: L0-sclk-ac25

### Sclk ac26 concept acceptance criterion (L0-sclk-ac26)

**AC-sclk-26 · iPad: icon, name and tooltip** · channel `ipad` (manual)

GIVEN the operator holds the crossbow, THEN:
- the hotbar and inventory icon is a recognisable crossbow with sculk colouring (not the missing-texture square);
- the name reads «Скалковый арбалет» in Russian and "Sculk Crossbow" in English;
- the tooltip line is localized;
- no "Ready" Action Bar line appears while it is held (r009).


- **node**: L0-sclk-ac26

### Sclk ac27 concept acceptance criterion (L0-sclk-ac27)

**AC-sclk-27 · iPad: Creative entry and shooting feel** · channel `ipad` (manual)

GIVEN the Creative inventory, THEN:
- the crossbow appears under Снаряжение/Equipment next to the crossbows;
- searching «арбалет» or "crossbow" finds it.

AND in Survival:
- the shot charges like a crossbow (or like a bow, per the `xq7` item 8 answer);
- a quick tap does not fire;
- a Quick Charge copy charges visibly faster.


- **node**: L0-sclk-ac27

### Sclk gl01 concept glossary term (L0-sclk-gl01)

**Sculk bolt (`andrew:sculk_bolt`)**

The snowball-runtime projectile entity that replaces every arrow fired from the Sculk Crossbow, at spawn, with the same velocity and owner. It carries no damage of its own. Its single outcome (an entity hit, a block hit or expiry) is resolved by script.

**Synonyms:** bolt, болт. **Not:** the vanilla arrow, which is removed in its spawn tick.


- **node**: L0-sclk-gl01

### Sclk gl02 concept glossary term (L0-sclk-gl02)

**`SONIC_BOOM_DAMAGE` (D)**

The fixed per-bolt hit damage: 10 HP (5 hearts), the Warden's Sonic Boom on Normal (`xasm23`). It is exactly subtracted through armour, Protection, the shield and the invulnerability window (C-28). One exported constant.

**Synonyms:** fixed damage, Sonic Boom damage, урон Sonic Boom.


- **node**: L0-sclk-gl02

### Sclk gl03 concept glossary term (L0-sclk-gl03)

**Crater (кратер)**

The scripted, drop-free set of cells turned to air on a bolt's **block** hit. It stays inside a 5×5 footprint × 3 deep box into the hit face, is irregular, and is seeded per bolt (`r003`). It is not an explosion: it causes no entity damage and no `createExplosion`.

**Not:** the Orbital Cannon's penetrator or ring carve, which shares only the deny list.


- **node**: L0-sclk-gl03

### Sclk gl04 concept glossary term (L0-sclk-gl04)

**Sculk patch (скалковое пятно)**

Permanent plain `minecraft:sculk` placed on the exposed solid full-block surfaces within ≤ 5×5. It goes under the struck entity (entity hit), or around and inside the crater (block hit), and has a ragged edge (`r004`). It never includes a sensor, shrieker, catalyst or vein.

**Synonyms:** sculk infection, скалковое заражение.


- **node**: L0-sclk-gl04

### Sclk gl05 concept glossary term (L0-sclk-gl05)

**Bolt record (`BoltRecord`)**

The in-memory, never-persisted state of one live bolt: owner, seed, birth tick, last position and volley id (`ent3`). Deleting it is the resolve-once guard (C-26). A bolt with no record (after a reload) is removed with no outcome.


- **node**: L0-sclk-gl05

### Sclk gl06 concept glossary term (L0-sclk-gl06)

**Passive legendary**

A legendary def with no ability block: no cooldown key, no `resolveActivation` claim and no HUD line (`xcx24`). The Sculk Crossbow is the first one. All other legendary framework rules (craft gate, retention, protection, Void return, magnetism) still apply.

**Synonyms:** no-ability def.


- **node**: L0-sclk-gl06

