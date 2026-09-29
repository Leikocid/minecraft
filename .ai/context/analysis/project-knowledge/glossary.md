---
title: Glossary
type: project-knowledge
generated_at: "2026-09-29T19:09:13.601Z"
source_channel: rollout
node_id: rollout-glossary
aliases: ["rollout-glossary","glossary","project-knowledge/glossary"]
is_a: ["rollout","glossary"]
relates_to: ["L0-lgnd-ac01","L0-lgnd-ac02","L0-lgnd-ac03","L0-lgnd-ac04","L0-lgnd-ac05","L0-lgnd-ac06","L0-lgnd-ac07","L0-lgnd-ac08","L0-lgnd-ac09","L0-lgnd-ac10","L0-lgnd-ac11","L0-lgnd-ac12","L0-lgnd-ac13","L0-lgnd-ac14","L0-lgnd-ac15","L0-lgnd-ac16","L0-lgnd-ac17","L0-lgnd-ac18","L0-lgnd-ac19","L0-lgnd-ac20","L0-lgnd-gl01","L0-lgnd-gl02","L0-lgnd-gl03","L0-lgnd-gl04","L0-lgnd-gl05","L0-lgnd-gl06","L0-lgnd-gl07","L0-lgnd-gl08","L0-lgnd-gl09","L0-lgnd-gl10","L0-lgnd-gl11","L0-lgnd-gl12","L0-orbc-ac01","L0-orbc-ac02","L0-orbc-ac03","L0-orbc-ac04","L0-orbc-ac05","L0-orbc-ac06","L0-orbc-ac07","L0-orbc-ac08","L0-orbc-ac09","L0-orbc-ac10","L0-orbc-ac11","L0-orbc-ac16","L0-orbc-ac18","L0-orbc-ac19","L0-orbc-gloss-activ","L0-orbc-gloss-charge","L0-orbc-gloss-cont","L0-orbc-gloss-lock","L0-orbc-gloss-mode","L0-orbc-gloss-orph","L0-pntr-ac01","L0-pntr-ac02","L0-pntr-ac03","L0-pntr-ac04","L0-pntr-ac05","L0-pntr-ac06","L0-pntr-ac07","L0-pntr-ac08","L0-pntr-ac09","L0-pntr-gl01","L0-pntr-gl02","L0-pntr-gl03","L0-pntr-gl04","L0-pntr-gl05","L0-ring-ac11","L0-ring-ac12","L0-ring-ac13","L0-ring-ac14","L0-ring-ac15","L0-ring-ac16","L0-ring-ac17","L0-ring-ac18","L0-ring-ai11","L0-ring-ai12","L0-ring-ai15","L0-ring-gl01","L0-ring-gl02","L0-ring-gl03","L0-ring-gl04","L0-ring-gl05"]
priority: 540
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
THEN P receives it with the same id, gen g + 1 and `holder` = P, plus a private `andrew.orbital.returned` message,
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
WHEN it burns in lava or fire, is destroyed by cactus or a **vanilla** TNT explosion, or despawns
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

Pending the client's confirmation of `L0-adr-hold`.


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
3. **Return:** when the engine destroys the item entity (fire, lava, cactus, vanilla TNT, despawn, the Void), the item is re-issued to the last holder with `gen + 1`. This tier is the documented deviation (C-16).

See `L0-lgnd-r012`.


- **node**: L0-lgnd-gl12

### AC-orbc-01 · Item components: no durability, not enchantable, punch damage, stack of 1 `[bds]` (L0-orbc-ac01)

# AC-orbc-01 · Item components: no durability, not enchantable, punch damage, stack of 1 `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r001", "L0-orbc-ent1"]`

**GIVEN** `new ItemStack("andrew:orbital_cannon")`.

**THEN**
- `getComponent("minecraft:durability")` is undefined.
- `getComponent("minecraft:enchantable")` is undefined, or `canAddEnchantment` is false for sharpness and unbreaking.
- `maxAmount === 1`.
- A static JSON test asserts the absence of `damage`, `digger`, `use_modifiers` and `shooter`, and the presence of `icon: fishing_rod` and `menu_category.category: equipment`.
- **Punch:** P hits a zombie with the Cannon, and the health lost equals the loss from an empty-hand hit in the same setup (1.0). P uses the Cannon 50 times, and the stack is still the same instance with the same mark `id`, with no wear.
- The recipe JSON matches `r002`'s shape exactly (a static test).


- **node**: L0-orbc-ac01

### AC-orbc-02 · Look, no fishing, anvil and table refuse it, Creative placement `[ipad]` (manual) (L0-orbc-ac02)

# AC-orbc-02 · Look, no fishing, anvil and table refuse it, Creative placement `[ipad]` (manual)

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-xcx13", "L0-orbc-r001"]`

