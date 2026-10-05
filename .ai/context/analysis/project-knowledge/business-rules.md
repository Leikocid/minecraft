---
title: Business Rules
type: project-knowledge
generated_at: "2026-10-05T22:05:04.951Z"
source_channel: rollout
node_id: rollout-business-rules
aliases: ["rollout-business-rules","business-rules","project-knowledge/business-rules"]
is_a: ["rollout","business-rules"]
relates_to: ["L0","L0-lgnd-r001","L0-lgnd-r002","L0-lgnd-r003","L0-lgnd-r004","L0-lgnd-r005","L0-lgnd-r006","L0-lgnd-r007","L0-lgnd-r008","L0-lgnd-r009","L0-lgnd-r010","L0-lgnd-r011","L0-lgnd-r012","L0-lgnd-r013","L0-lgnd-r014","L0-lgnd-r015","L0-lgnd-r016","L0-lgnd-r017","L0-lgnd-r018","L0-sclk-cons","L0-sclk-r001","L0-sclk-r002","L0-sclk-r003","L0-sclk-r004","L0-sclk-r005","L0-sclk-r006","L0-sclk-r007","L0-sclk-r008","L0-sclk-r009","L0-sclk-r010"]
priority: 610
---

# Business Rules

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Global Constraints (v7) (L0)

