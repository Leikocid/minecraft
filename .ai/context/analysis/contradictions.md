---
title: Contradictions
type: analysis
generated_at: "2026-09-29T20:39:59.201Z"
source_channel: rollout
node_id: rollout-contradictions
aliases: ["rollout-contradictions","contradictions"]
is_a: ["rollout","contradictions"]
relates_to: ["L0-lgnd-cx02","L0-lgnd-cx03","L0-lgnd-cx04","L0-lgnd-cx05","L0-lgnd-cx06","L0-lgnd-cx08","L0-lgnd-cx09","L0-lgnd-cx10","L0-xcx10","L0-xcx9"]
priority: 540
---

# Contradictions

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## _other

### CX-lgnd-02 · Loss return can leave a stale but still melee-usable copy (hopper/allay pickup) (L0-lgnd-cx02)

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r005", "L0-lgnd-ad02", "cool-ctr1"]
---
# CX-lgnd-02 · Loss return can leave a stale but still melee-usable copy (hopper/allay pickup)

**Invariant** — C-7: no duplication via craft, death, reconnect, restart. Web Sword §14: *«Нет известных способов дюпа»*.

**Design** — `L0-lgnd-p003` step 3 classifies a removed legendary item entity as *pickup* only if the instance shows up in a **player** inventory within one tick. The stable 2.10.0 API gives no removal reason, so a hopper, hopper minecart, allay or fox picking up a dropped legendary is classified as *lost* and re-issued with `gen + 1`. `L0-lgnd-r005` makes the old stack stale: it cannot cast and is deleted when it next enters a player inventory.

