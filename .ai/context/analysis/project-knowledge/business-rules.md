---
title: Business Rules
type: project-knowledge
generated_at: "2026-09-29T23:30:38.803Z"
source_channel: rollout
node_id: rollout-business-rules
aliases: ["rollout-business-rules","business-rules","project-knowledge/business-rules"]
is_a: ["rollout","business-rules"]
relates_to: ["L0","L0-lgnd-r001","L0-lgnd-r002","L0-lgnd-r003","L0-lgnd-r004","L0-lgnd-r005","L0-lgnd-r006","L0-lgnd-r007","L0-lgnd-r008","L0-lgnd-r009","L0-lgnd-r010","L0-lgnd-r011","L0-lgnd-r012","L0-lgnd-r013","L0-lgnd-r014","L0-lgnd-r015","L0-orbc-r001","L0-orbc-r002","L0-orbc-r003","L0-orbc-r004","L0-orbc-r005","L0-orbc-r006","L0-orbc-r007","L0-orbc-r008","L0-orbc-r009","L0-orbc-r010","L0-orbc-r011","L0-orbc-r012","L0-orbc-r013","L0-orbc-r014","L0-pntr-cons","L0-pntr-r001","L0-pntr-r002","L0-pntr-r003","L0-pntr-r004","L0-pntr-r005","L0-pntr-r006","L0-pntr-r007","L0-pntr-r008","L0-pntr-r009","L0-ring-cons","L0-ring-r001","L0-ring-r002","L0-ring-r003","L0-ring-r004","L0-ring-r005","L0-ring-r006","L0-ring-r007","L0-ring-r008","L0-ring-r009","L0-ring-r010"]
priority: 540
---

# Business Rules

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Global Constraints (L0)

# Global Constraints

C-1 … C-14 from v2 are carried unchanged (Bedrock only; stable `@minecraft/server` 2.10.0 through `scripts/targets.mjs`; retarget on error; `andrew:` + RU/EN; tick budgets C-5a/C-5b; durable bounded state; no duplication; reproducible build; the `bds`/`ipad` split; before-events never mutate; stage gating; never write into unloaded chunks; structure blocks are ordinary; dimension locks). v3 adds or tightens:

| ID | Constraint | Source |
|---|---|---|
| C-5a′ | *(tightened)* A weapon attack may run a bounded, self-terminating job, and only while its charges exist. No permanent per-tick loop. LMB block removal is batched through `system.runJob`, but it must *look* instant: the whole column goes within the detonation tick or the next few ticks. RMB may have ≈160 live charges from one player, and several players may fire at once. The budget must hold at that load. | Orbital §9, §12, §15 |
| C-7′ | *(extended)* No duplication of **any** legendary through death, a container, the Void, logout/rejoin, concurrent actions **or the Cannon's own effects**. Destroyed containers and blast zones must neither lose a legendary nor copy it. | Orbital §5, §15 |
| C-15 | *(new)* Priority order on conflict: (1) no duplication or save corruption, (2) correct gameplay, (3) MP sync and performance, (4) visual fidelity. | Orbital §16 |
| C-16 | *(new)* Every known stable-API limitation used by a weapon is documented **next to the implementation**, in code comments plus the weapon's deviation notes, not only in the analysis. | Orbital §12, §15 |
| C-17 | *(new)* Cooldowns are per player and shared across all of that player's copies of the same weapon. The cooldown starts on successful activation and is never refunded when a charge is lost. It persists across restart. | Orbital §6, §7, §11 |
| C-18 | *(new)* Copies from Creative or `/give` never read or change the Survival craft flag. | Orbital §4 |
| C-19 | *(new)* After an attack, every temporary entity is gone and no uncontrolled item entities are left behind. Mass RMB must not multiply entities or drops. | Orbital §15 |
| C-20 | *(new)* Weapon acceptance involves at least two players (cooldown independence, transfer, death, sync). | Orbital §15 |




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
relates_to: ["L0-stgt", "L0-sqat", "L0-lgnd-cx03", "L0-lgnd-p007"]
---
**R-lgnd-010: `isHiddenFromTargeting(player)` contract.**

Source: ASM-020; the boundary (Shadow Blade is out of scope, only a read-only predicate); CTR-014; Q-022.

- Signature: `isHiddenFromTargeting(player: Player): boolean`. Pure read, no side effects, safe to call per candidate during a target search.
- Backing store: player dynamic property `andrew:hidden_until`, a number. Hidden iff it is a number **and** greater than `Date.now()`, i.e. epoch ms (see `L0-lgnd-cx03` for why not ticks).
- Absent, non-number or expired → `false`. With no Shadow Blade in the world it always returns false, as the boundary requires.
- Writers: today only `/andrew:hide` and GameTest. Tomorrow, Shadow Blade. No v3 weapon module writes it.
- The key is unprefixed on purpose: it is a cross-weapon contract, not Shadow Blade's private state. If Shadow Blade arrives with a different model (a tag or an effect), only this adapter changes (ASM-020 impact).




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
| Item entity burnt (fire, lava), cactus, vanilla explosion, despawn | **Returned** to the last holder with `gen + 1`, plus a private `returned` message; queued in the owed list if the holder is offline | `p003` (deviation C-16) |
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

### Rule · Item identity: a rod icon with no rod behaviour (L0-orbc-r001)

# Rule · Item identity: a rod icon with no rod behaviour

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-ent1", "L0-xcx13"]`