---
title: "Global Constraints"
aliases: ["L0-constraint", "Constraints"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0", "L0-sclk", "L0-adr-scdm", "L0-adr-sctr"]
see_also: ["constraints", "sculkcrossbowspecv1ruen-part-2", "sculkcrossbowspecv1ruen-part-3", "sculkcrossbowspecv1ruen-part-4"]
supersedes: ["L0-constraint@v6"]
---
# Global Constraints (v7)

**Carried unchanged:** C-1 … C-25, C-5a′, C-5d, C-5e, C-7″, C-12′, C-20″. All of them bind the crossbow. The ones it leans on most:
- C-2: stable 2.10.0, no Experiments.
- C-7: no duplication. The craft gate, protection and the deny list come from `lgnd` and `orbc`.
- C-12: never write into unloaded chunks.
- C-15: the priority order; crossbow §14 restates it for this weapon.
- C-16: the closest stable equivalent, documented.
- C-22: filter out `undefined` players.
- C-23: in-flight state is not persisted.

v7 adds:

| ID | Constraint | Source |
|---|---|---|
| C-26 | *(new)* **One projectile, one outcome, decided by the server.** Each bolt is tracked separately (a Multishot volley is three records) and resolves **at most once**, to exactly one of: an entity hit (fixed damage to the struck entity only, plus a patch), a block hit (crater plus sculk), or expiry/unload (nothing). Vanilla projectile damage is never applied on top of the fixed damage, and no other entity is ever damaged by a bolt, a crater or a patch. | §5, §6, §9, §11, §14 |
| C-27 | *(new)* **Terrain edits by a weapon are bounded, protected and permanent.** A crossbow bolt edits only cells inside its own box: crater ≤ 5×5 footprint × 3 deep, sculk ≤ 5×5 around the impact. Before any edit, `protectLegendariesIn` runs on that box. The Survival-unbreakable deny list is never edited. Cells in unloaded chunks or outside the height range are skipped. The edits are ordinary world changes: synced to every client, saved, never rolled back. | §6, §7, §11, §14; C-12 |
| C-5f | *(new)* **Visuals of a flying projectile are bounded.** Boom particles are emitted only while a bolt is alive, at a fixed small count per bolt per tick, from the shared interval. A bolt has a lifetime cap. There are no lingering effect entities. With no bolts in flight, the cost is zero. | §4, §11 |
| C-28 | *(new)* **Fixed damage is fixed.** The crossbow's hit damage is one constant: the same at every difficulty and whatever the armour, Protection, the shield or the hurt-invulnerability window. Kill credit, the death message and totems still work (the true-damage pattern from `decision-scythe-true-damage`). Holds with cause `sonicBoom` and a write only inside the window (diagnose-CNTR-X22); with any other cause the shield clause fails. | §5, §8, §9; T06–T08, T17 |
| C-20‴ | *(extended)* Crossbow acceptance uses ≥ 2 players: a SimulatedPlayer target for T08 (armour and shield) and T17 (three hits), and a bystander for T09 and T12. | §12 |




- **node**: L0

### Lgnd r001 concept rule (L0-lgnd-r001)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent1", "L0-stgt", "L0-sprj"]
---
**R-lgnd-001: One implementation per general rule (C-17, ADR-021).**

The craft gate, instance mark, death retention, loss return, cooldown/busy storage, Use dispatch, HUD and the hidden predicate live only in `src/legendary/`.

A weapon module (`src/websword/trap.ts`, `src/scythe/*`) **may**:
- call `registerLegendary(def)`;
- call `isReady / isBusy / setBusy / start / remaining` and `isHiddenFromTargeting`;
- implement its `ability`.

It **may not**:
- subscribe to `itemUse`, `playerInteractWithBlock`, `entityDie`, `playerSpawn`, `playerInventoryItemChange` or `entityRemove` for its own item;
- read or write any `andrew:<prefix>_*` or `andrew:hidden_until` property;
- call `setActionBar`.

**Check:** `grep -rnE "andrew:(ws|sc)_|andrew:hidden_until" src/` matches only `src/legendary/state.ts`. This extends the guard stated in the shipped `state.ts` header.




- **node**: L0-lgnd-r001

### Lgnd r002 concept rule (L0-lgnd-r002)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p001", "L0-lgnd-p007"]
---
**R-lgnd-002: Independent one-per-world craft budget per weapon.**

Source: Scythe §1 (*«один успешный Survival-крафт на мир, сохранение флага после рестарта, глобальное сообщение при первом крафте … Creative и /give … без расходования Survival-флага»*); Web Sword §3; Q-006, Q-008.

- Each registered weapon has its own world flag `andrew:<p>_crafted`. A Scythe craft never reads, consumes or resets the Web Sword budget, and vice versa.
- Only a Survival/Adventure craft of an unmarked result claims the flag. Creative/Spectator results stay unmarked and are ignored. Admin `give` never touches the flag.
- The flag survives logout, save and restart (C-6). Only `reset <weapon>` clears it.
- The broadcast fires exactly once per weapon per world, on the claiming craft.
- A blocked craft is refunded with that weapon's `refundIngredients` and a private message. No result stack remains.




- **node**: L0-lgnd-r002

### Lgnd r003 concept rule (L0-lgnd-r003)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent3"]
---
**R-lgnd-003: Cooldowns are isolated per (player, abilityKey).**

Source: Scythe §6 (the priority rule presupposes independent cooldowns); ADR-007/ADR-017; Q-009.

- Starting the Scythe cooldown leaves the Web Sword's readiness unchanged, and vice versa. The shipped single slot (where `startCooldown` ignores `_abilityKey`) is replaced by one key per weapon.
- A cooldown belongs to the player, not the stack. Handing the weapon to someone else does not hand over its cooldown.
- The length is `def.cooldownMs`: exactly 30 s for both weapons, measured on `Date.now()`, and it survives reconnect and restart.
- Only the ability owner arms a cooldown. The framework never starts one, neither on dispatch nor on refusal.




- **node**: L0-lgnd-r003

### Lgnd r004 concept rule (L0-lgnd-r004)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p004", "L0-lgnd-as07", "L0-lgnd-as08"]
---
**R-lgnd-004: Hand priority.**

Source: Scythe §6 and Web Sword §8 (*«готовая способность main hand имеет приоритет; если main-hand способность на cooldown, может сработать готовая off-hand способность»*). Q-019 default (a).

- At most one ability runs per Use press.
- A ready main-hand legendary fires **even if it then refuses** (no target, no room). A refusal does not fall through.
- If the main-hand legendary is not ready (cooldown **or busy**, `L0-lgnd-as08`), a ready off-hand legendary with a *different* ability key fires.
- Both not ready → nothing happens and no state changes.
- The off hand can only be triggered through a main-hand legendary press (engine limit, `L0-lgnd-as07`). An empty or non-legendary main hand never casts the off-hand weapon.
- Both items declare `minecraft:allow_off_hand: true`. The JSON change is owned by `L0-webs` (Web Sword) and `L0-sitm` (Scythe), per `L0-adr-cast` §4.




- **node**: L0-lgnd-r004

### Lgnd r005 concept rule (L0-lgnd-r005)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent2", "L0-lgnd-ent4", "L0-lgnd-p003", "L0-lgnd-ad02"]
---
**R-lgnd-005: At most one live generation per instance.**

Source: C-7 (now including Void return). Every return path is a duplication primitive unless the returned copy supersedes the lost one.

- A marked stack is live iff its `gen` equals the ledger generation for its `(prefix, id)`.
- Re-issuing a lost instance bumps the generation **before** the new stack exists, in the same synchronous turn.
- A stale stack:
  - cannot cast (the dispatcher treats it as absent);
  - is deleted on death, not retained;
  - is not watched or returned;
  - is deleted on the first `playerInventoryItemChange` that shows it in any player's inventory, with a private `voided` message.
- Nothing lowers a generation. `reset` does not touch generations.

**Consequence:** a mis-classified "lost" copy may still exist physically (for example in a hopper chest), but it can never be a second usable legendary.




- **node**: L0-lgnd-r005

### Lgnd r006 concept rule (L0-lgnd-r006)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad01", "L0-lgnd-p006"]
---
**R-lgnd-006: Shipped Web Sword storage is frozen and read as-is.**

Source: ADR-021 (Web Sword storage keys are kept), C-10.

- The Web Sword prefix is `ws` forever. It derives exactly the 0.3.0 names: `andrew:ws_crafted`, `ws_crafted_by`, `ws_pending`, `ws_origin`, `ws_owner`, `ws_id`, `ws_owner_name`.
- 0.3.0 formats must parse:
  - `ws_pending` holding a single serialised mark → a one-element array;
  - a stack without `ws_gen` → gen 0;
  - a stack without `ws_holder` → holder = `ws_owner`;
- New fields are additive. The framework never deletes or renames a key the shipped version wrote, except the cooldown key (`cx07`).
- After the upgrade, a 0.3.0 world where the sword was crafted still refunds a new craft. A sword cooling at the upgrade reads ready (`wpn2` on `cx07`).




- **node**: L0-lgnd-r006

### Lgnd r007 concept rule (L0-lgnd-r007)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p005", "L0-lgnd-cx01", "L0-sitm"]
---
**R-lgnd-007: One HUD, holders only, both hands, translate keys only.**

Source: Scythe §6 (*«в основной или второй руке показывать состояние … Ready / remaining time»*); Web Sword §8; C-9; ADR-021 (a single actionbar HUD).

- Exactly one module writes the Action Bar for legendaries. `L0-stgt`/`L0-sprj` supply state through `setBusy`/`start` and never call `setActionBar`.
- The bar is written only for players holding a legendary in either hand. Everyone else's bar is untouched, not even cleared.
- Order is main hand first, then off hand. Remaining time is shown in whole seconds, rounded up, and never 0 while cooling.
- All text is rawtext `translate`. The keys are owned by `L0-sitm` (Scythe) and the shipped lang files (Web Sword).
- This is the add-on's only standing interval (10 ticks). The loss watcher (`L0-lgnd-ad03`) and volley loops (ADR-025) are transient.




- **node**: L0-lgnd-r007

### Lgnd r008 concept rule (L0-lgnd-r008)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p002", "L0-lgnd-ent4"]
---
**R-lgnd-008: Death retention returns every live legendary, exactly once.**

Source: Scythe §1 (*«сохранение при смерти»* as a general rule); Web Sword §4, §12; Q-016 (unlootable).

The shipped code holds **one** `ws_pending` per player, and `findMarkedSword` returns only the **first** marked sword. With two weapons, admin copies and an off hand, that loses items.

- A player who dies carrying N live legendaries (any mix of weapons and admin copies, in any slot including the off hand) gets back each of them after respawn.
- Pending is per weapon and holds an array of marks.
- Restore is idempotent per `(id, gen)`. A repeated spawn/join, a reconnect or a restart grants nothing extra.
- No live legendary item entity remains at the death spot. Another player can never pick one up (Q-016).
- Unmarked copies follow vanilla death drops.




- **node**: L0-lgnd-r008

### Lgnd r009 concept rule (L0-lgnd-r009)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent3", "L0-lgnd-ad05", "L0-sprj", "L0-stgt"]
---
**R-lgnd-009: Busy semantics.**

Source: ASM-017, ADR-025, and the decomposition-plan contract `cooldown.{isReady, isBusy, setBusy, start, remaining}`.

- `busy` means a multi-tick activation of that ability is in progress (a Scythe volley). While busy, `isReady` is false, a second Use of that weapon does nothing and says nothing, and the HUD shows `active`.
- busy and cooldown are independent:
  - A volley ending with 0 hits clears busy and does **not** start a cooldown (Scythe §5).
  - A volley ending with ≥ 1 hit clears busy **and** starts the cooldown in one turn, so no tick sees `isReady` true.
- busy is memory-only. It is false after a restart and cleared when the owner leaves. It is never persisted, so it can never strand an ability in "active".
- The Web Sword never sets busy. Its behaviour is unchanged.




- **node**: L0-lgnd-r009

### Lgnd r010 concept rule (L0-lgnd-r010)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-stgt", "L0-lgnd-as09", "L0-lgnd-cx03", "L0-lgnd-ac14"]
---
**R-lgnd-010: `isHiddenFromTargeting(player)` reads `andrew:hidden_until` as an epoch-ms deadline (C-21).** Source: Scythe §3; L0 C-21.

- **Storage.** The player dynamic property `andrew:hidden_until` (`HIDDEN_UNTIL_KEY`, `src/legendary/hidden.ts:21`) holds a `Date.now()` deadline in **milliseconds**. That is the same clock as the cooldown (`andrew:cd_*`) and busy (`andrew:busy_*`) deadlines and the next UFO arrival. C-21 applies: every durable deadline uses epoch ms. `system.currentTick` restarts with the script engine, and `getAbsoluteTime()` stops under `dodaylightcycle false`.
- **Read.** `isHiddenAt(Date.now(), value)`. A missing or non-number value means not hidden; nothing throws.
- **Write.** `hideFromTargeting(player, seconds)` writes `Date.now() + seconds × 1000`. Zero or less clears it. `/andrew:hide <seconds> [target]` is the operator and test seam. The future Shadow Blade writes the same key in ms, and replaces only the body of `isHiddenFromTargeting`.
- **Durability.** It survives reconnect and restart. A deadline written before a restart is still exact after it.
- **Pack scope.** Dynamic properties are per pack. A player hidden by the release pack reads as not hidden in the GameTest pack (`hidden.ts:24-27`), so a GameTest must hide through its own pack.
- **Not hiding.** Vanilla invisibility is not hiding.

This settles `cx03`: C-21 is now the L0 wording, and ASM-020's "ticks" is retired.




- **node**: L0-lgnd-r010

### Lgnd r011 concept rule (L0-lgnd-r011)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r002"]
---
**R-lgnd-011: Returning an item never reopens the craft right.**

Source: Q-014 (destroying the only sword does not give back the craft right), refined by Q-020 default (a): *returning the item ≠ reopening the craft right*.

- Loss return (`L0-lgnd-p003`) and death retention (`L0-lgnd-p002`) never write `andrew:<p>_crafted`.
- An instance that is not returned (for example removed by `/clear` or `/kill`, which are operator actions and not "ordinary means") leaves the budget spent. The operator remedy stays `reset <weapon>`.
- This applies to the Web Sword too. It changes shipped behaviour (lava and the Void used to destroy the sword for good), under Q-020 (a).




- **node**: L0-lgnd-r011

### Lgnd r012 concept rule (L0-lgnd-r012)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad10", "L0-lgnd-p003", "L0-lgnd-p008", "L0-lgnd-ac09", "L0-lgnd-ac19", "L0-xcx10"]
---
**R-lgnd-012: Legendary destruction policy (all weapons)**

A **live marked** legendary is never lost to ordinary destruction. Which outcome applies depends on the cause:

| Cause | Outcome | Mechanism |
|---|---|---|
| This add-on removes blocks or detonates (Cannon LMB/RMB, any future effect) | **Stays in the world.** Same stack, same `gen`, placed at a safe spot outside the volume. No message. | `protectLegendariesIn` (`p008`) is called **before** the removal |
| RMB drop suppression | Legendary item entities are **never** removed | `isLegendaryItemEntity` exemption (`ring`) |
| Vanilla container break (player, TNT, creeper) | **Drops** as an item entity (vanilla spill) | none; the drop is then watched |
| Fire, lava | **Stays in the world** (`minecraft:fire_resistant`) | none |
| Cactus, vanilla explosion, despawn | **Returned** to `mark.owner` with `gen + 1`, plus `andrew.legendary.recovered`; queued in the owed list if offline | `p003` (deviation C-16) |
| Void (below `heightRange.min`) | Returned, as above (Orbital §5) | `p003` |

Invariants:
- No path grants a copy while a live copy exists. A `gen` bump always comes before a re-issue, and a protective move never bumps `gen` (C-7).
- Unmarked (Creative, `/give`) copies are outside this rule. They behave as vanilla items (`as11`).
- The craft flag is never reopened by any destruction (`r011`).
- The Web Sword, the Scythe and the Cannon are treated the same (Orbital §5 "общее правило").




- **node**: L0-lgnd-r012

### Lgnd r013 concept rule (L0-lgnd-r013)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r012", "L0-lgnd-p008", "L0-lgnd-ac19", "L0-lgnd-ac20", "L0-lgnd-cx12", "L0-xcx10", "L0-pntr", "L0-ring"]
---
**R-lgnd-013: Container-destruction rule**

When a block with an inventory (chest, trapped chest, barrel, hopper, dropper, dispenser, furnace family, brewing stand, shulker box, crafter, decorated pot) that holds a live marked legendary is destroyed, the legendary must survive or drop, never vanish (Orbital §5).

1. **Script removal** (`setType`, `fillBlocks`, `structureManager` overwrite, the Cannon LMB): the caller runs `protectLegendariesIn` over the affected volume **before** the first block change of that tick. Removing such a block without the call is a defect. `ac19` detects it.
2. **Script explosion** (`createExplosion`, the Cannon RMB): the helper runs over the blast AABB (centre ± power) before `createExplosion`. Ordinary contents may then be suppressed (`L0-xasm7`), and a legendary cannot be among them.
3. **Vanilla destruction:** rely on the vanilla spill. The dropped legendary falls under `r012` from then on.
4. **Death of the previous owner** while the legendary sits in a container: nothing happens (Orbital §5). Retention reads only the dying player's own inventory and off hand.
5. **Nested storage** (a legendary inside a shulker-box *item* or a bundle): out of reach of every rule here. Known limit, `cx12`.
6. Containers are never scanned outside a destruction volume (C-4). The helper runs only on demand.




- **node**: L0-lgnd-r013

### Lgnd r014 concept rule (L0-lgnd-r014)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad08", "L0-lgnd-p001", "L0-lgnd-r002", "L0-lgnd-ac15", "L0-xcx9"]
---
**R-lgnd-014: Only a craft token can claim or spend a weapon's craft budget**

- A weapon's one-per-world flag (`andrew:<p>_crafted`) is set only when a `def.craftTokenId` stack reaches a Survival or Adventure player's inventory while the flag is unset.
- A token that arrives while the flag is set is refunded with `def.refund`, and the `craft_blocked` message is sent.
- A plain `def.itemId` stack never claims and is never refunded. That covers vanilla `/give`, the Creative inventory, a Creative copy handed to a Survival player, a structure loot table, and `/replaceitem`. Such a stack stays unmarked, and the gate does not look at it.
- A token in Creative or Spectator is swapped for an unmarked `def.itemId`. The flag is unchanged.
- The token → weapon swap keeps the slot index. Only the `claim` branch stamps `origin: craft`, `owner` = `holder` = the crafter, and `gen: 0`.
- Contract on item JSON, owned by the weapon nodes:
  - Every legendary recipe outputs its token.
  - The token has `menu_category: none`, the weapon's icon and name, and `max_stack_size: 1`.
- `/andrew:<cmd> reset` clears the flag (unchanged). It does not delete tokens that are in flight.




- **node**: L0-lgnd-r014

### Lgnd r015 concept rule (L0-lgnd-r015)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad09", "L0-lgnd-r004", "L0-lgnd-r003", "L0-lgnd-p009", "L0-lgnd-ac16", "L0-adr-orbc"]
---
**R-lgnd-015: Activation modes share one cooldown and resolve through one function**

- `resolveActivation(player, mode)` is the only place that decides which held legendary a press activates. Every ability module calls it and acts only if the answer is its own def.
- `mode = "use"`: main hand, then off hand. Each is a candidate only if `"use" ∈ def.activations`, it is ready and it is not busy.
- `mode = "attack"`: main hand only, and only if `"attack" ∈ def.activations`, it is ready and it is not busy.
- All modes of one def share the def's `abilityKey`, and so share one cooldown and one busy deadline. While cooling, every mode resolves to `undefined`. The press creates nothing and sends no message (Orbital §6).
- The ability module calls `startCooldown` in the same synchronous turn as a successful activation. For the Cannon that is the charge spawn, never the hit. So at most one activation happens per player per tick, across modes.
- The cooldown is per player and ability. Several copies held by one player (Creative, `/give`) share it, and different players are independent (Orbital §7, AC-17).
- A press that finds no valid target writes no state.




- **node**: L0-lgnd-r015

### Lgnd r016 concept rule (L0-lgnd-r016)

**R-lgnd-016 (v7): Legendary weapons are magnetic by operator tuning; craft tokens never are, and magnetism never destroys or duplicates an instance.**

Related: L0-magn, L0-lgnd-ad13, L0-lgnd-ac21, L0-lgnd-ac22.

**History.** UFO §4 / AC 13 said legendaries are never pulled. The operator reversed it on 2026-10-04 (1.6.0, `de0fc68`, "Replaces UFO AC 13 / R-lgnd-016"). This rule is now an **operator-tuned exception** to the spec.

**As built (1.6.1).**
1. The magnet's predicate is `isMagneticStack(stack) = isIronItem || isLegendaryWeaponStack` (`iron.ts:139-140`, `magnet-select.ts:393`). A legendary **weapon** (any def's `itemId`, marked, unmarked or stale) is pulled like iron:
   - on the ground, from container slots, and as a late drop;
   - a player holding one in a hand is lifted (`magnet-hold.ts:117-136`);
   - a mob or armour stand holding one is a class-3 holder, tagged via `hasitem` over `HELD_LEGENDARY_IDS` (`magnet-select.ts:179`, `:320`).