On the iPad, on the current stable client:
1. The inventory icon is indistinguishable from a vanilla fishing rod placed beside it.
2. In hand, it reads as a rod. A screenshot goes into the task, per `xcx13`.
3. Tapping use in the air or on water casts **no** bobber, and nothing is ever caught.
4. The enchanting table does not accept it into the slot. In the anvil, the Cannon plus an enchanted book gives no result.
5. It appears under Creative → Equipment, and search "Orbital" finds it.
6. The name is shown as "Orbital Cannon" (EN) and "Орбитальная пушка" (RU).
7. The recipe book shows the TNT-cross recipe.

**Not auto-verifiable.** The orchestrator must not close it from a `bds` run (memory: "Orchestrator auto-verifies manual criteria").


- **node**: L0-orbc-ac02

### AC-3 · With no block within 10, nothing fires and no cooldown starts `[bds]` (L0-orbc-ac03)

# AC-3 · With no block within 10, nothing fires and no cooldown starts `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r004", "L0-orbc-r003"]`

**GIVEN**
- a SimulatedPlayer P in Survival, holding the Cannon, with no cooldown;
- P facing open sky, with the nearest block along the view ray 11 or more blocks away. A variant looks at water only, or at tall grass with air behind it within 10.

**WHEN** P uses the item (RMB) and attacks (LMB, a forced `entityHitBlock` path).

**THEN**
- No `andrew:orbital_charge` exists in the dimension.
- `andrew:cd_orbital_cannon` on P is unset or unchanged.
- No chat or title message was sent to P.
- An immediate retry facing a block at distance 9.5 **succeeds**: one charge exists and the cooldown is set.


- **node**: L0-orbc-ac03

### AC-4 · Spawn height is +30 in the Overworld and End and +10 in the Nether, with the ceiling clamped `[bds]` (L0-orbc-ac04)

# AC-4 · Spawn height is +30 in the Overworld and End and +10 in the Nether, with the ceiling clamped `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r007", "L0-orbc-cx03"]`

**GIVEN** the stub effect, which records `spawnY` and does not break blocks, and a target block T.

**THEN**
| Case | Expected spawn Y |
|---|---|
| Overworld, T.y = 64 | 94 |
| End, T.y = 60 | 90 |
| Nether, T.y = 40 | 50 |
| Overworld, T.y = 300 | 319 (clamped) |
| Nether, T.y = 120 | 127 (clamped) |

- The charge's (x, z) equals T's column centre.
- Every case is a pure unit test of `spawnY(dimId, T.y, heightRange)`, plus one BDS run per dimension that reads the entity position in the spawn tick.


- **node**: L0-orbc-ac04

### AC-5 · A charge spawned inside a solid block detonates at once `[bds]` (L0-orbc-ac05)

# AC-5 · A charge spawned inside a solid block detonates at once `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r008", "L0-orbc-p002"]`

**GIVEN**
- a stone block placed exactly at the computed spawn cell (T.y + 30) above target T;
- the stub effect, which records `(point, tick)`.

**WHEN** P fires at T.

**THEN**
- `onDetonate` is called once, in the activation tick, with `point` equal to the stone block's location.
- No charge entity remains one tick later.
- A control run with air at the spawn cell detonates at T (the top contact) after ≥ 1 tick.


- **node**: L0-orbc-ac05

### AC-6 · Entities do not stop falling charges `[bds]` (L0-orbc-ac06)

# AC-6 · Entities do not stop falling charges `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r008"]`

**GIVEN**
- target T on flat stone.
- In T's column, between T+5 and T+15, three things lie in the charge's path:
  - a second SimulatedPlayer Q in Creative flight;
  - a named `minecraft:cow` (summoned with a name, so it persists) kept in place with a slowness effect;
  - a boat.

**WHEN** P fires at T with the stub effect.

**THEN**
- `onDetonate.point` equals T, not Q's, the cow's or the boat's position.
- The charge's Y, sampled per tick, decreases monotonically through the entities' Y.
- Q, the cow and the boat are not displaced by the charge. Their position change is below 0.05 while it passes.

**Variant:** water 5 deep above T. `point` equals T (the stone floor), not the water surface.


- **node**: L0-orbc-ac06

### AC-orbc-07 · A charge falling into the Void vanishes with no effect and keeps the cooldown `[bds]` (L0-orbc-ac07)

# AC-orbc-07 · A charge falling into the Void vanishes with no effect and keeps the cooldown `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r009", "L0-orbc-r005"]`

**GIVEN**
- In the End: a single block T at y = 60 with nothing below it.
- The test calls the core's `spawnCharge` hook directly at a column offset one block beside T, so the column is empty down to `heightRange.min`.

**WHEN** the charge falls.

**THEN**
- No `onDetonate` is called.
- The entity is gone once its Y would pass below `heightRange.min`.
- P's cooldown remaining is still greater than 0.
- No `andrew:orbital_charge` entity remains in the dimension.


- **node**: L0-orbc-ac07

### AC-orbc-08 · Touch input and aim on the iPad `[ipad]` (manual) (L0-orbc-ac08)

# AC-orbc-08 · Touch input and aim on the iPad `[ipad]` (manual)

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-xcx8", "L0-orbc-cx02", "L0-xasm10", "L0-orbc-ad01"]`