**Conflict.** The stale stack is still an `andrew:web_sword` / `andrew:scythe_of_calamity` item with base melee damage and infinite durability. Until a player picks it up it sits in a container, and a non-player holder (e.g. an allay, a dispenser firing it into a player's hand, a trade through a container moved by a hopper chain) keeps a second physical copy. For the ability it is not a duplicate; for melee stats it is.

**Resolution needed.** Choose: (a) accept — stale copies are harmless because they are deleted on first player contact; (b) additionally clear the watch-set entity's stack when a hopper/allay is within 1 block at removal (heuristic, costs a local query); (c) drop loss return for non-Void causes and return only on Void (narrows CTR-1). Autopilot default: (a).






### CTR-lgnd-03: ASM-020 measures `hidden_until` in ticks, but the shipped code proved ticks are the wrong clock (L0-lgnd-cx03)

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r010", "L0-lgnd-ent3", "L0-stgt"]
status: resolved
category: source-vs-code
---
# CTR-lgnd-03: ASM-020 measures `hidden_until` in ticks, but the shipped code proved ticks are the wrong clock

- **ASM-020 (L0):** a player is hidden iff `andrew:hidden_until` > "the current tick".
- **`src/websword/cooldown.ts`** (measured on BDS 1.26.51.1):
  - `world.getAbsoluteTime()` stops when `dodaylightcycle` is false.
  - `system.currentTick` restarts at 0 with the script engine.
  - A durable deadline on either clock is wrong after a restart, or never expires.
  For this reason the cooldown was moved to `Date.now()` milliseconds.

**Effect.** A tick-based `hidden_until` written before a restart would read as hidden for up to its whole stored value in new ticks. On a frozen day clock it would read as hidden forever.

**Interim position** (`L0-lgnd-r010`): use epoch ms via `Date.now()`, the same clock as the cooldowns. Only ASM-020's wording changes, not its contract.

**Needs:** L0 amends the wording of ASM-020, and the future Shadow Blade spec must write ms.






### CTR-lgnd-04: ADR-021 says existing tests stay unchanged, but the framework itself requires Web Sword changes (L0-lgnd-cx04)

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad06", "L0-lgnd-ac11"]
status: resolved
category: source-vs-decision
---
# CTR-lgnd-04: ADR-021 says existing tests stay unchanged, but the framework itself requires Web Sword changes

**ADR-021:** the migration is covered by the existing GameTests without changing them.

**Required changes that touch shipped Web Sword behaviour:**
1. `allow_off_hand` plus the off-hand HUD (Q-019 a).
2. Void and lava return for the Web Sword (Q-020 a). The shipped `andrew:websword_*` tests do not cover this, so they do not break. But Q-014's "lost for good" is no longer true.
3. Death retention of several items: pending becomes an array, with a legacy read.
4. `registerTrap` no longer subscribes to `itemUse` itself. The GameTest pack calls `registerTrap()` today (`src/gametest/main.ts`). It loses its trigger unless the shim keeps a subscribing variant.

**Effect.** "Tests unchanged" holds only with the shims in `L0-lgnd-ad06` plus a GameTest-side `registerLegendaryFramework()`. Because of item 4, `src/gametest/main.ts` has to change. That file is test harness code, not a test *assertion*.

**Needs:** L0 to read ADR-021 as "no assertion edits", not "no file edits under `src/gametest/`".






### CTR-lgnd-05: ADR-021 renames the operator command, but the shipped command is documented (L0-lgnd-cx05)

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p007", "L0-lgnd-ad06"]
status: resolved
category: source-vs-decision
---
# CTR-lgnd-05: ADR-021 renames the operator command, but the shipped command is documented

- **ADR-021:** the framework owns the give/reset commands as `/andrew:legendary <id> …`.
- **Shipped:** `/andrew:websword <give|reset> [target]` in `src/websword/commands.ts`. It is documented in `README.md` lines 167–172, referenced by decisions Q-006, Q-008 and Q-014, and mentioned in `src/gametest/main.ts`.
- **C-10:** the delivered platform must not regress.

**Interim handling:** register both names. `/andrew:websword` becomes an alias bound to the Web Sword def (`L0-lgnd-ad06`).

**Needs:** confirmation that keeping two command names is acceptable, instead of updating the README and deprecating the old name.






### CX-lgnd-06 · The loss watcher is a tick loop outside the letter of C-5 (L0-lgnd-cx06)

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad03", "L0-lgnd-p003", "L0-lgnd-ac12"]
---
# CX-lgnd-06 · The loss watcher is a tick loop outside the letter of C-5

**Constraint** — C-5 (`concept-constraint`): *«no permanent global per-tick world scans. Short-lived tick loops allowed only while temporary objects (Scythe projectiles) exist.»*

**Design** — `L0-lgnd-ad03`: a 10-tick `runInterval` that runs while at least one marked legendary exists as a dropped item entity, iterating only those entity ids, to catch `y < heightRange.min` before the engine kills the item in the Void.

**Conflict.** The loop is not global and not permanent, so it keeps the spirit of C-5. But C-5 names Scythe projectiles as the only allowed case. A legendary dropped in an unloaded-but-ticking area, or left on the ground for the 5-minute despawn window, keeps the loop alive for minutes.

**Resolution needed.** Either widen C-5 to "while temporary objects **or dropped legendary items** exist", or drop the watcher and rely only on `beforeEvents.entityRemove` (`L0-lgnd-as03` must then be measured on BDS 1.26.51.1 to confirm the Void kill raises it).






### CX-lgnd-08 · Hand priority is coded, but neither item can be held in the off hand (L0-lgnd-cx08)

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r004", "L0-lgnd-as07", "L0-lgnd-ac04", "L0-lgnd-ac05", "L0-lgnd-ac06", "L0-scyt-r009", "L0-sitm", "cool-ctr3"]
status: open
category: source-vs-code
---
# CX-lgnd-08 · Hand priority is coded, but neither item can be held in the off hand

**Decision/spec.**
- decision-legendary-hand-priority and decision-resolve-cool-ctr3 require hand priority to be implemented now.
- `L0-lgnd-r004` and `L0-scyt-r009` require `minecraft:allow_off_hand: true` on both items.

**Code.**
- `src/legendary/hands.ts` resolves main, then off hand.
- `hud.ts` renders both hands.
- `grep -rl allow_off_hand packs/` finds **no** item JSON. Without that component, Bedrock does not let a custom item be placed in the off-hand slot.

**Effect.**
- The off-hand branch of `resolveActivation` is dead in practice.
- `ac04` and `ac05` (two-hand press) and `ac06` (two-segment HUD) cannot be set up on a real client.
- A GameTest can still force the slot through `Equippable.setEquipment(Offhand)`, which would give a false pass.

**Resolution needed.** One of:
- `L0-sitm`/`L0-webs` add `minecraft:allow_off_hand: true` to both items, and `as07` is then measured on 1.26.50.
- Or the client confirms that off-hand is out of scope, and the two-hand ACs are dropped.






### CX-lgnd-09 · Loss return in code: owner instead of last holder, and no generation guard (L0-lgnd-cx09)

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r005", "L0-lgnd-ad02", "L0-lgnd-ent2", "L0-lgnd-ent4", "L0-lgnd-cx02", "L0-lgnd-ac08", "L0-lgnd-ac10"]
status: open
category: source-vs-code
---
# CX-lgnd-09 · Loss return in code: owner instead of last holder, and no generation guard

**Spec/design.**
- Scythe §1: *«возвращается последнему владельцу»* ("returns to the last owner").
- decision-legendary-rules-obschie: the item goes "последнему владельцу" ("to the last owner").
- `L0-lgnd-ad02`, `r005`, `ent2`, `ac08` and `ac10` design a `holder` field plus a `gen` bump, so a mis-classified survivor becomes stale.

**Code** (`src/legendary/recovery.ts`, `state.ts`):
1. The return target is `mark.owner`, which is the crafter or the admin recipient. There is no `holder` field. If a crafter gives the sword to a friend and the friend drops it into the Void, the sword goes back to the crafter.
2. There is no generation. Mis-classification is reduced by heuristics instead:
   - an inventory scan of online players;
   - a scan of the container at or below the spot (hopper);
   - a check of the other watched entities.

   A pickup that none of these see (an allay, a hopper minecart, a hopper chain that moves the item on within 40 ticks, a fox) is classed as lost. The owner gets a copy with the **same id**, and the survivor stays fully live. That is a real duplicate (C-7), not the harmless stale copy that `cx02` assumed.
3. `_owed` is a map `ownerId → one mark`. Two losses of different admin copies by the same offline owner overwrite each other, so one debt is lost.
4. A pickup is also inferred by scanning every online player's inventory at classification time. That is event-scoped and bounded, but it is a scan wider than the "one inventory" wording of C-5.

**Resolution needed.**
- (a) Implement `holder` and `gen` as designed.
- (b) Accept the as-built behaviour: owner-return, a small dup window, and a debt-overwrite edge. `ac08` and `ac10` are then rewritten, and `cx02` is re-framed as a dup risk.

Also, the spec's "последнему владельцу" needs a client reading: does it mean the crafter or the last holder?






### CX-lgnd-10 · Death retention keeps only one marked copy per weapon, and never the off-hand one (L0-lgnd-cx10)

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p002", "L0-lgnd-r008", "L0-lgnd-ent4", "L0-lgnd-ac07"]
status: open
category: source-vs-code
---
# CX-lgnd-10 · Death retention keeps only one marked copy per weapon, and never the off-hand one

**Design** (`p002`, `ent4`, `ac07`):
- Every live marked stack of every weapon is retained, from both the container and the off hand.
- `pending` is a JSON array.

**Code** (`src/legendary/retention.ts` `retain`, `state.ts`):
- `findMarked(def, container)` returns the **first** marked stack per weapon.
- `setPending` stores one serialized mark.
- The Equippable off-hand slot is not read (no `Offhand` reference outside `hands.ts`).

**Effect.**
- A player carrying two marked copies of the same weapon (for example the crafted Web Sword plus an admin `give` copy) keeps one. The second drops as an item entity. Path B only saves it if the single pending slot is free. Otherwise it is swept or left behind, and loss return would then re-issue it to the owner.
- An off-hand legendary, once `cx08` is fixed, would drop on death and go through loss return instead of retention.

In a normal Survival world only one crafted copy exists, so the practical exposure is limited to admin copies and to `cx08`.

**Resolution needed.** Choose one:
- (a) Array pending plus an off-hand scan, as designed.
- (b) Accept, and narrow `ac07` to one copy per weapon, main inventory only.






### CX-L0-10 · \ (L0-xcx10)

# CX-L0-10 · "Legendaries are not destroyed" vs the as-built "destroyed means returned"

**Spec (Orbital §5, a general rule for all legendaries).** A legendary must **not be destroyed** by fire, lava, cactus, TNT, the Orbital Cannon or other ordinary item-entity destruction. When a container holding one is destroyed, the legendary must **survive or drop**, not vanish.

**Code (`src/legendary/recovery.ts` header).** "The stable API has no way to make an item entity indestructible, so the rule is 'destroyed means returned'." A lost instance is re-issued to the owner's inventory, and that happens elsewhere, not where it lay. Container destruction is not handled specially. Vanilla drops container contents, and recovery watches the resulting item entity.

**Conflict.**
- Spec: the item stays in the world.
- Code: it teleports to a player.

The Orbital effects make this worse:
- LMB deletes containers "with contents", so the vanilla contents drop never happens.
- RMB drop suppression (`L0-adr-ochg`) could delete a legendary that a container spilled.

**Proposed resolution for `lgnd`:**
- Keep "destroyed → returned" as the stable fallback for fire, lava, cactus and the Void.
- Add a pre-emptive `protectLegendariesIn(dim, volume)` that the Cannon calls before it removes blocks. It pulls legendaries out of containers in the volume and re-drops them at a safe spot outside the blast, which keeps the "survive/drop" semantics.

It is recorded as a deviation (C-16).






### CX-L0-09 · Vanilla /give copies in Survival claim the world's craft (L0-xcx9)

# CX-L0-09 · Vanilla /give copies in Survival claim the world's craft

**Spec (Orbital §4, AC-2).** Copies from Creative and `/give` are allowed and **do not consume or change** the Survival unique-craft flag.

**Code (`src/legendary/craftgate.ts` + `rules.ts:41`).** The gate reacts to *any* unmarked legendary that appears in a player's inventory. `craftDecision` ignores the stack only when the player is in Creative or Spectator, or the stack is marked. A vanilla `/give @p andrew:orbital_cannon` (or `andrew:web_sword`) to a **Survival** player produces an unmarked stack, so the gate returns `claim`. The world's single craft is then spent on a test copy, and a later real craft gets refunded. Only the custom `/andrew:<weapon> give` produces a correctly marked admin copy.

**Impact.** AC-2 fails as built, for all three weapons.

**The gate cannot tell a craft from a `/give`.** Stable 2.10.0 has no craft event; that is why the gate is after-the-fact.

**Candidate fixes for the `lgnd` delta:**
- Only claim when the stack appeared in the crafting-output flow. Heuristic: the event's `beforeItemStack` was empty and the slot is the cursor or inventory slot fed by crafting. This needs a probe.
- Or restrict `/give` of legendaries through a `beforeEvents` command hook, and document `/andrew:<weapon> give` as the supported path.