2. A **craft token** is never magnetic: `hasitem` rejects `menu_category: none` items, and a token is a craft in flight (`ad08`).
3. A hopper holding anything is a container, never a pulled block (`decision-resolve-l0-lgnd-cx13`), so no block pull ever removes a holder with a legendary in it; `protectLegendariesIn` has no magnet call site.
4. **The framework invariants still hold under magnetism:** after a pull the world holds exactly one live copy of each marked instance, its gen is unchanged unless a tier-3 loss happened, and a fall death after the hold keeps every held legendary (`ac22`).
5. Every new def is magnetic with no `magn` edit, because the predicate is built from `LEGENDARIES`. The Katana and the crossbow are pulled; the crossbow spec does not list the magnet as a hazard, so this is no breach.




- **node**: L0-lgnd-r016

### Lgnd r017 concept rule (L0-lgnd-r017)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-katn", "L0-lgnd-p003", "L0-lgnd-ad12", "L0-lgnd-ac24", "L0-adr-ktob"]
---
**R-lgnd-017: A wielder teleport is not a loss event, and every Katana teleport stays in the player's own dimension.**

**1. Recovery sees nothing.** The framework's loss triggers are:
- (a) a watched `minecraft:item` entity removed or below the floor;
- (b) a departure from a player slot within ±2 ticks of a `DropItem` swing (`inFlight`);
- (c) a `VOID_HOLDER_TYPES` entity removed below the floor.