The Cannon must:
- show the vanilla `fishing_rod` icon, with no custom texture;
- never cast a bobber or catch anything;
- never lose durability;
- be rejected by the enchanting table and the anvil, including combining with books;
- deal an empty-hand punch in melee, with no knockback or effect bonus;
- appear under Creative → Equipment and in search/All;
- be obtainable with `/give`.

**Implementation.** These follow from the item JSON **omitting** `durability`, `enchantable`, `damage`, `digger`, `use_modifiers`, `shooter` and `throwable` (`ent1`). Nothing is enforced by script.

Source: Orbital §2 and §4. Deviation: the in-hand model is the icon sprite, not the vanilla cast/reeled model (`xcx13`, C-16).




- **node**: L0-orbc-r001

### Rule · Recipe and lang (L0-orbc-r002)

# Rule · Recipe and lang

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-lgnd", "L0-orbc-cx01"]`

**Recipe** (`packs/behavior/recipes/orbital_cannon.json`, shaped, `crafting_table`):
```
 T
TRT
 T
```
- `T = minecraft:tnt`, `R = minecraft:fishing_rod`, result 1× `andrew:orbital_cannon`.
- Spaces are empty and must stay empty. A shaped recipe with no `unlock` shows in the recipe book, as the other legendaries do.
- A *damaged or enchanted* fishing rod is still accepted, because the recipe matches by item id. The item is consumed.
- Whether a craft counts is decided by `lgnd` (`L0-lgnd` craft gate, ACs 1–2). The refund is `4 TNT + 1 fishing rod` (`ent1`).

**Lang** (`en_US.lang`, `ru_RU.lang`), minimum set:
| Key | EN | RU |
|---|---|---|
| `item.andrew:orbital_cannon.name` | Orbital Cannon | Орбитальная пушка |
| `andrew.orbital.first_craft` | §e%s§r forged the legendary §b%s§r! | the RU equivalent |
| `andrew.orbital.craft_blocked` | The world's only Orbital Cannon already exists — ingredients returned | the RU equivalent |
| `andrew.orbital.returned` / `admin_given` / `reset` | as for the other legendaries | the RU equivalent |

The Ready and cooldown strings come from the shared `andrew.legendary.ready` and `andrew.legendary.cooldown` keys (`r012`). See `cx01` for the wording gap. No user-facing string is hard-coded (§13).




- **node**: L0-orbc-r002

### Rule · The target is a block within 10 blocks, on any face (L0-orbc-r003)

# Rule · The target is a block within 10 blocks, on any face

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-ad01", "L0-xcx8", "L0-orbc-ent2"]`

- The target is the **block that was hit**, on top, bottom or side. It is not the adjacent block. Its (x, z) column is the attack's column. Its Y is the reference for spawn height (`r007`).
- The range is measured from the eye to the hit point: `maxDistance: 10`.
- Blocks that do not count as targets:
  - air;
  - liquids (`includeLiquidBlocks: false`);
  - passable blocks such as grass, flowers, torches and snow layer (`includePassableBlocks: false`). The ray passes through these to the block behind them.
- Entities in the way do not block the ray. `getBlockFromViewDirection` ignores entities.
- Both modes use the same rule and the same distance, **subject to `L0-xcx8`**: until `L0-xq5` is answered, LMB is physically limited to the vanilla reach.
- **No marker.** There is no particle, outline or HUD hint. The vanilla highlight is the only aim cue (§6).

Source: Orbital §6.




- **node**: L0-orbc-r003

### Rule · With no target, nothing happens (L0-orbc-r004)

# Rule · With no target, nothing happens

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-p001", "L0-orbc-ac03"]`

When the target resolution in `p001` step 5 returns nothing:
- no charge is spawned;
- no cooldown is written, so `andrew:cd_orbital_cannon` is unchanged;
- no chat message, Action Bar override, title or sound is shown;
- the dedup tick is **not** consumed, so a second event in the same tick may still succeed.

This differs deliberately from the Scythe, which says `andrew.scythe.no_target`. The Cannon has no `no_target` lang key.

Source: Orbital §6 and AC-3.




- **node**: L0-orbc-r004

### Rule · One shared 30 s cooldown, started on activation (L0-orbc-r005)

# Rule · One shared 30 s cooldown, started on activation

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-lgnd", "L0-orbc-p001", "L0-orbc-ac16"]`

- LMB and RMB read and write **one** key, `cooldownKey("orbital_cannon")` = `andrew:cd_orbital_cannon`. Its length is `cooldownTicks 600` (30 s). The storage is `lgnd`'s `cooldown.ts`: an epoch-ms deadline in a player dynamic property. It is per player and shared by all of that player's copies (C-17, AC-17 is owned by `lgnd`).
- The cooldown is written in the activation tick, after the target is validated and **before** any charge moves (`xasm10`). It is not written on hit, detonation or when the charge lands.
- While the cooldown runs, both modes are blocked silently (`as06`).
- It is **never refunded or shortened** by any charge outcome: void, lost, unload, restart or timeout. It is also unaffected by the owner dying or leaving.
- Operators can clear it through `/andrew:orbital reset`, if `lgnd` commands expose it. Otherwise only time clears it.

Source: Orbital §6, §8, §11; C-17.




- **node**: L0-orbc-r005

### Rule · At most one activation per player per tick (L0-orbc-r006)

# Rule · At most one activation per player per tick

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-xasm10", "L0-orbc-p001", "L0-orbc-ac09"]`

- A single press can raise several events in one tick:
  - `itemUse` together with `itemUseOn` or `playerInteractWithBlock`;
  - on touch, `entityHitBlock` together with a use.
