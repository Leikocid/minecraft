---
title: Contradictions
type: analysis
generated_at: "2026-10-05T21:43:50.993Z"
source_channel: rollout
node_id: rollout-contradictions
aliases: ["rollout-contradictions","contradictions"]
is_a: ["rollout","contradictions"]
relates_to: ["L0-lgnd-cx02","L0-lgnd-cx03","L0-lgnd-cx04","L0-lgnd-cx05","L0-lgnd-cx06"]
priority: 610
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