**Blocked** until `L0-xq5` is answered. The THEN lines below are for option 1 (LMB within reach, RMB up to 10). Rewrite them if the answer is different.

On the iPad with the default touch controls, using the stub effect (one sound at detonation):
1. **Tap** on a highlighted block 3 blocks away → one RMB attack lands on **that** block, the tapped one.
2. **Hold** on a highlighted block 3 blocks away → one LMB attack. The block is not mined, even when the hold continues.
3. A block 8 blocks away with RMB (by the gesture that `cx02` settles) → the attack lands on the block under the crosshair/aim.
4. Each gesture gives exactly one attack and one cooldown. There is never a double shot from tap-plus-hold (`r006`).
5. Tapping the sky gives no sound, no text and no HUD change.

Record the actual outcome of each case in the task, and the deviation note (`r013`).


- **node**: L0-orbc-ac08

### AC-orbc-09 · One activation per tick; the target is locked; hits count on any face `[bds]` (L0-orbc-ac09)

# AC-orbc-09 · One activation per tick; the target is locked; hits count on any face `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r006", "L0-orbc-r003", "L0-orbc-ent2"]`

1. **Dedup.** P's handlers receive `itemUse`, `itemUseOn` and `entityHitBlock` for the same tick. The test drives the core's input entry with three synthetic calls. Exactly one attack is registered, and its mode is the first call's.
2. **Lock.** P fires at T. On the next tick P turns 180° and moves 5 blocks. The charge's (x, z) still equals T's column, and `onDetonate.point` equals T.
3. **Faces.** P looks at T's bottom face from a cave below, at T's side from 4 blocks, and at the top from above. Each gives `target == T.location`, not the adjacent air block.
4. **Passable.** Tall grass stands in front of stone S at a distance of 6. The target is S.


- **node**: L0-orbc-ac09

### AC-orbc-10 · The HUD shows Ready or the countdown in either hand (L0-orbc-ac10)

# AC-orbc-10 · The HUD shows Ready or the countdown in either hand

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r012", "L0-orbc-cx01", "L0-lgnd-cx08"]`

**`[bds]`** Call `hudMessage(P)`:
- The Cannon in the main hand with no cooldown gives rawtext `andrew.legendary.ready` with the Cannon's name.
- After firing, at t+60, it gives `andrew.legendary.cooldown` with `27`.
- With the Cannon in the off hand only, the same output. This needs `allow_off_hand` (`lgnd-cx08`).
- Holding no Cannon gives `undefined`.
- Player Q, who has not fired, gets Ready at the same moment.

**`[ipad]`** (manual): in EN and RU, the Action Bar text matches the wording `cx01` settles, for example `Orbital Cannon — Ready` and `Орбитальная пушка — 27с`. It updates about twice a second.


- **node**: L0-orbc-ac10

### AC-orbc-11 · No leftovers and no idle loop `[bds]` (L0-orbc-ac11)

# AC-orbc-11 · No leftovers and no idle loop `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-p003", "L0-orbc-p002", "L0-orbc-ad02"]`

**GIVEN** three players each fire RMB in the same tick, using a stub `ring.layout` that returns 160 columns.

**THEN**
- 480 charges exist in the spawn tick.
- Once every charge has detonated or voided, the count of `andrew:orbital_charge` is 0, and the core's registry holds 0 attacks.
- The job handle is released. `system.clearJob` was reached, or the generator returned.
- The mean added script time per tick while the charges are live stays within the budget `ring` publishes (C-5a′). It is measured with `system.currentTick` deltas against a control run.
- A world startup with a pre-placed `andrew:orbital_charge`, left over from a crash, removes it within 1 s.


- **node**: L0-orbc-ac11

### AC-16 · The shared 30 s cooldown starts at once and blocks both modes `[bds]` (L0-orbc-ac16)

# AC-16 · The shared 30 s cooldown starts at once and blocks both modes `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r005", "L0-orbc-r006"]`

**GIVEN** two SimulatedPlayers, P and Q, each holding a Cannon with no cooldown, and a target within 10.

**WHEN** P fires RMB at tick t.

**THEN**
- In tick t, before any charge has moved, P's `remainingTicks` is between 599 and 600.
- At t+20, P's LMB and RMB each create **no** new charge, and the charge count is unchanged.
- At t+20, Q's RMB succeeds. Q's cooldown is independent (C-20).
- At t+600, P's LMB succeeds.
- Reverse order: the first shot is LMB, and RMB is blocked.
- The cooldown is set even if the charge later voids or its chunk unloads (covered by `ac07` and `ac19`).


- **node**: L0-orbc-ac16

### AC-18 · The owner dying, logging out or changing dimension does not cancel charges `[bds]` (L0-orbc-ac18)

# AC-18 · The owner dying, logging out or changing dimension does not cancel charges `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r010", "L0-orbc-p003"]`

**GIVEN**
- P fires RMB at a target 1 block high with the stub effect, so the fall is about 30 ticks.
- Observer Q stands near the target and keeps the area loaded.

**WHEN**, in three separate runs, P is killed, disconnected, or teleported to the Nether one tick after firing.