- The **first** event in a tick that passes `p001` steps 1–5 activates.
- Every later event from the same player in that tick is ignored. It creates no charge and makes no second cooldown write.
- The mode is that of the first event.

**Implementation.** `Map<playerId, tick>` in memory. It is cleared on `playerLeave`, and nothing is persisted.

The cooldown check alone already stops a second attack. The explicit tick guard also covers the window where `startCooldown` has been written but a same-tick event was queued before it. Script events are synchronous, so this is defensive rather than required.




- **node**: L0-orbc-r006

### Rule · Charge spawn height per dimension, clamped to the ceiling (L0-orbc-r007)

# Rule · Charge spawn height per dimension, clamped to the ceiling

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-cx03", "L0-orbc-as01", "L0-orbc-ac04"]`

`spawnY = min(target.y + OFFSET[dim], dim.heightRange.max − 1)`

| Dimension | `OFFSET` |
|---|---|
| `minecraft:overworld` | 30 |
| `minecraft:the_end` | 30 |
| `minecraft:nether` | 10 |
| any other dimension (future-proof) | 30 |

- `heightRange.max` is the first Y *above* the build limit (`src/structures/site.ts`). So `max − 1` is the highest placeable cell: 319 in the Overworld, 127 in the Nether and 255 in the End.
- There is no lower clamp. `target.y` is always ≥ `heightRange.min`.
- **All charges of one attack share `spawnY`**, which is derived from the target block. They do not use their own column's terrain. RMB "fall at the same time" therefore holds (§10), and the actual blast time varies with the terrain.
- The clamp is only an upper bound. If the clamped cell is solid (for example the Nether's bedrock roof), `r008`'s inside-solid rule applies. See `cx03`.

Source: Orbital §8 and AC-4.




- **node**: L0-orbc-r007

### Rule · Contact: charges stop on blocks, never on entities (L0-orbc-r008)

# Rule · Contact: charges stop on blocks, never on entities

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-as03", "L0-orbc-p002", "L0-orbc-ac05", "L0-orbc-ac06"]`

`isContact(block)` is true when all of these hold:
- the block is not air;
- it is not a liquid (water, lava, or a flowing variant);
- it is not in the `PASS_THROUGH` set (`as03`).

The rule:
- **At spawn**, if the spawn cell is a contact block, the charge detonates at once, at that cell (§8, AC-5). This holds even at the clamped ceiling.
- **In flight**, the first contact cell swept (`p002`) is the detonation point. No cell is skipped, whatever the fall speed.
- **Entities never stop a charge.** Collision is 0, physics has no collision, and the sweep never queries entities. Players, mobs, item entities, boats and minecarts are all passed through (AC-6).
- **Liquids never stop a charge.** It sinks through water and lava to the solid floor. That is what lets `ring`'s "underwater = damage only" case (§10) and `pntr`'s "liquids stay" case (§9) occur.
- **Survival-unbreakable blocks** (bedrock and so on) are contact blocks. A charge landing on bedrock detonates there. Whether the effect continues below it is `pntr`'s business (`xasm6`).




- **node**: L0-orbc-r008

### Rule · The Void destroys a charge without effect (L0-orbc-r009)

# Rule · The Void destroys a charge without effect

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-p002", "L0-orbc-r005", "L0-orbc-ac07"]`

- A charge whose next Y is below `dim.heightRange.min` without meeting a contact cell is removed. For example, the End outer islands, or a column already cut to bedrock-less air by an earlier LMB.
- It gets **no** `onDetonate`, no sound and no particle.
- The attack's cooldown stays (§8).
- This is the *charge* Void rule. The Void rule for the *item* (return to the last holder) is `lgnd`'s (`L0-xcx11`, `L0-adr-hold`).




- **node**: L0-orbc-r009

### Rule · After firing, the attack does not depend on its owner and stays in its dimension (L0-orbc-r010)

# Rule · After firing, the attack does not depend on its owner and stays in its dimension

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-p003", "L0-ring", "L0-orbc-ac18"]`

Once charges are spawned, none of these cancels, pauses, redirects or accelerates them:
- the owner's death;
- a hand or slot change, or dropping or giving away the Cannon;
- the owner logging out;
- the owner changing dimension.

**Details.**
- Charges only ever exist in the `dimensionId` of the attack. They are moved with `teleport` inside that dimension and are never re-spawned elsewhere.
- The attack keeps `ownerId` as a string. The effects may *look up* the owner (for example `ring`'s explosion `source` and self-damage), but they must accept that the owner is absent. With no owner, the blast still happens, with no source.
- It is not required that the owner's own position keeps the area loaded. If the area stays loaded because of another player, the attack completes. If it does not, `r011` applies.

Source: Orbital §11 and AC-18.




- **node**: L0-orbc-r010

### Rule · On unload or restart, in-flight charges are lost (L0-orbc-r011)

# Rule · On unload or restart, in-flight charges are lost

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-p003", "L0-orbc-ad03", "L0-orbc-ac19"]`

- There is no ticking area, force-load or chunk pinning for charges (§11).
- A charge whose entity is invalidated, or whose next cell is in an unloaded chunk, is **lost**:
  - it is removed from the attack;
  - it gets no `onDetonate`;
  - no cooldown change is made.
- Charges that were in flight during a server shutdown are not saved or restored. On the next start, and on each later chunk load, stale charge entities are removed and **never detonate** (`p003`).
- What survives a restart: the cooldown (a `lgnd` dynamic property) and the craft flag (`lgnd`).
- A lost charge leaves no entity behind once its chunk is next loaded (C-19).

Source: Orbital §11 and AC-19.




- **node**: L0-orbc-r011

### Rule · HUD (Action Bar) (L0-orbc-r012)

# Rule · HUD (Action Bar)

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-lgnd", "L0-orbc-cx01", "L0-orbc-ac10"]`

- The HUD is rendered by the shared `src/legendary/hud.ts`, every 10 ticks. The Cannon joins by being in `LEGENDARIES`. It adds no HUD code of its own.
- It is shown while the Cannon is in the **main or off hand** (§7). The off hand needs `allow_off_hand` (`ent1`, `L0-lgnd-cx08`).
- **Ready:** `{name} — Ready`, `Орбитальная пушка — Готово`.
- **Cooldown:** `{name} — {ceil(remaining s)}s`, `…— 27с`.

  The remaining time is read from the shared per-player key. Every copy the player holds shows the same number.
- If a Web Sword or Scythe is held in the other hand, both segments are shown, separated by three spaces (existing behaviour).
- The HUD is independent per player. It never shows another player's cooldown.
- The wording is **pending `cx01`**. The shared keys currently render `Orbital Cannon: Ready` and `Orbital Cannon: 27 s`.




- **node**: L0-orbc-r012

### Rule · Deviation notes live next to the code (L0-orbc-r013)

# Rule · Deviation notes live next to the code

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-xcx8", "L0-xcx13", "L0-orbc-cx02", "L0-orbc-cx03", "L0-orbc-ad02"]`

The header of `src/orbital/README.md` or `src/orbital/index.ts` must list every stable-API compromise the core makes, each with its KV id (C-16). The list includes:
1. The item is a custom item with the rod icon, not a real fishing rod (`xcx13`).
2. LMB reach and the answer to `xq5` (`xcx8`).
3. The touch aim point (`cx02`).
4. Nether roof behaviour under the clamp (`cx03`).
5. The charge is script-teleported, not physics-driven, so it has no interpolation guarantee (`ad02`).
6. In-flight charges are lost on unload or restart (§11).
7. There is no stable "swing at nothing" event.

A task is not done until the list matches the shipped behaviour.




- **node**: L0-orbc-r013

### Rule · The charge contract published to `pntr` and `ring` (L0-orbc-r014)

# Rule · The charge contract published to `pntr` and `ring`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-pntr", "L0-ring", "L0-orbc-p002", "L0-orbc-r007", "L0-orbc-r011"]`

`src/orbital/charge.ts` exports:
```ts
type Mode = "lmb" | "rmb";
interface Effect {
  /** Charge columns (x,z) for an attack locked on `target`. LMB: [target.xz]. */
  layout(target: Vector3): Array<{x: number; z: number}>;
  /** Called once per charge at its contact cell. Must be synchronous-safe; heavy work goes to its own bounded runJob. */
  onDetonate(dim: Dimension, point: Vector3, ownerId: string, mode: Mode, attackId: string): void;
  scale: 0 | 1;          // 1.2× TNT for LMB, 1.0× for RMB
}
registerEffect(mode: Mode, effect: Effect): void;
```

**Guarantees from `orbc`:**
- `point` is an integer block location of a contact block (`r008`) in a loaded chunk.
- `onDetonate` is called at most once per charge.
- It is never called for a voided or lost charge, or an orphan.
- The owner may be offline.
- There is no refund path.

**Duties of effects:**
- Never move or remove other charges.
- Tolerate multiple `onDetonate` calls for one `attackId` in one tick (RMB).
- Own all block, entity and drop rules.

Any effect that needs a different charge behaviour (speed, collision, height) raises an L0 contradiction; it does not fork the charge (L0 reduce plan).




- **node**: L0-orbc-r014

### Penetrator NFRs (refining C-5a′, C-14, C-15, C-16 and C-19) (L0-pntr-cons)

# Penetrator NFRs (refining C-5a′, C-14, C-15, C-16 and C-19)

| ID | NFR | Measured by |
|---|---|---|
| PN-1 | **Looks instant.** The top 16 layers are removed in the detonation tick. The whole column is removed within **≤ 3 ticks** for a typical Overworld column (~140 layers) and **≤ 6 ticks** for the worst case (y 319 → −64, ~9,600 cells) on BDS 1.26.x. | `report.ticksUsed` in a gametest |
| PN-2 | **Budget.** No `pntr` job step exceeds its `runJob` slice. The server tick time must not rise above 50 ms because of one LMB, and with **3 concurrent LMBs** it must not stay above 50 ms for more than 2 consecutive ticks. | A BDS tick-time probe, next to the `ring` load probe |
| PN-3 | **Bounded.** 2 jobs per attack, both self-terminating, and 0 entities spawned. The wave is ≤ 16 `spawnParticle` calls per tick for 20 ticks. | Code review plus a gametest entity count |
| PN-4 | **No force-load.** Unloaded cells are skipped (C-14). | A gametest at a chunk edge |
| PN-5 | **Safety first.** A protection failure keeps the container (C-15 rank 1 beats rank 4). | A unit test with a mocked `lgnd` that throws |
| PN-6 | **Documented deviations** (C-16), next to the code: the keep list is a list, not a hardness query; item frames (`cx01`); nested storage items (`as05`); waterlogged handling (`as04`). | Code review |

If PN-1 and PN-2 cannot both hold, PN-2 wins (C-15 rank 3 over rank 4). The fallback is to relax PN-1 to "≤ 10 ticks", documented as a deviation (see `L0-pntr-as03`).




- **node**: L0-pntr-cons

### Column geometry (L0-pntr-r001)

**Rule R-pntr-1 · Column geometry.**
- **Vertical:** from the detonation cell (inclusive) down to `dimension.heightRange.min` (inclusive). Nothing above the detonation cell is affected.
- **Horizontal:** a roughly 5×5 footprint centred on the detonation cell's `(x, z)`:
  - the 3×3 core is always included;
  - each of the 12 non-corner cells of the 5×5 ring is included with high probability;
  - each of the 4 corners is included with ~50% probability;
  - a few cells on the 7×7 rim are included with low probability.
- The mask changes every 4-layer band, so the walls look blast-ragged rather than square (Orbital §9: "not perfectly square… like TNT aftermath").
- The number of removed cells per layer (before classification) stays between 9 and 33. The expected value is about 25.

**Rationale.** The spec asks for "approximately 5×5" with "small natural irregularity". The 3×3 core guarantees a continuous, passable shaft for AC-7. The band-level variation avoids per-block noise that would look like a render glitch.

**Test hook.** The mask is a pure function of `attackId` (`L0-pntr-ent1`), so a gametest can assert the exact cell set.




- **node**: L0-pntr-r001

### Keep liquids and Survival-unbreakable blocks, never stop below them (L0-pntr-r002)

**Rule R-pntr-2 · Keep set, and no early stop.**

A column cell is **kept** (left untouched) when it is:
- air of any kind;
- a liquid: `water`, `flowing_water`, `lava`, `flowing_lava`;
- on the `L0-xasm6` deny list of Survival-unbreakable blocks: `bedrock`, `end_portal_frame`, `end_portal`, `end_gateway`, `barrier`, `light_block`, the command blocks, `structure_block`, `structure_void`, `jigsaw`, `allow`, `deny`, `border_block`, `invisible_bedrock`, `moving_block`, and the piston arm collisions.

A kept cell **never** ends the column. Processing continues with the next layer down (Orbital §9: "must not stop the calculation below them"). For example, a 5×5 column through an ocean floor removes the stone under the water and keeps the water, and the water then falls. A column through bedrock at the Overworld bottom keeps the bedrock and removes nothing else, because nothing is below it.

Waterlogged solids are neither purely kept nor purely removed: the solid part goes and the water stays (`L0-pntr-as04`).

**Source of truth.** The list is one exported constant in `src/orbital/` with a unit test (`xasm6`). `ring` does not use it.




- **node**: L0-pntr-r002

### Remove everything else, ignoring blast resistance (L0-pntr-r003)

**Rule R-pntr-3 · Remove everything not kept.**

Every column cell that is not in the keep set (`L0-pntr-r002`) is removed, **whatever its blast resistance** (Orbital §9: "even if ordinary TNT does not destroy them"). This explicitly includes:
- `obsidian`, `crying_obsidian`, `respawn_anchor`, `ancient_debris`, `reinforced_deepslate`, `enchanting_table`, `anvil`s and `netherite_block`;
- active `portal` (Nether portal) blocks **and** their obsidian frame. Portal blocks outside the column become invalid and vanish by vanilla rules, which is acceptable;
- all containers (chests, trapped chests, barrels, placed shulker boxes, hoppers, droppers, dispensers, furnaces, brewing stands, lecterns, crafters and so on);
- `mob_spawner` and `trial_spawner`, and `vault`;
- non-solid breakables such as torches, flowers, snow layers, cobweb, rails and item frames (`L0-pntr-as08`; see `L0-pntr-cx01` for item frames);
- blocks of generated structures, which are ordinary (C-13).

This is the opposite of `ring`, which follows TNT resistance (Orbital §10). The two effects must not share a block classifier.




- **node**: L0-pntr-r003

### No drops, no contents, no XP (L0-pntr-r004)

**Rule R-pntr-4 · No drops.** Removing a column cell produces **no item entity and no experience orb**:
- Blocks are removed with `Block.setType`, never with `/setblock … destroy`, `/fill … destroy` or `createExplosion`.
- For a container, its inventory is cleared (`container.clearAll()`) *after* legendary protection and *before* `setType`. This guarantees "ordinary contents disappear" even if the engine were to spill block-entity contents on replacement (`L0-pntr-as02`).
- Spawners and vaults drop nothing and give no XP.

**Not covered by this rule (environmental, allowed):**
- Blocks *outside* the column that lose their support (a torch on the shaft wall, sand or gravel falling in, a door half) behave by vanilla rules and may drop items (`L0-pntr-as06`).
- Item entities already on the ground in the column are not touched. They just fall.

**Exception.** Legendaries are never destroyed (`L0-pntr-r005`).




- **node**: L0-pntr-r004

### Protect legendaries before removing a container (L0-pntr-r005)

**Rule R-pntr-5 · Legendaries survive the column.**

Before a container cell is cleared, `pntr` calls `lgnd.protectLegendariesIn(dim, cellVolume)`, which is proposed in `L0-xcx10`. That call:
- moves every legendary out of the container;
- re-drops it at a safe spot **outside** the column footprint, using `lgnd`'s logic for the item entity and the holder.

The protect call, `clearAll()` and `setType(air)` for one container happen **in one synchronous step with no `yield` in between**. That way no player, hopper or second job can move items between "protected" and "cleared" (C-7′: no loss, no copy).

`pntr` does not restate retention, loss return, or holder rules. Those are `lgnd-*`. Legendary *item entities* already lying in the column are not touched, so they fall and `lgnd` recovery covers the Void.

**Known gaps:**
- Item frames have no stable API (`L0-pntr-cx01`).
- Legendaries nested inside a shulker-box *item* inside a container (`L0-pntr-as05`).

Priority: C-15 rank 1 (no loss or duplication) overrides the visual "instant" requirement. If protection throws, the container cell is **kept** and the error is logged. It is not removed blind.




- **node**: L0-pntr-r005

### No direct entity damage (L0-pntr-r006)

**Rule R-pntr-6 · No direct damage; environment stays live.**
- `pntr` never calls `applyDamage`, `createExplosion`, `applyKnockback`, `teleport` or `kill` on any entity, and never runs `/damage` or `/kill`.
- Entities inside or above the column are not moved by the effect. They fall under vanilla gravity once their support is gone.
- Secondary harm is expected and must **not** be suppressed: fall damage, lava flowing in, drowning, suffocation from sand or gravel falling in, and mobs dropping into the Void at the End's bottom.
- The owner is treated like everyone else: no damage from the effect itself, and normal fall damage if they stand over the target.

Rationale: Orbital §9, "LMB does not deal direct damage… may receive ordinary secondary damage", and AC-9.




- **node**: L0-pntr-r006

### Concurrent and overlapping columns are idempotent (L0-pntr-r007)

**Rule R-pntr-7 · Concurrency.**
- Each LMB attack owns an independent job keyed by `attackId`. Jobs from different players, or from one player after the cooldown, may run at the same time and overlap in space.
- Removal is idempotent. A cell already turned to air or water is re-classified and skipped. A container already cleared yields no legendaries.
- The job keeps no shared mutable state between attacks and no world dynamic property. A column is never resumed after a restart (Orbital §11).
- With several players firing at once, the total cost of all running `pntr` jobs must stay inside C-5a′. `runJob` interleaves them, so each extra concurrent column adds latency and not a per-tick spike (`L0-pntr-cons`).




- **node**: L0-pntr-r007

### Skip unloaded cells; never force-load (L0-pntr-r008)

**Rule R-pntr-8 · Unloaded chunks are skipped.**
- A column is at most 7×7, so it can straddle up to 4 chunks. The detonation chunk is loaded, because the charge was in it, but a neighbour may not be (at the edge of simulation distance).
- Cells whose chunk is not loaded are skipped and counted in the job report. There is no ticking area, force-load or retry (C-14; Orbital §11: "not required to keep chunks loaded").
- If the dimension or chunk unloads mid-job, the remaining cells are abandoned. The column may end up partial, which the spec accepts as equivalent to "charges lost". The cooldown is not refunded (C-17).
- Particles and the sound towards unloaded cells are try/catch no-ops.




- **node**: L0-pntr-r008

### Exactly one explosion sound per LMB (L0-pntr-r009)

**Rule R-pntr-9 · One sound.** Each LMB detonation plays exactly one main explosion sound. It plays at the detonation point, in the detonation tick, and before any removal. The removal job, the particle wave and block updates add no sounds of their own (Orbital §9: "no extra sounds along the wave"). Vanilla sounds caused by consequences, such as liquid flowing, sand landing or a mob falling, are not suppressed and do not count as "extra".




- **node**: L0-pntr-r009

### Ring NFRs (refining C-5a′, C-12, C-15, C-16 and C-19) (L0-ring-cons)

# Ring NFRs (refining C-5a′, C-12, C-15, C-16 and C-19)

| ID | NFR | Measured by |
|---|---|---|
| RG-1 | **Bounded work.** ≤ `RING_MAX_BLASTS_PER_TICK` (48) `createExplosion` calls per tick across all attacks. One `protectLegendariesIn` call per dimension per queue step. 0 entities spawned by `ring`. | Code review plus the gametest report `maxBlastsInTick` |
| RG-2 | **Latency.** The first blast happens in its contact tick. The queue drains in ≤ 4 ticks for 1 attack and ≤ 10 ticks for 3 concurrent attacks on flat ground. | The report's `ticksToDrain` in a 3-player gametest |
| RG-3 | **Tick budget.** With 3 concurrent RMBs over flat stone on BDS 1.26.x, tick time stays above 50 ms for no more than 3 consecutive ticks, and never above 150 ms. If this fails, lower the cap (`as05`) before touching anything else. | BDS tick-time probe, shared with PN-2 |
| RG-4 | **Entity hygiene.** The `minecraft:item` count within footprint ± 8 after the attack is at most the count before, plus the vanilla drops of mobs and players killed (C-19). There are no orphan charges. | Gametest entity diff |
| RG-5 | **Rank-1 safety.** `doTileDrops` is restored in `finally` in the same call. A thrown error in any blast or in protection never leaves the rule toggled, and never deletes a legendary. | A unit test with a throwing `createExplosion` mock and a throwing `lgnd` mock |
| RG-6 | **Documented deviations** (C-16), next to the code: the queue delay (`ad02`), the gamerule toggle (`ad01`), item frames and nested storage (`r008`), and the container fallback if it is enabled (`as02`). | Code review |

If RG-2 and RG-3 conflict, RG-3 wins (C-15 rank 3 over rank 4). Relax RG-2 to "≤ 20 ticks for 3 attacks" and document it.




- **node**: L0-ring-cons

### Ring r001 concept rule (L0-ring-r001)

**R-ring-001 · Five continuous rings at d ≈ 1/5/10/15/20 around the target column** (Orbital §10; AC-11; `L0-xasm8`)

- **Centre.** The rings are centred on the locked target block's (x, z). The face that was hit does not matter.
- **d = 1** means exactly one charge directly over the target.
- **d = 5, 10, 15, 20** are rings of radius r = d/2, rasterised as 8-connected closed midpoint circles (`p001`):
  - There are no deliberate gaps. Every ring cell has exactly two ring neighbours in its 8-neighbourhood.
  - Each cell is within r ± 0.75.
- **Columns** are de-duplicated. Each column carries one charge of normal TNT size (scale 1.0, `L0-orbc-ent3`).
- **The geometry is fixed.** It does not adapt to terrain, loaded chunks or dimension. Charges whose column is unloaded or voided are handled by `orbc` (`r009`/`r011`), and the ring is not re-shaped to compensate.

**Rationale:** "as continuous as possible, discrete grid allowed" (§10). 8-connectivity is the thinnest ring with no diagonal gap visible from above.




- **node**: L0-ring-r001

### Ring r002 concept rule (L0-ring-r002)

**R-ring-002 · All charges spawn in one tick. Detonation time follows terrain plus at most the queue delay** (Orbital §10)

- `orbc` spawns every column of the layout in the activation tick, at the dimension's `spawnY` (`L0-orbc-p002`, `r007`), and they start falling together. `ring` provides only the layout. It must not stagger spawns.
- A charge spawned inside a solid cell detonates in the spawn tick (`L0-orbc-r008`). The others detonate on first block contact, so differences in terrain height give different contact ticks. §10 accepts this.
- `ring`'s detonation queue (`p003`) may add **≤ 4 ticks** for one attack and **≤ 10 ticks** with 3 concurrent attacks (RG-2). This delay is the only one `ring` is allowed to add. It must never reorder blasts across attacks (FIFO).

**Rationale:** §10 says "created simultaneously … start falling simultaneously". The queue delay is covered by "actual explosion time may differ slightly" and by the C-15 rank-3 priority over rank-4 visual fidelity.




- **node**: L0-ring-r002

### Ring r003 concept rule (L0-ring-r003)

**R-ring-003 · Every charge is independent: no chain push, no chain destruction, no chain priming** (Orbital §10; AC-12)

- A blast must not move, remove, prime, re-time or re-aim any other charge, from the same attack or from another one.
- Independence is guaranteed structurally, not by ordering:
  - The charge entity has zero collision, no physics, `knockback_resistance 1` and a damage sensor that ignores all damage (`L0-orbc-ent3`).
  - Its motion is script-teleported along a fixed column (`L0-orbc-ad02`).
  - Its contact is re-evaluated each tick against the *current* terrain. When a neighbour's blast removed the block below, the charge simply falls further. That is terrain, not a push.
- `ring` code never iterates over, removes or teleports charge entities (`L0-orbc-r014` duty).
- Each blast is a separate `createExplosion` call, and each produces its own engine sound (AC-12). Blasts are never merged into one larger explosion, even when several share a tick.
- **Out of scope:** vanilla `minecraft:tnt` *blocks* in the world that a ring blast primes. They behave like vanilla (`L0-ring-as07`).




- **node**: L0-ring-r003

### Ring r004 concept rule (L0-ring-r004)

**R-ring-004 · TNT-equivalent entity damage, including the owner** (Orbital §10; AC-13)

- Each blast is `createExplosion(centre, 4, …)`. Power 4 is vanilla TNT, so damage, falloff, exposure (occlusion) and knockback are the engine's TNT values. `ring` computes no damage itself.
- **The owner is not exempt.** An owner standing in range takes normal TNT damage and can die from their own RMB.
- **`source` is the owner when resolvable.** It is resolved at blast time: the entity must be valid and in the blast's dimension. Otherwise `source` is omitted, and the blast still happens (`L0-orbc-p003`, AC-18). The source gives kill attribution only. It must never exempt the owner. If a BDS probe shows that `source` exempts it, drop `source` entirely (`L0-ring-as03`).
- **Other players** take the same damage whatever the PvP settings of the owner. The explosion follows the world `pvp` gamerule the way vanilla TNT does.
- Damage applies underwater too (`r007`).
- Legendary *item entities* are protected (`r008`). Players' own inventories are vanilla: armour durability and death drops are unaffected by `ring` (`r006`).




- **node**: L0-ring-r004

### Ring r005 concept rule (L0-ring-r005)

**R-ring-005 · Blocks break by TNT resistance only, and there is never fire** (Orbital §10; AC-14)

- The engine explosion (`breaksBlocks: true`, power 4) decides which blocks break. Blast-resistant blocks such as Obsidian, Crying Obsidian, Reinforced Deepslate, Ancient Debris, Enchanting Table, Anvil, Ender Chest, Bedrock and End Portal Frame survive, exactly as with vanilla TNT.
- `ring` never adds its own block removal. It keeps no keep-list and no remove-list. This is the opposite of `pntr` (`L0-pntr-r003`).
- `causesFire: false` on every blast. No fire block may appear in the blast AABB that was not there before.
- Liquids behave like vanilla TNT: source blocks are not removed, and flow into craters happens naturally.
- Structure blocks (C-13) are ordinary. Rings may crater the Windmill, the Bastion, the Warden City or the Airship.
- Protected spawners (`L0-strf-r006`) are protected against *generation* only, not against weapons. A spawner breaks if TNT would break it.




- **node**: L0-ring-r005

### Ring r006 concept rule (L0-ring-r006)

**R-ring-006 · No block drops and no container spill. Everything else drops as in vanilla** (Orbital §10, §15; AC-14; `L0-xasm7`)

**Suppressed:**
- Every item a *block* would drop because the ring explosion broke it.
- The ordinary contents of a container the ring explosion destroyed (`xasm7`).

**Not suppressed (stays vanilla):**
- Loot and XP from mobs killed by the blast.
- The death drops of players killed by the blast, under `keepInventory` false.
- Item entities that already lay on the ground (they may be destroyed by blast damage, as in vanilla).
- Items spilled later by world TNT that a ring blast primed (`as07`).

**Never suppressed or lost:**
- Live marked legendaries (`r008`).

**Mechanism:** `L0-ring-ad01`. `doTileDrops` is false only during the synchronous explosion call. It is restored in `finally`, to its previous value.

**Rationale:**
- §10 says "blocks the explosion destroyed disappear WITHOUT item drops". It is about blocks.
- Deleting a killed player's inventory would be a C-15 rank-2 violation, and it is not asked for.
- C-19 ("no uncontrolled item entities") is met by never *creating* block drops, instead of deleting them afterwards.




- **node**: L0-ring-r006

### Ring r007 concept rule (L0-ring-r007)

**R-ring-007 · Underwater blasts damage entities but change no blocks** (Orbital §10; AC-15)

- **Definition.** A blast is *underwater* when its centre cell (`r010`) is at blast time one of:
  - `minecraft:water` or `minecraft:flowing_water`;
  - a waterlogged block (`Block.isWaterlogged`).
- Lava, bubble columns over soul sand or magma, and cauldrons do **not** count.
- **Underwater blasts** use `breaksBlocks: false, allowUnderwater: true` (`ad03`):
  - no block in the AABB changes;
  - entities in range take normal TNT damage and knockback;
  - the sound and particles still play.
- **Per blast, not per attack.** In one RMB, a ring that crosses a shoreline craters the land and leaves the seabed intact.
- Classification happens at blast time, so a blast queued behind a neighbour that let water into a crater sees the current water state. Water flows over ticks, so within one queue step the result is the terrain as it stands.

**Rationale:** vanilla TNT in water does not break blocks but still hurts. The script decides explicitly, so the result does not depend on the undocumented `allowUnderwater` semantics (`as04`).




- **node**: L0-ring-r007

### Ring r008 concept rule (L0-ring-r008)

**R-ring-008 · Legendaries are never destroyed by RMB** (Orbital §5, §10; `L0-lgnd-ad10` tier 1; `L0-lgnd-r013` §2)

- **Before the first explosion of every queue step**, `ring` calls `protectLegendariesIn` (`L0-lgnd-p008`):
  - once per dimension per step (`ad04`);
  - over the union of the step's blast centres ± 8;
  - with `avoid` = the attack's ring footprint ± 8.
- ±8 = 2 × power, which covers item entities that explosion damage can destroy, not only broken containers (±~5). See `L0-ring-cx02`.
- **Protection failure wins over the blast** (C-15 rank 1): if the helper throws, the step's blasts are skipped and dropped as lost, and the error is logged. The cooldown is not refunded (`L0-orbc-ent2`).
- **The fallback container sweep (`ad01`) must skip** any entity where `isLegendaryItemEntity` holds.
- **Players' inventories** are not touched. A player killed by the blast keeps legendaries under `lgnd` retention.
- **Known gaps, inherited and not re-raised:**
  - Item frames are blocks in Bedrock and have resistance 0. A legendary in a frame is removed with `doTileDrops` false (`L0-pntr-cx01`).
  - Nested shulker boxes and bundles (`L0-lgnd-cx12`).
  - These go in the C-16 notes of `ring.ts`.




- **node**: L0-ring-r008

### Ring r009 concept rule (L0-ring-r009)

**R-ring-009 · Nothing temporary survives the attack** (Orbital §15; C-19)

- `ring` spawns **no entities**. Charges belong to `orbc`, which removes them on detonation, Void, loss or timeout and sweeps orphans (`L0-orbc-p003`).
- After the last blast of an attack, all of the following hold:
  - no `andrew:orbital_charge` is tagged with that attack id;
  - no new `minecraft:item` from broken blocks or destroyed containers exists within the ring footprint ± 8 (`r006`);
  - `world.gameRules.doTileDrops` equals its pre-attack value;
  - the queue interval is cleared once the queue is empty.
- Mass RMB (3 players × 1 attack each) must not raise the item-entity count in the area by more than the vanilla mob/player drops of what the blasts killed.
- `ring`'s in-memory state per attack (the counters for the report) is deleted when the attack has no pending charges and no queued blasts.




- **node**: L0-ring-r009

### Ring r010 concept rule (L0-ring-r010)

**R-ring-010 · The explosion centre is where a landed TNT would sit**

`orbc` passes `point`, the solid contact cell (`L0-orbc-r014`). `ring` maps it to the explosion centre:
- **Normal case.** The cell above `point` is not solid, which covers air, liquid and plants. The centre is `(x+0.5, y+1.5, z+0.5)`: the middle of the TNT block resting on the contact block. This matches vanilla TNT, which explodes from its own cell, and it makes the crater bite into the surface instead of starting one block deep.
- **Buried case.** The cell above `point` is solid, as with a spawn inside a solid block (`L0-orbc-r008`) or a charge under an overhang. The centre is `(x+0.5, y+0.5, z+0.5)`: the middle of `point` itself.
- Solidity uses the same `isContact` predicate as `orbc`, so the two components agree on what "solid" means.
- Underwater classification (`r007`) reads the centre's cell.




- **node**: L0-ring-r010