`player.teleport` moves the player and the stacks the player holds. It spawns no item entity, raises no `playerInventoryItemChange` and no `DropItem` swing, and removes no minecart. So a Katana activation can trip none of them. This holds even when the teleport is used to escape a Web Sword trap or the magnet's hold (`L0-xasm21`).

**2. Ground items left behind.** If the player teleports away and a watched item's chunk unloads, `recovery.ts:326` logs "unloaded with its chunk" and `entityLoad` re-watches the item. It is **never** returned. The same is true when a player walks away.

**3. Same dimension only.**
- The Katana calls `player.teleport(location, { facingLocation | rotation })` **without** the `dimension` option.
- Every cell it reads uses `player.dimension`.
- An unloaded or out-of-range cell counts as solid (C-12, C-24). A destination in an unloaded chunk is never attempted; the trace stops before it.
- No framework call the Katana makes takes a second dimension. `protectLegendariesIn` is not called at all, because the teleport removes no blocks (`r013` applies only to block-removing effects, and T10 says nothing is destroyed).

**4. Death after a teleport** (into lava, or a fall the one-shot flag does not cover) goes through cause-agnostic retention (`r008`, `ac22` precedent).

**Violation signal.** A `[andrew] legendary recovery: … lost` or `returned` log line during a Katana GameTest where no item was dropped.