**THEN**
- In every run, every charge reaches `onDetonate`, at the same points as a control run where P does nothing.
- The ownerId passed equals P's id.
- The detonations happen in the Overworld.
- No charge appears in P's new dimension.


- **node**: L0-orbc-ac18

### AC-19 · Unload and shutdown discard in-flight charges and refund nothing `[bds]` (L0-orbc-ac19)

# AC-19 · Unload and shutdown discard in-flight charges and refund nothing `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r011", "L0-orbc-p003", "L0-orbc-ad03"]`

**Unload run**
- **GIVEN** P fires at a target, and in the next tick P and every other player are teleported more than 300 blocks away, so the area unloads.
- **WHEN** 200 ticks pass and P returns.
- **THEN**
  - no `onDetonate` was ever called for that attack;
  - after the chunk reloads, no `andrew:orbital_charge` entity exists there (the `entityLoad` sweep);
  - the target block is intact;
  - P's cooldown was not cleared early.

**Restart run** (BDS `stop`, then restart on the checks instance on port 19136)
- **GIVEN** P fires, and the server stops within 10 ticks.
- **THEN**, after the restart:
  - no charge entity exists in the loaded area;
  - no late detonation happens in the next 100 ticks;
  - P's `andrew:cd_orbital_cannon` deadline equals its pre-stop value, so the cooldown persisted.


- **node**: L0-orbc-ac19

### Orbc gloss activ concept glossary term (L0-orbc-gloss-activ)

**Successful activation**

A single LMB or RMB press that passes every gate:
- the Cannon is resolved in a hand;
- it is the first activation this tick;
- the cooldown is ready;
- a valid target lies within 10 blocks.

It then writes the cooldown and spawns the charges in the same tick. It is the only moment the cooldown starts. A press that fails any gate is a **no-op** and leaves no trace.

**Synonyms:** запуск атаки, shot, fire.


- **node**: L0-orbc-gloss-activ

### Orbc gloss charge concept glossary term (L0-orbc-gloss-charge)

**Charge (Orbital Charge)**

The TNT-looking, script-moved entity `andrew:orbital_charge` that falls from the spawn height to the target. It has no collision, no physics and no damage, and it is never a real primed TNT. One LMB attack has one charge, at 1.2× scale. One RMB attack has about 160 charges, at 1.0×. The outcomes of a charge are **detonated**, **voided**, **lost** or **timed out**.

