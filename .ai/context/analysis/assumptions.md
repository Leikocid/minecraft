---
title: Assumptions
type: analysis
generated_at: "2026-09-21T21:24:41.664Z"
source_channel: rollout
node_id: rollout-assumptions
aliases: ["rollout-assumptions","assumptions"]
is_a: ["rollout","assumptions"]
relates_to: ["L0","L0-cool-asm1","L0-cool-asm2","L0-cool-asm3","L0-item-asm1","L0-item-asm2","L0-item-asm3","L0-keep-asm013","L0-keep-asm014","L0-keep-asm015","L0-keep-asm016","L0-once","L0-qatg-asm1","L0-qatg-asm2","L0-qatg-asm3","L0-trap-as17","L0-trap-as18","L0-trap-as19","L0-trap-as20"]
priority: 510
---

# Assumptions (CAN_ASSUME)

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Assumptions (L0)

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






### Cool asm1 concept assumption (L0-cool-asm1)

## ASM-cool-1 — Cooldown persists across disconnect/reconnect `MUST_ASK`

**Assumed.** The cooldown record survives player logout and rejoin (and ordinary server restart, since it rides on the player's saved data) — i.e. Q-009 is answered "persist."

**Basis.** L0's `concept-client-question` (Q-009) recommends this explicitly: *"A resetting cooldown is an obvious logout-abuse path, and C-7 already establishes that reconnecting must not confer an advantage."* No stronger source exists — the spec itself (§12) defers to an unspecified framework.

**Impact if wrong.** If the owner instead wants the cooldown to reset on rejoin, `L0-cool-adr1`'s storage choice is superseded — move off player-scoped dynamic properties to a non-persistent structure cleared at world start. `L0-cool-proc1` and the public API shape (`isReady`/`start`) are unaffected. Confirm before implementation; this governs only storage, not the contract.






### Cool asm2 concept assumption (L0-cool-asm2)

## ASM-cool-2 — 20-tick (≈1 s) actionbar update cadence `CAN_ASSUME`

**Assumed.** The render loop (`L0-cool-proc2`) fires once per second (every 20 ticks), not every tick.

**Basis.** §8 specifies no granularity, only that remaining time must be visible while holding. A 1 s cadence is finer than a human reads a 30 s countdown, and keeps the one permitted recurring tick (C-4) as cheap as the requirement allows.

**Impact if wrong.** Purely a tuning value — a smoother or coarser countdown is a one-line change to `L0-cool-adr1`'s cadence parameter with no structural consequence. Low risk either way.






### Cool asm3 concept assumption (L0-cool-asm3)

## ASM-cool-3 — "Holding" means main-hand or off-hand `CAN_ASSUME`

**Assumed.** A player equipping `andrew:web_sword` in either the main-hand or the off-hand slot counts as a "holder" for R-cool-004's actionbar visibility rule.

**Basis.** §8's *«При удержании Web Sword»* does not restrict to a specific hand slot; only the deferred (Q-010) priority clause distinguishes hands, and that clause is explicitly out of v1's scope.

**Impact if wrong.** If the owner intends main-hand-only visibility, `L0-cool-proc2` step 2's holder filter narrows by one condition — an isolated, low-cost change. Does not affect the cooldown record or timing logic, only render eligibility.






### Item asm1 concept assumption (L0-item-asm1)

**Links** — `part_of: ["L0-item"]` · `is_a: ["assumption"]` · `relates_to: ["L0-item-r001", "L0-item-ac03"]`

**Assumption (`MUST_ASK`, item-scoped instance of parent ASM-005/Q-007):** `minecraft:enchantable` with `slot: "sword"` functions correctly on an item that has **no** `minecraft:durability` component, on Bedrock 1.26.51 / `@minecraft/server` 2.10.0.

**Basis.** The pickaxe already encodes the identical hypothesis (`slot: "pickaxe"`, durability omitted) and Stage 1's decision only fixed the *verification method* ("test empirically first"), not the outcome — this analysis cannot read the result from the repository. The sword is a second, independent instance of the same untested hypothesis, with a different slot value.

**Impact if wrong.** §1's two requirements ("infinite durability" and "vanilla enchantments allowed") become mutually exclusive for the sword specifically. Fallback would require adding `minecraft:durability` with break-protection (e.g. auto-repair), or dropping enchantability — either changes `L0-item-r001` and invalidates `L0-item-ac03`. It would also strengthen (not create) the case that the pickaxe's own enchantability claim needs re-verification.

**Recommendation.** Test the sword's `slot: "sword"` case explicitly rather than assuming the pickaxe's `slot: "pickaxe"` result (if ever recorded) transfers — the two slots are handled by separate engine code paths.






### Item asm2 concept assumption (L0-item-asm2)

**Links** — `part_of: ["L0-item"]` · `is_a: ["assumption"]` · `relates_to: ["L0-item-ent1", "L0-item-ac04"]`

**Assumption:** the correct explicit values to replicate vanilla Diamond Sword parity are its known vanilla damage value and the tag set `["minecraft:is_sword", "minecraft:sword", "minecraft:weapon"]` on `minecraft:tags`.

**Basis.** §1 only says *«урон алмазного меча»* (Diamond Sword's damage) without stating a number, and this repository holds no vanilla item definitions to copy from directly (only the custom pickaxe, which is a tool, not a weapon, and carries different tags). The values above come from general Bedrock domain knowledge, not from anything verifiable in this KV.

**Impact if wrong.** Medium. A wrong damage number fails `L0-item-ac04` directly and is easy to correct once measured in-game. Wrong or missing weapon tags are subtler — some vanilla systems (mob equipment preference, certain enchant restrictions, hostile-mob AI weapon checks) key off tags rather than the item type, so an incomplete tag set could produce behavior that passes the stated acceptance tests but still "feels" like a non-sword to other game systems.

**Recommendation.** Verify the actual current damage constant and tag set for `minecraft:diamond_sword` against the target game version (1.26.51) before finalizing `L0-item-ent1`, rather than trusting this assumption into implementation.






### Item asm3 concept assumption (L0-item-asm3)

**Links** — `part_of: ["L0-item"]` · `is_a: ["assumption"]` · `relates_to: ["L0-item-ent1"]`

**Assumption:** a dedicated custom icon/texture is required for the Web Sword, despite §11's hedge *«собственная иконка/текстура при необходимости»* ("own icon/texture, if needed").

**Basis.** The platform precedent (`andrew:miners_pickaxe`) ships its own texture and `item_texture.json` entry even though a generic/vanilla-like texture would have been technically sufficient. Consistency with this established convention is assumed to outweigh the spec's optionality hedge.

**Impact if wrong.** Low — purely cosmetic/effort tradeoff. If a shared or vanilla-adjacent texture were acceptable, some art/production effort is saved, but nothing in §13's acceptance tests distinguishes a custom icon from a placeholder one, so this assumption carries no correctness risk, only scope/effort risk.






### ASM-013 — The stable API exposes a usable death-drop interception point `MUST_ASK` (L0-keep-asm013)

# ASM-013 — The stable API exposes a usable death-drop interception point `MUST_ASK`

**Links** — `part_of: ["L0-keep"]` · `is_a: ["assumption"]` · `relates_to: ["L0-keep-p001", "L0-keep-r001"]` · `governed_by: ["C-1"]`

**Assumed.** `@minecraft/server` 2.10.0 (stable, no Beta) offers a hook on the death/drop path that lets the add-on prevent a specific item from entering the death drop — or, failing that, remove it from the player's inventory *before* drops are materialised.

**Basis.** ADR-008 decided to *«intercept the drop»* rather than use `keepInventory`, which presupposes such a hook. The spec requires the outcome (§4) but names no mechanism, and this analysis cannot confirm the API surface from the repository.

**Impact if wrong.** This is the load-bearing technical assumption of the whole component. If no pre-drop hook exists on the stable channel, the fallback is *remove-on-death-event then re-grant*, which opens a window in which the item may already have dropped — directly threatening `L0-keep-r001` (no transient drop) and, if the drop is collectable in that window, C-7 itself.

Per **C-1**, the response is **not** to reach for a Beta API. If retention is only expressible via Preview, the mechanic changes and the escalation goes to L0.

**How to falsify cheaply.** A GameTest on Docker BDS: kill a simulated player holding a marked item and assert on the drop set. Minutes of work, and it should be the **first** task when this component is unblocked — the design of `L0-keep-p001` depends on the answer.






### ASM-014 — A stable player identity survives reconnect and restart (L0-keep-asm014)

# ASM-014 — A stable player identity survives reconnect and restart

**Links** — `part_of: ["L0-keep"]` · `is_a: ["assumption"]` · `relates_to: ["L0-keep-ent1", "L0-keep-p003", "L0-keep-gloss-owner"]` · `governed_by: ["C-6"]`

**Assumed.** The stable API exposes a player identifier that is constant across disconnect/reconnect **and** across server restart, and that is suitable as a durable ledger key. Display names are explicitly not used.

**Basis.** §4 requires the sword to return *«тому же владельцу»*, and §4/§12 require this to hold across disconnect and restart. That is only meaningful if "the same player" is expressible in durable storage. The spec never says how.

**Impact if wrong.** Severe and bidirectional. If the identity is session-scoped, a reconnecting player reads as a *different* player:
- their `pending` obligation is stranded — the sword is silently destroyed; and
- a fresh entry can be armed for the same person, which is a **dup path** (C-7).

A ledger keyed on an unstable identity fails exactly the scenario `L0-keep-p003` exists to handle, so this is not a peripheral detail.

**Secondary question folded in.** If the identifier is available but *expensive* or only resolvable while the player is online, the reconnect-reconciliation path needs care — it must read a `pending` entry belonging to someone not currently connected (`L0-keep-ent1` storage note).

**How to falsify.** Assert identity equality across a scripted disconnect/reconnect and across a BDS restart. Bundle it with `L0-keep-ac03` / `ac04`, which already exercise both cycles.






### ASM-015 — A per-instance marker can be attached to an item stack and survives normal handling `MUST_ASK` (L0-keep-asm015)

# ASM-015 — A per-instance marker can be attached to an item stack and survives normal handling `MUST_ASK`

**Links** — `part_of: ["L0-keep"]` · `is_a: ["assumption"]` · `relates_to: ["L0-keep-ent2", "L0-keep-r003"]` · `blocked_by: ["Q-006"]` · `governed_by: ["C-1", "C-6"]`

**Assumed.** The stable `@minecraft/server` surface allows a durable custom attribute on an **item stack** that survives: being dropped and picked up, moving between inventory slots, being stored in and retrieved from a container, and **world save/restart**.

**Basis.** CTR-005's resolution requires instance provenance (`L0-keep-ent2`), and Q-006 asks the owner to permit it. But permission is only half — the capability must also exist on the stable channel. Q-006 settles the *policy*; this assumption settles the *feasibility*, and the two are independent.

**Impact if wrong.** The recommended resolution to CTR-005 becomes unimplementable regardless of the owner's answer. A marker that is lost by any of the listed operations is worse than no marker at all: it silently converts a crafted sword into an admin copy, turning retention off for that player with **no error and no signal** — the owner simply loses the sword on their next death and cannot tell why.

In that case the "no" branch of Q-006 applies by force, and §14's absolute no-dup claim must be relaxed in writing.

**Note on loss asymmetry.** Marker loss fails *safe* with respect to C-7 (an unmarked sword is never retained, so no dup) but fails *badly* with respect to §4. That is the correct direction per `L0-keep-r002`, but it is not acceptable as routine behaviour.

**How to falsify.** Round-trip test on BDS: mark a stack, drop/repick, chest/retrieve, restart the server, assert the marker each time. Do this **before** committing to the ledger design — it is the second gate after ASM-013.






### ASM-016 — An unplaceable restore stays owed rather than being dropped or discarded (L0-keep-asm016)

# ASM-016 — An unplaceable restore stays owed rather than being dropped or discarded

**Links** — `part_of: ["L0-keep"]` · `is_a: ["assumption"]` · `relates_to: ["L0-keep-p002", "L0-keep-ent1"]`

**Assumed.** If the sword cannot be placed into the player's inventory at respawn (no free slot), the ledger entry is **left `pending`** and redemption is retried at the next respawn or join — rather than dropping the item at the player's feet or silently discarding it.

**Basis.** The spec does not consider this case at all. §4 assumes respawn yields an empty inventory, which is the vanilla default; a non-empty one requires a server setting or admin action, so the case is unlikely but reachable on a real dedicated server (C-5).

**Why this default.** The two alternatives are both bad in ways the spec explicitly cares about:
- **Drop at the player's feet** — recreates the exact state §4 exists to prevent: a one-per-world legendary lying on the ground, lootable by whoever is nearby (`L0-keep-r001`).
- **Discard** — destroys the sword permanently, and silently.

Leaving the entry `pending` costs nothing: the ledger is already designed to carry an unredeemed obligation indefinitely (`L0-keep-p003`), and an owed sword is an item that does not exist, so C-7 is not threatened by the delay.

**Impact if wrong.** Low. The failure mode is a player who has to free a slot and rejoin to get their sword — inconvenient and confusing, but not a dup and not a permanent loss. Recorded because the *other* two options are genuinely harmful, so the choice should not be made casually at implementation time.

**Possible refinement.** A localized actionbar/chat notice ("inventory full, sword will be returned") would remove the confusion — but it needs a translate-key pair from `L0-item` per C-9/ADR-009, and this component currently emits no text by design (KC-9).






### Assumptions — One-per-World Craft Gate (L0-once)

# Assumptions — One-per-World Craft Gate

**Links** — `part_of: ["L0-once"]` · `is_a: ["assumption"]` · `relates_to: ["L0", "L0-keep"]` · `see_also: ["webswordspecv1ruen-part-1"]`

**Inherited from L0 and still owned here:** **ASM-011** (blocked craft degrades to detect-and-refund) and **ASM-012** (announcement reaches only players online at craft time). Neither is restated below; both remain `CAN_ASSUME` and are refined by R-005 and `L0-once-ebrd` respectively.

Three new assumptions arise at this depth.

---

## ASM-013 — Non-Creative crafting spends the budget, whatever the mode `MUST_ASK`

**Assumed.** "Survival craft" means *any craft that is not performed in Creative mode*. An Adventure-mode player crafting at a table spends the world's budget exactly as a Survival player does. Spectator cannot craft and is moot.

**Basis.** §3 names only two modes — *«В Survival»* and *«Creative и /give … НЕ расходуют»* — and never mentions Adventure. The spec's intent is clearly a Survival-vs-admin split, and Adventure is a play mode, not an admin mode, so it belongs on the Survival side.

**Impact if wrong.** Low severity but a real bypass in one direction: if Adventure crafts are wrongly exempted on a server that uses Adventure as its main mode (a common PvP-map configuration — and this add-on is for a **PvP** add-on per the spec preamble), the gate never closes and the weapon is unlimited. The reverse error (Adventure wrongly spends the budget on a map where it was meant to be free) is merely annoying. Given the PvP context, **the asymmetry favours the assumed default**, but the owner should confirm which mode their maps actually run in.

---

## ASM-014 — Craft completion raises exactly one server-side event per craft, including shift-click bulk crafts

**Assumed.** The stable `@minecraft/server` surface raises one craft-completion signal per craft of `andrew:web_sword`, carrying the crafting player, and a shift-click "craft all" cannot produce multiple swords under a single signal.

**Basis.** Not stated anywhere in the spec — this is engine behaviour the analysis cannot verify from the repository. The recipe consumes a Diamond Sword, so a bulk craft requires N diamond swords and is unusual but not impossible for a stocked player.

**Impact if wrong.** Direct C-7 duplication path, and the worst-flavoured one: a single shift-click yielding two or three Web Swords while setting the flag once. It would pass every §13 test, all of which craft singly. **Falsify early** — a GameTest that gives a simulated player 3× Diamond Sword + 12× Cobweb and shift-clicks the result is cheap and decisive. If bulk crafts do collapse into one signal, the blocked path must clamp the result to zero rather than "remove one".

---

## ASM-015 — A read-check-write inside one handler invocation is atomic

**Assumed.** The Bedrock script host runs a single event handler to completion before dispatching the next, so reading the world craft flag and writing it back within one uninterrupted synchronous handler body cannot be interleaved with another player's craft handler. This is the entire basis of R-004's race safety.

**Basis.** Standard single-threaded event-loop semantics, consistent with how the shipped `src/autosmelt.ts` handles block-break events. **Not verified against Microsoft's documentation by this analysis.**

**Impact if wrong.** If handlers can interleave — or if dynamic-property writes are asynchronous under the hood and a read can observe a stale value — then two simultaneous crafts both observe an unset flag and both succeed. That is §9's named bypass and a C-7 dup path, and it is *timing-dependent*, so it may pass the acceptance test by luck and fail in production. Mitigation if the assumption falls: an in-memory claim latch set before the property write and consulted by every handler in the same tick, which does not depend on storage semantics. Flag to `L0-qatg` that AC-ONCE-5 needs repeated runs, not a single pass.






### ASM-Q1 — Simulated-player GameTest is accepted as primary two-player evidence, pending Q-012 (L0-qatg-asm1)

# ASM-Q1 — Simulated-player GameTest is accepted as primary two-player evidence, pending Q-012

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["assumption"]` · `relates_to: ["L0-qatg-p003", "L0-qatg-adr2"]` · `governed_by: ["C-11"]`

**Assumed.** Until the spec owner answers Q-012, this analysis treats `bds:gametest` scenarios driven by two `SimulatedPlayer` instances as sufficient primary evidence for the §14 "≥2-player" requirement on tests whose claim is about **server-side logic** (craft race, placement determinism). A genuine two-client session is treated as best-effort corroboration, required only for AT-12's client-rendering claim, and only if a second device becomes available.

**Basis.** This refines ASM-010/Q-012 with the operational detail Q-012's recommended answer already points at (*"accept the simulated-player GameTest for scripted logic... keep one genuine two-client check for the §13 'both clients see the same cobweb' criterion if any second device can be borrowed"*), which Stage 1's `bds:gametest` already proved feasible.

**Impact if wrong.** If the owner instead requires a genuine second device for every multiplayer-tagged AT, `L0-qatg-p003`'s primary path stops being sufficient evidence and the DoD gate for AT-3, AT-7 and AT-12 cannot close without procuring a second Bedrock-capable device — a hard external dependency this project does not currently have.

**Does not resolve Q-012.** This is implementation-detail refinement per the decomposition plan's rule that children hand questions back rather than self-resolve them; the actual answer remains the spec owner's to give.






### ASM-Q2 — The static npm test suite cannot catch a duplication regression (L0-qatg-asm2)

# ASM-Q2 — The static npm test suite cannot catch a duplication regression

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["assumption"]` · `relates_to: ["L0-qatg-ac03", "L0-qatg-r005"]`

**Assumed.** `npm test`'s 7 suites (build output, manifests, static item/recipe shape) exercise no live engine state and therefore cannot detect a duplication bug — dup-safety evidence must come exclusively from `bds:gametest`'s live death/respawn/restart cycling, never from the fast static suite.

**Basis.** Read directly off `tests/`'s file list (`autosmelt`, `gametest-pack`, `item`, `manifests`, `pickaxe`, `selftest-pack`, `validate`.test.mjs) — none instantiate a world or a player. This differs from the pickaxe, which carried no dup risk, so this blind spot never mattered for C-10's existing suites.

**Impact if wrong (i.e., if some static check does catch it).** Low-risk direction — a static check that happens to catch a dup bug is a welcome bonus, not a problem. The real risk is the reverse: treating a green `npm test` run as any evidence at all for `L0-qatg-ac03`, which it is not.

**How to falsify cheaply.** Not falsifiable by inspection alone once written — the corrective action is procedural: `L0-qatg-r005`/`L0-qatg-p002` already exclude `npm test` from the dup-safety evidence chain, so no code change is implied, only gate discipline.






### ASM-Q3 — The iPad visual pass is a mandatory, not optional, part of the gate (L0-qatg-asm3)

# ASM-Q3 — The iPad visual pass is a mandatory, not optional, part of the gate

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["assumption"]` · `relates_to: ["L0-qatg-gl05"]` · `governed_by: ["C-11"]`

**Assumed.** Although §14's five bullets never mention "iPad" or a visual check by name, AT-1 (Creative Equipment/catalogue visibility) and part of AT-9 (actionbar readout) are claims about client-side rendering that no BDS-side mechanism can evidence (C-11). This analysis treats the iPad visual pass as mandatory for those specific rows, not as an optional nice-to-have layered on top of an otherwise-complete BDS-only gate.

**Basis.** C-11: *"iPad answers 'does it look right?' (Creative visibility, icon, RU/EN rendering, actionbar). Neither can substitute for the other."* — stated as a structural limit of the environment, inherited unchanged by this component.

**Impact if wrong.** If a future stable-API surface lets `bds:check` assert on Creative-menu placement or actionbar text server-side, the iPad pass could be demoted to corroboration-only for those rows, simplifying `L0-qatg-p002`. Until then, skipping the iPad pass leaves AT-1's and part of AT-9's claims with zero evidence, not partial evidence — the DoD cannot honestly report green.

**How to falsify cheaply.** Check whether `@minecraft/server` 2.10.0 exposes any inspectable Creative-catalogue or actionbar-rendering API — if `L0-item`'s or `L0-cool`'s deep-dive already answered this for their own ASM/Q items, reuse that finding rather than re-deriving it here.






### ASM-017 — Reach is the vanilla survival interaction distance, same in every game mode (L0-trap-as17)

# ASM-017 — Reach is the vanilla survival interaction distance, same in every game mode

**Status:** `CAN_ASSUME` · **Affects:** `L0-trap` · **Source:** §5's *«обычная survival interaction/melee reach»*

**Assumed.** The reach bound is the vanilla **survival** interaction/melee distance measured from the player's eye — conventionally ~5 blocks for entity interaction on Bedrock — expressed as one named constant and applied identically regardless of the activating player's game mode.

**Basis.** §5 names the value only by reference to vanilla behaviour and states the prohibition (*«без искусственного дальнего луча»*) rather than a number. §12 restates the boundary without quantifying it. No number appears anywhere in the spec or the KV.

**Why one value for all game modes.** Vanilla Creative reach is longer than survival reach. The spec ties the ability to *survival* reach without exempting Creative, and §3/§4 treat Creative purely as an admin/test channel. Using the survival value everywhere keeps the balance lever single-valued and keeps an admin's test result representative of survival play.

**Impact if wrong.** Low structurally, real in play. Too short and the ability misfires at ranges players expect to work, burning nothing but feeling broken. Too long and it edges toward the "artificial long ray" the spec excludes by decision — a balance regression, not a correctness bug. Because it is one constant used twice (ADR-014), correcting it is a one-line change. `L0-trap-ac02` pins it by asserting just-inside and just-outside the bound, so a wrong value is at least *visible* rather than silent.

**How to close.** Measure the vanilla interaction distance empirically on Bedrock 1.26.51 via a GameTest sweep, and confirm with the owner whether Creative holders should get the longer vanilla reach.






### ASM-018 — Aiming at open air inside reach resolves to the ray's end point (L0-trap-as18)

# ASM-018 — Aiming at open air inside reach resolves to the ray's end point

**Status:** `CAN_ASSUME` · **Affects:** `L0-trap` · **Source:** §5's third target form

**Assumed.** When the ray hits neither a block nor an entity within the reach bound, the target is the block cell at the **ray's end point** — i.e. the cell at exactly the reach distance along the view vector. The activation **succeeds**; it does not fail for want of something solid to hit.

**Basis.** §5 lists as a valid target *«точка непосредственно рядом с владельцем, если она находится в допустимой reach-зоне»* — a point, not a surface. That clause only has meaning if an unobstructed aim can still produce a target; otherwise the ability would be unusable in the open, which is where a PvP trap is most wanted.

**The competing reading.** §5's *«Если корректной цели нет … способность не срабатывает»* could be read as "no solid hit ⇒ no valid target ⇒ fail". This analysis rejects that reading because it makes the third target form dead text, but the two clauses are genuinely in tension and the owner may disagree.

**Impact if wrong.** Moderate and player-visible. If the fallback should not exist, the implementation places traps in mid-air where the owner expected nothing — free cobweb on every sky-aimed click, and a balance change. If the fallback exists but is placed differently (e.g. one block in front of the player rather than at full reach), the trap lands in the wrong spot in the most common open-field engagement. Either way the fix is local to `L0-trap-ptgt` step 5.

**Note.** No §13 acceptance test exercises this path at all — the gate is silent on it. Worth folding into Q-011's answer.






### ASM-019 — An entity target maps to the block cell containing its feet, and entities win ties (L0-trap-as19)

# ASM-019 — An entity target maps to the block cell containing its feet, and entities win ties

**Status:** `CAN_ASSUME` · **Affects:** `L0-trap` · **Source:** §5's *«игрок/живая сущность»*

**Assumed, two parts.**

1. When the target is a living entity, the cube centres on the **block cell containing the entity's feet position** (its standing cell), not its eye or bounding-box centre.
2. When the ray intersects both an entity and a block at comparable distance, the **entity wins** (ADR-014's precedence).

**Basis.** §5 permits an entity as a target but never says how a bounding box becomes a cell, and never orders the three target forms. Feet-cell is chosen because it is what actually traps: cobweb at foot level stops movement, cobweb centred on the eyes of a tall mob leaves it standing in clear air below.

**Impact if wrong.**

- *Wrong cell.* For a player-sized target the feet cell and the box centre differ by one, so the 3×3×3 still envelops them — tolerable. For tall entities (enderman, ravager) the two readings diverge enough that the trap can miss the legs entirely, which is the whole function.
- *Wrong precedence.* If blocks should win ties, a player standing flat against a wall would be trapped at the wall rather than at themself — a near-identical outcome in practice, so the blast radius here is small.

**Interaction with C-8.** Neither reading permits touching the entity itself. §6 forbids removing or replacing entities, and R-006 skips the *cell* an entity occupies — so the targeted entity's own cell is skipped while the eight surrounding cells at its level are filled. That is intended: the trap encircles rather than entombs.

**How to close.** Fold into Q-011 — the same answer that fixes cube geometry should state the entity mapping.






### ASM-020 — An unloaded cell is detectable by a non-loading block read (L0-trap-as20)

# ASM-020 — An unloaded cell is detectable by a non-loading block read

**Status:** `CAN_ASSUME` · **Affects:** `L0-trap` · **Source:** §6, §12, C-1

**Assumed.** On the stable `@minecraft/server` 2.10.0 surface, attempting to read a block in an unloaded or inaccessible chunk either returns `undefined` or throws — and **does not itself cause the chunk to load**. Both outcomes are treated as `reason = unloaded ⇒ skip` (R-007).

**Basis.** §6 and §12 require the behaviour (*«не форсировать опасную запись в незагруженные чанки»*) but name no API. C-1 forbids reaching for a Beta chunk-state query if one exists there. A read-and-handle probe is the only mechanism this analysis can assume exists on the stable surface.

**Impact if wrong, by direction.**

- *The read force-loads the chunk.* The probe becomes the very thing §12 calls dangerous, and R-007 is unimplementable as designed. Requires a different detection mechanism — a distance-to-simulation-boundary heuristic, or escalation to L0 under C-1 if only a Beta API can answer it.
- *The read fails in a way that is indistinguishable from a legitimately empty cell.* Air and unloaded collapse into the same verdict. Harmless for correctness (air is `permit`, unloaded is `skip`) but the wrong way round — the cell would be **written**, breaching R-007. This is the dangerous direction and must be checked explicitly, not inferred.
- *Throwing rather than returning.* Purely mechanical — the classifier wraps the probe.

**How to close.** A GameTest that reads a block at a known far-edge coordinate and asserts both the return shape and that the loaded-chunk set is unchanged afterwards. This is also the evidence `L0-trap-ac04` needs, and its outcome decides whether AC-04 can be tested directly or must fall back to unit-level evidence.