- **node**: L0-lgnd-r017

### Lgnd r018 concept rule (L0-lgnd-r018)

**R-lgnd-018: A passive legendary has every legendary property and no ability property.**

Related: L0-lgnd-ad15, L0-lgnd-r004, L0-lgnd-r007, L0-xcx24.

A def with `hasAbility(def) === false`:
1. **Never claims a Use.** `resolveActivation` skips it. With a passive def in the main hand and a ready active def in the off hand, the off hand answers the Use. This is a new case of `r004`: a passive main hand counts as "no ready ability", like a cooling one.
2. **Never draws a HUD line.** A player holding only passive legendaries receives no `setActionBar` call from the HUD. Holding a passive and an active one shows only the active line.
3. **Never writes or reads a timer.** No `andrew:cd_*` or `andrew:busy_*` key exists for it, and `defForAbility` never returns it.
4. **Keeps every other legendary rule unchanged**: the craft gate and broadcast, marks and generation, death retention (both hands), loss return and the owed list, `protectLegendariesIn`, magnetism (`r016`), operator commands.

Defs #1–#4 are active. Their behaviour, keys and HUD strings do not change.




- **node**: L0-lgnd-r018

### Constraints · `sclk` (component NFRs; inherits C-1 … C-28) (L0-sclk-cons)