**Synonyms:** заряд, projectile (avoid, because "projectile" means the Scythe's entities in `L0-scyt`). **Not:** `minecraft:tnt`.


- **node**: L0-orbc-gloss-charge

### Orbc gloss cont concept glossary term (L0-orbc-gloss-cont)

**Contact block / detonation point**

A *contact block* is any block that stops a falling charge: not air, not a liquid, and not in the pass-through set (`L0-orbc-as03`).

The *detonation point* is the integer location of the first contact block the charge sweeps, or of its spawn cell when it spawns inside one. That point is handed to `onDetonate`.

**Synonyms:** точка срабатывания, "actual trigger point" (§9).


- **node**: L0-orbc-gloss-cont

### Orbc gloss lock concept glossary term (L0-orbc-gloss-lock)

**Target lock**

The block location, and its dimension, fixed at the moment of a successful activation. It is the block that was hit, on any face. All later computation uses the lock and never the player's current aim or position. The column of an LMB attack, and the centre of an RMB attack's rings, are the locked block's (x, z).

**Synonyms:** зафиксированная цель, locked target.


- **node**: L0-orbc-gloss-lock

### Orbc gloss mode concept glossary term (L0-orbc-gloss-mode)

**LMB mode / RMB mode**

The two attacks of the Cannon.
- **LMB** (Attack / Hit Block, via `entityHitBlock`) fires one penetrator charge, and its effect is `L0-pntr`.
- **RMB** (Use, via `itemUse`/`itemUseOn`) fires the five-ring TNT volley, and its effect is `L0-ring`.

On touch the mapping is: hold = LMB, tap = RMB (`L0-xasm10`, pending `L0-xq5`).

**Synonyms:** ЛКМ/ПКМ, penetrator/rings, attack/use.


- **node**: L0-orbc-gloss-mode

### Orbc gloss orph concept glossary term (L0-orbc-gloss-orph)

**Orphan charge / lost charge**

A *lost* charge is one dropped from its attack because its entity or its next cell became unloaded. It never detonates.

An *orphan* is a charge entity that exists in the world with no live attack in memory: one that was saved in an unloaded chunk or at shutdown, then loaded again. It is removed on load or startup and **never** detonates.

**Related:** *voided*, a charge that fell below `heightRange.min`.


- **node**: L0-orbc-gloss-orph

### AC-7 (bds) · Irregular ~5×5 column to the bottom (L0-pntr-ac01)

**GIVEN** an Overworld test area of stone from y=80 down to bedrock. It contains a 3×3 water pocket at y=40 and a bedrock block placed at y=20 in the column centre, and the column is seeded with a fixed `attackId`.
**WHEN** an LMB charge detonates on the stone at y=80.
**THEN**, after the removal job reports done:
- every cell of `planColumn(attackId)` between y=80 and `heightRange.min` that was stone is air;
- no cell outside the plan changed (except by liquid flow);
- the 3×3 core is air on every layer, and at least one layer is not a perfect 5×5 square;
- per-layer removed counts are within 9…33;
- the placed bedrock at y=20 and the bottom bedrock are still bedrock;
- the stone directly below the placed bedrock (y=19) is air, so the column did not stop;
- the water cells are still water or have flowed; none were turned into air by the script.


- **node**: L0-pntr-ac01

### AC-7 (bds) · Works in Nether and End; keep list holds (L0-pntr-ac02)

**GIVEN** three test columns:
- (a) Nether: netherrack from y=100 to 0, with a lava cell at y=50;
- (b) End: end stone, with an `end_portal_frame` and a `barrier` placed in the column;
- (c) Overworld: a waterlogged oak fence in the column.

**WHEN** an LMB detonates on the top of each.

**THEN**:
- (a) all netherrack in the plan down to y=0 is gone, the Nether bottom bedrock and the lava remain, and the column reaches y=0;
- (b) the frame and the barrier remain, and the end stone below them is gone;
- (c) the fence cell is `minecraft:water`.

The unit test for `PENETRATOR_KEEP` equals the `xasm6` list exactly.


- **node**: L0-pntr-ac02

### AC-8 (bds) · Obsidian, portal, containers, spawners removed with no drops (L0-pntr-ac03)

**GIVEN** the column plan contains:
- obsidian and crying obsidian;
- a lit Nether portal (frame and `portal` blocks);
- a chest filled with 27 cobblestone stacks, a barrel, a placed shulker box with items, and a furnace with output;
- a `mob_spawner` and reinforced deepslate.

A snapshot of the `minecraft:item` and `minecraft:xp_orb` entity ids in a 9×9 AABB around the column is taken before the LMB.

**WHEN** an LMB detonates above them.

**THEN**:
- every listed block in the plan is air;
- the portal blocks outside the plan are gone too (vanilla invalidation);
- **zero** new item or XP entities exist in the plan cells' AABB after the job plus 20 ticks.

Neighbour pops outside the plan are excluded (`L0-pntr-as06`).


- **node**: L0-pntr-ac03

### AC-8 (bds) · Legendary in a column container survives exactly once (L0-pntr-ac04)

**GIVEN** two players, A (the owner) and B.
- Chest X lies in the column plan and contains a Web Sword crafted by B and ordinary items.
- Chest Y lies in the column of a *second* LMB fired by B in the same tick, and its column overlaps A's column.

**WHEN** both LMBs detonate.

**THEN**:
- the world plus all inventories hold exactly **one** instance of the Web Sword, with the same mark id and generation;
- it lies as an item entity outside every column's footprint, or is delivered by `lgnd`'s rules;
- the ordinary items are gone;
- no second copy appears after a restart.

**AND** if `protectLegendariesIn` is mocked to throw, the container cell is **kept** and still holds the sword.


- **node**: L0-pntr-ac04

### AC-9 (bds) · No direct damage; environment still harms (L0-pntr-ac05)

**GIVEN**:
- a zombie and simulated player B standing on the detonation surface inside the plan, each at full health;
- a cow on a 1-block ledge beside the column but outside the plan;
- the owner A standing 6 blocks away.

**WHEN** the LMB detonates.

**THEN**:
- in the detonation tick and the next tick, no entity receives damage (no `entityHurt` event with any cause from `pntr`), and the cow and A do not move;
- the zombie and B then fall and take fall damage (`entityHurt` with cause `fall`);
- if lava is placed at the rim, an entity that ends up in it takes `lava` damage.

Note: the simulated player is only valid on the gametest pack (memory: SimulatedPlayer limits). Real-player feel belongs to `L0-pntr-ac08`.


- **node**: L0-pntr-ac05

### AC-10 (bds) · One sound, 20-tick wave, nothing left behind (L0-pntr-ac06)

**GIVEN** a spy wrapped around `dimension.playSound` and `dimension.spawnParticle` in the gametest build.
**WHEN** one LMB detonates on a 140-layer column.
**THEN**:
- `playSound` was called exactly once, with `random.explode`, at the detonation point, in the detonation tick;
- `spawnParticle` calls span exactly 20 consecutive ticks starting at the detonation tick;
- the per-tick call count is ≤ 16;
- the particle y-coordinates are non-increasing across ticks, and the last tick includes `bottom`;
- 25 ticks after detonation, no `pntr` job is running, and the entity count in the column AABB equals the pre-attack count minus entities that fell out.


- **node**: L0-pntr-ac06

### AC-10 (bds) · Removal looks instant within budget (L0-pntr-ac07)

**GIVEN** a stone-filled area on the QA BDS (port 19134).
**WHEN**:
- (a) one LMB detonates at y=76;
- (b) one LMB detonates at y=319;
- (c) three players fire LMB in the same tick at y=76.

**THEN** the removal job reports:
- the top 16 layers removed in the detonation tick;
- `ticksUsed ≤ 3` for (a), `≤ 6` for (b), and `≤ 6` for each column in (c);
- no server tick above 50 ms in (a), and at most 2 consecutive ticks above 50 ms in (b) and (c).

If this fails, the result is recorded against `L0-pntr-as03`, and the deviation path in `L0-pntr-cons` is taken. The criterion is not silently widened.


- **node**: L0-pntr-ac07

### AC-7/AC-10 (ipad) · Looks like a blasted shaft, instant, one boom, ~1 s wave (L0-pntr-ac08)

**GIVEN** the release build on the production BDS (port 19132), joined from the iPad, in Survival with the Cannon.
**WHEN** the tester fires LMB at grass, then at an ocean floor, then in the Nether.
**THEN**, judged by the tester on the device (not by a gametest):
- the shaft appears in the same instant as the boom, with no visible top-to-bottom "unzipping";
- the walls look ragged, not a clean square;
- exactly one loud explosion sound is heard;
- a particle wave visibly runs down the shaft for about 1 s;
- ocean water pours into the shaft;
- the owner standing nearby takes no hit.

This criterion must be closed by the human tester only. Orchestrator auto-verification does not count (memory: orchestrator auto-verifies manual criteria).


- **node**: L0-pntr-ac08

### C-14 (bds) · Column at a chunk edge never force-loads (L0-pntr-ac09)

**GIVEN** a detonation cell on the x-edge of a loaded chunk whose neighbour chunk is unloaded (outside the tick range).
**WHEN** the LMB detonates.
**THEN**:
- the cells in the loaded chunk are removed;
- the cells in the unloaded chunk are unchanged when that chunk is later loaded;
- `report.skippedUnloaded > 0`;
- no error propagates out of the job;
- no ticking area or dynamic property was created.


- **node**: L0-pntr-ac09

### Penetrator column (L0-pntr-gl01)

**Penetrator column**

The vertical shaft that an Orbital Cannon LMB removes. It is about 5×5 with ragged edges and fits in 7×7. It runs from the detonation cell down to the dimension's `heightRange.min`. Its cell set is defined by a `ColumnPlan` (`L0-pntr-ent1`).

**Synonyms:** LMB column, shaft, вертикальная шахта (RU spec). **Not to be confused with** the RMB "rings" (`L0-ring`).


- **node**: L0-pntr-gl01

### Detonation point (L0-pntr-gl02)

**Detonation point**

The integer block cell where an Orbital charge triggers. It is either the first solid cell the falling charge touches, or the cell it spawned inside. It is supplied by `orbc` through `onDetonate`. It can differ from the **target block** the player aimed at, for example when a tree canopy or overhang is in the way. The LMB column starts here, not at the target.

**Synonyms:** trigger point, фактическая точка срабатывания (RU spec).


- **node**: L0-pntr-gl02

### Survival-unbreakable block (keep list) (L0-pntr-gl03)

**Survival-unbreakable block**

A block a Survival player can never break, such as Bedrock, End Portal Frame, the active End Portal, End Gateway, Barrier and command blocks. The LMB keeps it but continues the column below it. In code it is `PENETRATOR_KEEP`, a fixed list, because stable 2.10.0 has no hardness query (`L0-xasm6`).

**Note:** Obsidian, Reinforced Deepslate and Ancient Debris are *not* in this set. They are hard but breakable.

**Synonyms:** keep list, engine-protected block, неразрушаемый в Survival.


- **node**: L0-pntr-gl03

### Particle wave (L0-pntr-gl04)

**Particle wave**

The purely visual effect after an LMB. Explosion particles travel from the top of the penetrator column to its bottom in about 20 ticks (~1 s), whatever the column's depth. It plays *after* the blocks are already gone and carries no sound.

**Synonyms:** визуальная волна частиц (RU spec).


- **node**: L0-pntr-gl04

### Band mask (L0-pntr-gl05)

**Band mask**

The 7×7 bit pattern that selects which `(x, z)` cells are removed for a *band* of 4 consecutive layers of the penetrator column. The 3×3 core is always set, and the rim is probabilistic. The pattern is drawn from a PRNG seeded by the attack id, so the same attack always gives the same shape.

**Related:** `ColumnPlan`, `attackId`.


- **node**: L0-pntr-gl05

### Ring ac11 concept acceptance criterion (L0-ring-ac11)

**AC-ring-11 · Five continuous rings, d ≈ 1/5/10/15/20** (Orbital AC-11; `r001`) · **verify: bds**

- **Unit:** `layout({x:0,y:64,z:0})` returns 1 centre + 4 rings. Each ring is closed and 8-connected (every cell has exactly 2 ring neighbours in its 8-neighbourhood), and each cell satisfies |√(dx²+dz²) − r| ≤ 0.75 for r ∈ {2.5, 5, 7.5, 10}. There are no duplicates, and the count is 140–160.
- **Gametest:** GIVEN a flat stone pad in the Overworld and an owner holding the Cannon aimed at the pad's centre block, WHEN RMB is used, THEN in the activation tick the `andrew:orbital_charge` count tagged with the attack equals `layout().length`. Every charge has y = target.y + 30 and (x, z) equal to a layout column. After the drain, the pad shows craters whose centres match the layout columns.


- **node**: L0-ring-ac11

### Ring ac12 concept acceptance criterion (L0-ring-ac12)

**AC-ring-12 · The charges are independent, and every one explodes separately** (Orbital AC-12; `r003`) · **verify: bds**

GIVEN a stepped target: the half of the ring footprint with x < 0 is raised 6 blocks, so the inner charges land 6 ticks or more before the outer ones. WHEN RMB is fired, THEN:
- each charge's x and z never change during its flight: it is sampled every tick, and the tolerance is 0.001;
- no charge is removed before its own contact tick, as `orbc` reports;
- the number of `createExplosion` calls equals the number of charges that detonated, and is never merged;
- `report.maxBlastsInTick` ≤ 48.

Run it again with a spy on `createExplosion`: the call count per attack equals `layout().length` minus voided and lost charges.


- **node**: L0-ring-ac12

### Ring ac13 concept acceptance criterion (L0-ring-ac13)

**AC-ring-13 · TNT damage, including to the owner** (Orbital AC-13; `r004`; C-20) · **verify: bds**

GIVEN two SimulatedPlayers in Survival with 20 HP and no armour: owner A stands 2 blocks from the ring-5 line, and B stands 2 blocks from the ring-15 line, plus one zombie on ring 10. WHEN A fires RMB, THEN:
- A, B and the zombie each lose health in the range a vanilla primed TNT gives at the same distance (reference: a `minecraft:tnt` control run in the same pad);
- A's death message, if A died, attributes the blast;
- a control run with A's position switched to another dimension gives no error, and the blasts still happen with no `source`.


- **node**: L0-ring-ac13

### Ring ac14 concept acceptance criterion (L0-ring-ac14)

**AC-ring-14 · TNT resistance, no block drops, no fire** (Orbital AC-14; `r005`, `r006`) · **verify: bds**

GIVEN a pad of dirt, stone and planks, with Obsidian and Reinforced Deepslate pillars on ring 10 and a chest with 10 cobblestone on ring 15. WHEN RMB is fired, THEN:
- the dirt, stone and planks around each charge are cratered;
- every Obsidian and Reinforced Deepslate block remains;
- the chest is destroyed;
- the `minecraft:item` count within footprint ± 8 is 0, with no cobblestone, dirt or planks;
- no `minecraft:fire` or `minecraft:soul_fire` block exists in the area;
- after the drain, `world.gameRules.doTileDrops` equals its pre-test value. Check this for both `true` and `false` initial values.


- **node**: L0-ring-ac14

### Ring ac15 concept acceptance criterion (L0-ring-ac15)

**AC-ring-15 · Underwater: damage only** (Orbital AC-15; `r007`) · **verify: bds**

GIVEN a flat pad where the half with x < 0 is covered by 4 blocks of water and the half with x ≥ 0 is dry, with a zombie on the seabed on ring 5 at x < 0. WHEN RMB is fired at the boundary, THEN:
- every block within footprint ± 6 with x ≤ −2 is identical before and after (`getBlock` type snapshot);
- the dry half shows craters;
- the zombie took damage or died.


- **node**: L0-ring-ac15

### Ring ac16 concept acceptance criterion (L0-ring-ac16)

**AC-ring-16 · RMB never destroys a legendary** (Orbital §5, §10; `r008`) · **verify: bds**

GIVEN a live-marked Web Sword in a chest on ring 5, and a live-marked Scythe as an item entity on the ground 6 blocks outside ring 20. WHEN RMB is fired, THEN:
- both legendaries exist afterwards as item entities in the same dimension, outside the footprint ± 8, with the same `id` and `gen` (no `gen + 1`);
- no "returned" log line appears, and `handedBack` is 0;
- the `lgnd` `ac19` detector reports no unprotected container removal.

This AC fails today by design until `L0-ring-cx02` is resolved.


- **node**: L0-ring-ac16

### Ring ac17 concept acceptance criterion (L0-ring-ac17)

**AC-ring-17 · Three simultaneous RMBs stay within budget** (Orbital §12, §15; C-5a′; RG-1 to RG-3) · **verify: bds**

GIVEN 3 SimulatedPlayers with their own Cannons over three adjacent flat pads (their footprints overlap by 5 blocks). WHEN all three fire RMB in the same tick, THEN:
- `maxBlastsInTick` ≤ 48;
- all queued blasts drain within 10 ticks;
- server tick time stays above 50 ms for at most 3 consecutive ticks and never exceeds 150 ms;
- after 60 ticks the ring queue interval is cleared and orbc's flight interval is cleared.


- **node**: L0-ring-ac17

### Ring ac18 concept acceptance criterion (L0-ring-ac18)

**AC-ring-18 · No leftovers, and vanilla drops preserved** (Orbital §15; C-19; `r006`, `r009`) · **verify: bds**

GIVEN `keepInventory` false, a SimulatedPlayer B holding 5 diamonds on ring 10, 3 zombies on rings 5 and 15, and 4 pre-existing dirt item entities on ring 20. WHEN owner A fires RMB and B and the zombies die, THEN:
- 0 `andrew:orbital_charge` entities remain;
- B's 5 diamonds exist as item entities or were destroyed by a later blast, as in vanilla, and never by `ring` code (spy: 0 `remove()` calls on non-container-fallback items);
- the zombie loot and XP orbs were spawned;
- no block-drop items exist;
- the `minecraft:item` count within footprint ± 8 is at most the vanilla drops of what died, plus any surviving pre-existing dirt.


- **node**: L0-ring-ac18

### Ring ai11 concept acceptance criterion (L0-ring-ai11)

**AC-ring-11i · The rings look like five solid rings falling together** (Orbital AC-11, §10) · **verify: ipad**

GIVEN the iPad player on a hill ≥ 25 blocks from a flat target, WHEN a second player fires RMB, THEN:
- the player sees normal-size TNT forming a single centre block and four concentric rings, with no visible gaps, that appear at the same moment and fall together;
- on flat ground they explode within about half a second of each other;
- the craters afterwards trace the five rings.

The tester records a screen video and attaches a screenshot of the airborne rings.


- **node**: L0-ring-ai11

### Ring ai12 concept acceptance criterion (L0-ring-ai12)

**AC-ring-12i · Separate explosion sounds and no pushed charges** (Orbital AC-12) · **verify: ipad**

GIVEN the iPad player with sound on, at 20 blocks from an uneven target (a hillside), WHEN RMB is fired, THEN:
- the player hears a rolling series of separate explosion sounds, not one single boom;
- no falling TNT is seen to fly sideways or upward after a neighbour explodes;
- no TNT stays flashing on the ground afterwards.


- **node**: L0-ring-ai12

### Ring ai15 concept acceptance criterion (L0-ring-ai15)

**AC-ring-15i · The underwater rings are visible and audible but leave the seabed intact** (Orbital AC-15) · **verify: ipad**

GIVEN the iPad player swimming 12 blocks from an ocean-floor target, WHEN a second player fires RMB at the seabed, THEN:
- the player sees the charges sink through the water and hears the explosions;
- the player takes damage if inside a ring blast;
- the seabed afterwards shows no craters.


- **node**: L0-ring-ai15

### Ring gl01 concept glossary term (L0-ring-gl01)

**Ring Layout**

The constant set of charge columns for one RMB. It has one centre column (d = 1) plus four 8-connected closed rings at d = 5/10/15/20 (r = d/2), de-duplicated: ~145 `{x,z}` offsets. `layout(target)` translates them to the locked target. See `L0-ring-ent1`, `L0-ring-p001`.

**Synonyms:** TNT rings, ring pattern. The spec's name is «пять TNT-колец».


- **node**: L0-ring-gl01

### Ring gl02 concept glossary term (L0-ring-gl02)

**Detonation Queue**

`ring`'s global, in-memory FIFO of Queued Blasts. It is filled by `onDetonate` and drained at ≤ `RING_MAX_BLASTS_PER_TICK` explosions per tick by one interval, which runs only while the queue is non-empty. It spreads a same-tick touchdown of hundreds of charges over a few ticks. See `L0-ring-p003`, `L0-ring-ad02`.

**Not to be confused with** the orbc *flight job* (`L0-orbc-ad02`), which moves the charges.


- **node**: L0-ring-gl02

### Ring gl03 concept glossary term (L0-ring-gl03)

**Drop-Suppression Window**

The synchronous `try/finally` scope in which `world.gameRules.doTileDrops` is held false while a batch of ring explosions runs. It is then restored to its previous value. It never spans a tick. It removes block and container drops without touching mob loot or death drops. See `L0-ring-ent3`, `L0-ring-ad01`, `L0-ring-r006`.

**Synonyms:** no-drop window, tile-drop window.


- **node**: L0-ring-gl03

### Ring gl04 concept glossary term (L0-ring-gl04)

**Underwater Blast**

A ring blast whose centre cell is water, flowing water or a waterlogged block at blast time. It uses `breaksBlocks:false, allowUnderwater:true`: it deals damage and knockback, and changes no block. The classification is per blast, not per attack. Lava does not count. See `L0-ring-r007`, `L0-ring-ad03`.

**Synonyms:** damage-only blast.


- **node**: L0-ring-gl04

### Ring gl05 concept glossary term (L0-ring-gl05)

**Blast Centre / Protection Margin**

- **Blast Centre:** the explosion origin derived from the contact `point`. It is the middle of the cell above `point`, or of `point` itself when that cell is solid (`L0-ring-r010`).
- **Protection Margin:** ±8 blocks (2 × TNT power) around blast centres. It is the volume `protectLegendariesIn` must clear before a blast, because explosions damage item entities that far (`L0-ring-r008`, `L0-ring-cx02`).
- **Ring Footprint:** the 21 × 21 XZ box of the layout around the target. It is the base of the `avoid` region.


- **node**: L0-ring-gl05

