---
type: "concept-assumption"
node_id: "L0"
source_channel: "rollout"
title: "Assumptions"
aliases: ["L0"]
part_of: ["L0"]
is_a: ["assumption"]
relates_to: ["L0"]
analysis_version: 2
level: 0
priority: 510
size_chars: 7115
tags: ["assumption","gap","web-sword","L0"]
---

# Assumptions

**Links** — `title: Assumptions` · `aliases: ["L0-assumption", "Assumptions"]` · `part_of: ["L0"]` · `is_a: ["assumption"]` · `relates_to: ["L0"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]` · `supersedes: ["L0"]`

ASM-001 (Bedrock version), ASM-002 (namespace) and ASM-003 (TypeScript) were **closed by decisions on 2026-09-20** and are no longer assumptions. ASM-004 is carried forward below as ASM-005. All entries here are `CAN_ASSUME` unless marked `MUST_ASK`.

---

## ASM-005 — Infinite durability and enchantability coexist on a sword `MUST_ASK` *(carried forward from ASM-004)*

**Assumed.** An item with **no** `minecraft:durability` component still accepts enchantments through `minecraft:enchantable` — for `slot: "sword"` exactly as for `slot: "pickaxe"`.

**Basis.** §1 requires both *«Прочность: бесконечная; предмет не должен ломаться»* and *«Совместимые ванильные зачарования меча разрешены»*; §13 tests *«Меч не теряет прочность после длительного использования.»* The shipped `packs/behavior/items/miners_pickaxe.json` already encodes this shape — `minecraft:enchantable` present, `minecraft:durability` absent — so the project has committed to the hypothesis in code.

**Status.** Decision `decision-zacharovanie-bez-durability-proverit-pervoy-zada` resolved only the *method* ("verify empirically as the first Stage 1 task"), not the outcome. **This analysis cannot confirm the outcome from the repository.** Confirm before building the sword.

**Impact if wrong.** §1's two clauses become mutually exclusive and the spec must change — add `minecraft:durability` plus break-protection, or drop enchantability. Affects `L0-item` directly and invalidates two §13 acceptance tests. It would also retroactively invalidate the pickaxe's enchantability claim.

---

## ASM-006 — "Standard use" is the item-use event, and melee swings do not raise it

**Assumed.** §5's *«стандартное использование предмета (Use / right click / long press)»* maps to the stable item-use event, and a left-click/tap **attack** with the same sword does not raise it.

**Basis.** §7 is emphatic that a normal hit creates no cobweb and starts no cooldown. The two requirements are only compatible if attack and use are distinct engine events.

**Impact if wrong.** The ability fires on every melee swing — §7 violated, cooldown burned constantly, and the trap becomes an accidental self-encasement. Affects `L0-trap` and `L0-cool`. Cheap to falsify early with a GameTest; do so before building the placement logic.

---

## ASM-007 — The protected-block set is a deny-list of block entities plus indestructibles

**Assumed.** "Replaceable ordinary blocks" ≈ air, fluids, grass/plants and other soft vanilla blocks. **Protected** ≈ anything with a block entity (chests, shulkers, furnaces, hoppers, barrels, signs, spawners, …) plus bedrock, barrier, command block, end portal frame and similar indestructibles.

**Basis.** §6 names only examples — *«например, сундуки и аналогичные block entities»*, *«bedrock и другие явно защищённые»* — and never closes the list.

**Impact if wrong (both directions).** Too permissive → the trap destroys player storage and builds, breaching C-8 and losing player data irrecoverably. Too restrictive → the cube barely forms and the weapon is useless. Affects `L0-trap`. The asymmetry matters: **data loss is unrecoverable, a weak trap is a tuning bug**, so the deny-list should start broad and be narrowed on evidence.

---

## ASM-008 — The 3×3×3 cube is the target cell ±1 on every axis

**Assumed.** 27 cells centred on the resolved target position, including the centre cell itself.

**Basis.** §5 says *«куб … размером 3×3×3, центрированный на целевой позиции»* and nothing more. It does not state whether the centre is filled, whether the cube sits on the targeted block's face, or how a target that is a *block* (not a point) resolves to a cell.

**Impact if wrong.** Off-by-one geometry: the cube floats, sinks into terrain, or entombs the caster when targeting adjacent ground. §13's *«приблизительно полный 3×3×3 куб Cobweb вокруг центра»* is loose enough to pass either reading, so **the acceptance test will not catch this** — it needs an explicit answer. Affects `L0-trap`.

---

## ASM-009 — Cooldown is keyed per player + ability, not per item instance

**Assumed.** One 30-second timer per player per ability, regardless of how many Web Swords that player holds.

**Basis.** §8 does not say. §9's *«каждый успешный вызов обрабатывается независимо»* is about concurrency between *different* players, not about one player's copies.

**Impact if wrong.** Per-instance keying lets a player carrying two copies (legitimately possible for admins per §4, and via off-hand per §8) alternate them and bypass the 30-second limiter entirely — the weapon's secondary balance mechanism. Per-player keying is the safer default and is adopted in ADR-007.

---

## ASM-010 — The two-player DoD test runs against Docker BDS with two clients `MUST_ASK`

**Assumed.** §14's *«минимум в тесте с двумя игроками»* is satisfiable by the Docker BDS LAN server with two connected clients.

**Basis.** The documented environment lists exactly **one iPad** and no second Bedrock client; macOS has none. Stage 1's `bds:gametest` proved a *simulated* player is available in GameTest, which covers scripted multiplayer logic but not two genuine sessions.

**Impact if wrong.** §14's Definition of Done is unachievable as written and the release gate stalls. Either a second client device is needed, or the requirement is amended to accept a simulated-player GameTest as the multiplayer evidence. Affects `L0-qatg`. **Ask the owner which.**

---

## ASM-011 — "Blocked without losing ingredients" degrades to detect-and-refund

**Assumed.** The stable API offers no pre-craft veto, so the second survival craft is detected on completion and the ingredients are returned, rather than the craft being prevented outright.

**Basis.** §3 hedges the requirement itself — *«насколько это позволяет стабильный API»* — which reads as the author anticipating exactly this limitation.

**Impact if wrong (in the good direction).** If a true pre-craft veto exists on the stable surface, prefer it — it is simpler and has no refund edge cases. If neither veto nor reliable refund is available, the fallback is "blocked, ingredients consumed", which satisfies §13 but not §3's ideal. Affects `L0-once`; filed as `concept-contradiction` CTR-003.

---

## ASM-012 — The first-craft announcement goes to every player on the server

**Assumed.** *«отправить всем игрокам»* (§3) means all players currently online at craft time, with no replay for players who join later.

**Basis.** The spec says "all players" without qualifying online/offline or persistence of the announcement.

**Impact if wrong.** Minor and cosmetic — a late-joining player misses the reveal. Recorded because the announcement is the *only* signal that the world's one craft has been spent, and a player who misses it may waste a Diamond Sword and 4 Cobweb attempting a second craft. Affects `L0-once`.
