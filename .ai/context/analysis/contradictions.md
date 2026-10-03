---
title: Contradictions
type: analysis
generated_at: "2026-10-03T17:21:17.745Z"
source_channel: rollout
node_id: rollout-contradictions
aliases: ["rollout-contradictions","contradictions"]
is_a: ["rollout","contradictions"]
relates_to: ["L0-katn-cx01","L0-lgnd-cx02","L0-lgnd-cx03","L0-lgnd-cx04","L0-lgnd-cx05","L0-lgnd-cx06","L0-lgnd-cx14"]
priority: 600
---

# Contradictions

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## _other

### CX-katn-01 · Fit vs. safe (L0-katn-cx01)

---
title: "CX-katn-01 · L0-adr-ktob counts a lava cell as 'player fits'; Katana §6 requires a safe position"
is_a: ["contradiction"]
part_of: ["L0-katn"]
relates_to: ["L0-adr-ktob", "L0-katn-as03", "L0-katn-ad01", "L0-katn-r004"]
see_also: ["dragonkatanaspecv1ruen-part-2"]
---
# CX-katn-01 · Fit vs. safe

**Source A.** Katana §6 is titled "Safe destination position" and asks for "the nearest safe place where the player model fits". §5 says water and lava are not solid **for the trace**.

**Source B.** `L0-adr-ktob` §3: "Player fits means: the feet cell and the head cell are each **air, liquid** or passable." It carries the trace's liquid rule over to the destination.

**Disagreement.** Under B, a player who aims at the far bank of a lava lake can be placed in the lava, if the trace endpoint falls over it. That is a fitting cell but not a safe one. The spec only exempts liquids from blocking the *trace*.

**Proposed resolution (not self-applied at L0).**
- `katn` applies `L0-katn-as03`: lava and fire cells are unsafe for landing, and water stays allowed. It measures the fit with `L0-katn-ad01`.
- The reduce should amend `L0-adr-ktob` §3 to read "fits = column ray clear; safe = fits and no lava or fire", or mark §3 as refined by `L0-katn-ad01`.

Severity: medium. It is a player-death path on a legal use, but the fix is local to `katn`.

**Resolved at reduce v6.** `L0-adr-ktob` §3 is amended in place: *fits* = the `L0-katn-ad01` column ray is clear; *safe* = fits and neither cell is lava, flowing lava, fire or soul fire (`L0-katn-as03`). Water stays allowed. The trace's liquid rule (§1) is unchanged.






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






### CX-lgnd-14: A legendary held by an armour stand that falls into the Void is lost (L0-lgnd-cx14)

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad12", "L0-lgnd-r016", "L0-lgnd-as15", "L0-xcx11", "L0-katn"]
see_also: ["dragonkatanaspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-1"]
---
# CX-lgnd-14: A legendary held by an armour stand that falls into the Void is lost

**Sources.** Katana §3 (and the same rule in the Orbital, Scythe and Web Sword specs): "При падении в Void Катана должна вернуться последнему владельцу" ("If it falls into the Void, the Katana must return to its last owner").

**Code (1.4.4).**
- `VOID_HOLDER_TYPES` covers `chest_minecart` and `hopper_minecart` only (`recovery.ts:135`).
- An armour stand's hand slots cannot be read from a script on 2.10.0 (`README.md:71`, `probe_ufo_holder_void`).
- The engine removes it below the floor with no death and no spill, so the legendary it holds is gone and nothing is returned.

**Exposure.**
- Nothing in the add-on moves an armour stand: the magnet skips holders that carry a legendary (`r016`).
- Reaching this case takes a deliberate player setup: an armour stand pushed or placed over the Void, or the stand on a minecart.

**Options (not self-resolved).**
- (a) Accept it as a C-16 deviation and document it. This is the autopilot default.
- (b) Probe `/replaceitem`- or `hasitem`-based reads of armour-stand hands (memory: mob armour is readable only via `hasitem`). If `hasitem slot.weapon.mainhand` can detect a legendary *type*, a mark cannot be read anyway, so the return would have to re-issue the ledger's last known instance.

Filed so the operator confirms that it binds the Katana too.

**Resolved at reduce v6** by `L0-adr-ktgr` §3: option (a), a documented C-16 deviation binding all four legendaries. The Katana adds no exposure. Option (b) stays a backlog probe. Operator confirmation is collected via `L0-xq6`.