# Constraints · `sclk` (component NFRs; inherits C-1 … C-28)

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["constraints"]` · `relates_to: ["L0-sclk-as04", "L0-sclk-ad04"]`

| Id | Constraint | From |
|---|---|---|
| K-sclk-1 | Zero per-tick cost when no bolt is alive and the carve queue is empty. No world scans, ever. | C-5f, §11 |
| K-sclk-2 | ≤ 3 trail particles per bolt per tick; bolt lifetime ≤ 100 ticks | C-5f, `xasm27` |
| K-sclk-3 | ≤ 300 `setType` per tick from the carve queue; no `runJob`, no new `runInterval` | ad04 |
| K-sclk-4 | Stable `@minecraft/server` 2.10.0 only; no Experiments; deviations are documented in the README | C-16, §13 |
| K-sclk-5 | Server-authoritative: every hit, damage and edit decision is in the BP script; the RP is cosmetic | §11 |
| K-sclk-6 | Edits respect C-12 (no unloaded writes) and C-27 (box, protect-first, deny list) | C-27 |
| K-sclk-7 | Acceptance with ≥ 2 SimulatedPlayers per combat test (a shooter plus a target or bystander) on the **checks** BDS; GameTests never default to production | C-20‴ |
| K-sclk-8 | Pure planners (`crater-plan.ts`, the speed gate, Piercing stripping) are node-tested with no `@minecraft/server` import. Platform quirk: `addEnchantments` silently drops a conflicting element and does not throw, while `canAddEnchantment` on a conflict throws `EnchantmentLevelOutOfBoundsError` instead of returning false | the repo pattern |
| K-sclk-9 | Defs #1–#4 keep byte-identical behaviour; the Orbital carve is unchanged after the deny-list move | `xcx24`, `xcx25` |




- **node**: L0-sclk-cons

### Sclk r001 concept rule (L0-sclk-r001)

**R-sclk-001 · One arrow → one bolt → at most one outcome (C-26, §8, §11)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-sclk-p002", "L0-sclk-p004", "L0-sclk-p005", "L0-sclk-ent3"]`

- Each substituted arrow gives **exactly one** bolt. Emulated Multishot gives exactly two more. Each bolt has its own `BoltRecord`.
- A record resolves **at most once**, to exactly one of: `entity` (p004), `block` (p005) or `expired` (p003). The handler deletes the record **before** acting, so a duplicate event (hit-entity then hit-block) is a no-op.
- Three Multishot bolts are three records. They are never merged into one hit, one damage call or one carve job.
- No other path damages an entity: not the trail, not the crater and not the patch.

Source: §8 ("each processed independently"), §11 ("cannot merge three arrows into one hit event"), §14.




- **node**: L0-sclk-r001

### Sclk r002 concept rule (L0-sclk-r002)

**R-sclk-002 · Fixed Sonic Boom damage (C-28)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-xasm23", "L0-xcx22", "L0-adr-scdm", "L0-scyt", "L0-sclk-p004"]`

- `SONIC_BOOM_DAMAGE = 10` (HP). It is exported from one module (`src/sculk/constants.ts`) and read by the GameTests (`xasm23`; the probe's Q8 may replace the value, never the shape).
- Every living direct hit takes **exactly D** from absorption, then health, or kills the target if hp ≤ D. This holds:
  - at any difficulty (T07);
  - with any armour, Protection level or raised shield (T08) — which holds only because the cause is `sonicBoom`;
  - inside the hurt-invulnerability window (T17, `xcx22`).
- The mechanism is `sonicBoom`-cause `applyDamage` (exact through armour, Protection and a raised shield, absorption first), plus `setCurrentValue(hp − D)` only inside a known window. If hp ≤ D, it is an overkill `applyDamage(hp + 100)` with the same cause. The shipped Scythe pattern it descends from spans `volley.ts:115-133`.
- `damagingEntity` is the bolt's owner while the owner is valid, so the kill credit and the death message name the shooter.
- No vanilla arrow damage, no Power bonus, no crit bonus and no tipped effect is ever added (§9, §14).
- A totem of undying still works, because the lethal path goes through `applyDamage` with cause `sonicBoom`; an `entityAttack` overkill is stopped by a raised shield instead.




- **node**: L0-sclk-r002

### Sclk r003 concept rule (L0-sclk-r003)

**R-sclk-003 · Crater shape and bounds (§6, C-27)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-adr-sctr", "L0-sclk-ent4", "L0-sclk-p005"]`

- The footprint is a 5×5 square centred on the impact cell, in the plane of the hit face. The depth goes ≤ 3 cells into the face, from the impact cell inward. The crater never leaves this 5×5×3 box.
- Shape: an ellipsoid with semi-axes ≈ (2.5, 2.5, 3), each surface cell jittered by `seed`. **The impact cell and the cell behind it are always carved**, so the centre is ≥ 2 deep.
- Irregularity: on flat stone, at least one of the 25 footprint columns at the rim is left uncarved, so it is never a perfect box.
- The same `(impact, face, seed)` always gives the same cells (a pure function, node-tested).
- Side and ceiling hits carve into the face hit, not downward.
- The skip rules are r010 and `xasm25`: air, liquids, the deny list, unloaded cells and cells out of height range.




- **node**: L0-sclk-r003

### Sclk r004 concept rule (L0-sclk-r004)

**R-sclk-004 · Sculk placement (§5, §7, C-27)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-xasm24", "L0-sclk-ent4", "L0-sclk-p004", "L0-sclk-p005"]`

- The only block placed is `minecraft:sculk`. Never a sensor, shrieker, catalyst or vein.
- **Eligible cell:** a solid full block (not a liquid, a container, a block entity, the deny list, or air) with an air or passable block on the exposed side.
  - Block hit: the cells form the crater's new inner surface plus the rim surface, inside the 5×5 around the impact.
  - Entity hit: the top surface under the target.
- **Box:** ≤ 5×5 in footprint, centred on the impact column (block hit) or on the target's feet column (entity hit). For an entity hit, the surface is searched ≤ 6 blocks below the feet (`xasm24`); if there is none, there is no patch.
- **Ragged edge:** the corner cells and about 30 % of the outer-ring cells are skipped by `seed` (§5, "not a perfect square").
- Sculk is permanent. There is no timer and no rollback. It survives a chunk or server reload as an ordinary block.
- The patch happens only as a bolt outcome. No other path places sculk (§7).




- **node**: L0-sclk-r004

### Sclk r005 concept rule (L0-sclk-r005)

**R-sclk-005 · Enchantments (§8)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-sclk-ad01", "L0-sclk-cx01", "L0-adr-scbs", "L0-sclk-as05"]`

- **Allowed:** Quick Charge (I–III), Multishot, Unbreaking (no effect, since there is no durability) and Mending (no effect).
- **Piercing is forbidden.**
  - Any `andrew:sculk_crossbow` stack found with `piercing` loses it. This is checked on `playerInventoryItemChange`, on a held-item change and on craft-token delivery.
  - The stack keeps its other enchantments. No XP is refunded.
  - Log `sculk: stripped piercing from <player>`.
- Even before a strip lands, Piercing never changes an outcome. A bolt resolves once (r001), so a pierce-through is impossible by construction.
- **Quick Charge** shortens the required charge time. Natively it is the vanilla 1.25 s − 0.25 s × level. When emulated (`as05`), the release-speed gate (r006) takes the same table.
- **Multishot** gives three bolts: native or emulated at ±10° yaw (`as05`), one arrow consumed.




- **node**: L0-sclk-r005

### Sclk r006 concept rule (L0-sclk-r006)

**R-sclk-006 · Ammunition and charge (§9, `xasm27`)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-xasm27", "L0-sclk-cx02", "L0-sclk-ad01", "L0-sclk-p002"]`

- **Ammunition:** `minecraft:arrow` in every variant (plain, tipped, spectral). No firework rockets. Tipped and spectral effects are discarded.
- **Consumption:** as the engine spends it. In Survival, one arrow per shot, Multishot included. In Creative, none.
- **The reload is the only limiter** (§9: no cooldown).
  - A shot is charged if its **loading draw** lasted ≥ 25 − 5·QC ticks. Speed cannot tell: every fired arrow leaves at full speed (2.965–3.041 measured), so there is no under-charged arrow to detect.
  - Quick Charge does **not** natively shorten the time to full charge; shortening it is script work (`as05`).
  - An under-length release fires nothing and spends nothing — the native gate admits no early shot (`cx02`).
- **Bolts are never picked up.** They are removed on their outcome or on expiry.
- **Lifetime:** `BOLT_LIFETIME_TICKS = 100`.




- **node**: L0-sclk-r006

### Sclk r007 concept rule (L0-sclk-r007)

**R-sclk-007 · The trail is visual only and bounded (§4, §11, C-5f)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-sclk-p003", "L0-sclk-ad02"]`

- The trail is emitted only for a bolt with a live record, from the shared interval, at ≤ `TRAIL_PER_TICK` = 3 particles per bolt per tick. It is placed on the segment between the bolt's last and current real positions.
- Worst case: one player, a Multishot volley of 3 bolts × 3 particles × 100 ticks = 900 particle spawns in 5 s.
- The trail has no damage, no knockback, no block edits, no sound loop and no entity. No dummy entity carries it.
- Nothing lingers after the bolt dies: the particle's own lifetime is ≤ 1 s (an RP look-alike sets `max_lifetime ≤ 1`).
- The bolt itself is the physical projectile. The trail is never a hitscan ray (§9).




- **node**: L0-sclk-r007

### Sclk r008 concept rule (L0-sclk-r008)

**R-sclk-008 · Infinite durability (§1, §3, T18)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-sclk-ent1", "L0-adr-scbs"]`

- Under option A (`adr-scbs`), the item JSON has **no `minecraft:durability`** component, so shots, melee and use never create a damage value. `ItemStack.getComponent("minecraft:durability")` is `undefined`.
- Under option B (a fallback, `lgnd`-owned): after each shot, the script resets `durability.damage = 0` on the marked stack. T18 then goes to `lgnd` (plan routing).
- An anvil cannot "repair" it, and Unbreaking or Mending change nothing. Both are allowed (r005).




- **node**: L0-sclk-r008

### Sclk r009 concept rule (L0-sclk-r009)

**R-sclk-009 · Passive legendary: no ability, no cooldown, no HUD (§1, §9, §10, `xcx24`)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-xcx24", "L0-lgnd"]`

- Def #5 has no ability block. It writes no cooldown or busy key, never claims a Use in `resolveActivation`, and never adds an Action Bar line.
- With the crossbow in one hand and the Katana, Cannon or Scythe in the other, the other weapon's Use and HUD behave as they do today.
- Holding the crossbow alone shows **no** "Ready" line.
- `sclk` adds no other framework hook. Any further need is a new L0 contradiction (plan, reduce §1).




- **node**: L0-sclk-r009

### Sclk r010 concept rule (L0-sclk-r010)

**R-sclk-010 · One shared deny list for weapon terrain edits (C-7, `xcx25`)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-xcx25", "L0-adr-sctr", "L0-orbc", "L0-pntr", "L0-xasm6"]`

- `PENETRATOR_KEEP` (`src/orbital/penetrator-keep.ts:34`) moves to `src/terrain/keep.ts`, exported as `TERRAIN_KEEP`. `penetrator-keep.ts` re-exports it, or its imports are updated, so the Orbital behaviour is byte-identical.
- The crossbow crater and the sculk patch never `setType` a block in `TERRAIN_KEEP`.
- No per-weapon copy or extension. If the crossbow needs an extra exclusion, it goes into the shared list and the Orbital gate re-runs.
- Liquids are skipped by the crater (`xasm25`), not by the list. The list keeps its Orbital meaning.




- **node**: L0-sclk-r010

