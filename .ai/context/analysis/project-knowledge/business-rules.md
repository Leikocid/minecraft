---
title: Business Rules
type: project-knowledge
generated_at: "2026-09-21T21:24:41.647Z"
source_channel: rollout
node_id: rollout-business-rules
aliases: ["rollout-business-rules","business-rules","project-knowledge/business-rules"]
is_a: ["rollout","business-rules"]
relates_to: ["L0","L0-cool-r001","L0-cool-r002","L0-cool-r003","L0-cool-r004","L0-cool-r005","L0-item-r001","L0-item-r002","L0-item-r003","L0-item-r004","L0-item-r005","L0-keep-cons","L0-keep-r001","L0-keep-r002","L0-keep-r003","L0-keep-r004","L0-keep-r005","L0-once-r001","L0-once-r002","L0-once-r003","L0-once-r004","L0-once-r005","L0-once-r006","L0-once-r007","L0-qatg-cons","L0-qatg-r001","L0-qatg-r002","L0-qatg-r003","L0-qatg-r004","L0-qatg-r005","L0-trap-cons","L0-trap-r001","L0-trap-r002","L0-trap-r003","L0-trap-r004","L0-trap-r005","L0-trap-r006","L0-trap-r007","L0-trap-r008"]
priority: 510
---

# Business Rules

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Constraints (L0)

# Constraints

**Links** — `title: Constraints` · `aliases: ["L0-constraint", "Constraints"]` · `part_of: ["L0"]` · `is_a: ["constraint"]` · `relates_to: ["L0"]` · `see_also: ["webswordspecv1ruen-part-2", "stage-0-infrastructure"]` · `governs_files: ["packs/behavior/manifest.json", "packs/resource/manifest.json", "package.json"]` · `supersedes: ["L0"]`

## C-1 — Stable API only (governing policy)

*«Предпочтение: stable Bedrock APIs. Не использовать Preview/Beta API, если механика реализуема стабильным способом.»* (§11) · *«Нет обязательной зависимости от Experiments/Preview.»* (§14)

Inherited unbroken from Stage 0. This is the project's strongest policy and it **binds design, not just dependencies**: if a mechanic is only expressible via a Beta API, the mechanic changes — the channel does not. `@minecraft/server` **2.10.0**; `min_engine_version` **[1, 26, 50]**; target game **Bedrock 1.26.51**.

The `@minecraft/server-gametest` dependency (`1.0.0-beta.…`) is a **devDependency used by `packs/gametest`** and must never become a runtime dependency of `packs/behavior`. Any change that makes the shipped behavior pack require it violates §14.

## C-2 — Retarget the pack to the game, never the reverse

Stage 1's rule, still governing: *"If the installed game reports a dependency or format error, use the exact error text to retarget the pack rather than enabling Preview/Beta APIs by default."* Version failures are diagnosed from log text, not worked around by loosening the channel.

## C-3 — Server-authoritative execution

*«Способность должна вычисляться серверной логикой, чтобы все игроки видели одинаковый результат.»* (§9) · *«Targeting и размещение 3×3×3 должны выполняться серверно.»* (§11)

No client-side prediction, no per-client divergence. Two clients observing the same activation must see the same 27 cells resolve identically. This forbids any design where block placement is derived from client-supplied state that the server does not re-validate.

## C-4 — No per-tick global world scan (performance)

*«Не делать постоянный глобальный скан мира каждый tick.»* (§11)

The only explicit performance requirement in the spec, and it is phrased as a prohibition. Ability logic must be **event-driven** (activation events, death events, craft events), not polling. Cooldown display is the one place a recurring tick is defensible, and it must be scoped to players actually holding the sword — not to the world.

## C-5 — Dedicated-multiplayer safety

*«Любая реализация должна быть безопасной для dedicated multiplayer server.»* (§11)

Concretely: concurrent crafts by two players must not both succeed (§9); concurrent activations must each resolve independently (§9); no global mutable state may assume a single player. The Docker BDS rig is the test surface for this, not the single-player world.

## C-6 — Durable world-level state

*«Persistent one-per-world state хранить в устойчивом world-level состоянии, доступном после рестартов.»* (§11) · *«Флаг успешного крафта должен сохраняться после выхода игроков, сохранения мира и рестарта сервера.»* (§3)

State must survive three distinct events — player logout, world save, server restart — and §13 makes restart survival an explicit acceptance test. Per-player or in-memory state does not satisfy this.

## C-7 — No duplication paths (security/integrity invariant)

*«Нет известных способов дюпа через крафт, смерть или reconnect.»* (§14) · *«Реализация обязана предотвращать появление дополнительной копии при смерти, disconnect/reconnect и рестарте.»* (§4) · *«Смерть во время cooldown не должна создавать копию меча или сбрасывать persistent one-per-world flag.»* (§12)

This is stated as an absolute. It is the single most demanding non-functional requirement in the spec and it constrains `L0-once` and `L0-keep` jointly — a fix on one side can open a hole on the other.

## C-8 — Non-destructive world mutation

*«Не удалять и не заменять сущности… Не заменять контейнеры и функциональные блоки с важным содержимым/данными… Не заменять bedrock и другие явно защищённые/неразрушаемые специальные блоки.»* (§6)

The ability writes to shared world state that other players own. The default posture is **deny**: a cell whose safety cannot be established must be skipped, not filled. Note that the spec names only *examples* of protected blocks — the closed list is an assumption (see ASM-007).

## C-9 — Localization is structural, not cosmetic

*«Использовать стандартную систему локализации Resource Pack, а не жёстко вшивать только один язык в скрипт.»* (§10)

Stated as a prohibition on implementation technique. Scripts must emit translate keys (rawtext), never literal strings — and this covers **runtime messages**, not only the item name: the first-craft announcement and the cooldown readout are both explicitly in scope. Existing catalogues: `packs/resource/texts/ru_RU.lang`, `en_US.lang`.

## C-10 — Preserve the delivered platform

Stages 0 and 1 are shipped at v0.2.1. The Web Sword extends the same BP/RP. `andrew:miners_pickaxe`, the auto-smelt behaviour, the build/validate pipeline and the 7 existing test suites must continue to pass. Version bumps go through `npm run version:set` (the established one-command path), which keeps `package.json` and all four manifests in step.

## C-11 — Three-hop verification loop (environmental)

No Bedrock client exists for macOS. Verification is necessarily split: **Docker BDS** answers *"did it load and run?"* (greppable logs, GameTest, multiplayer), **iPad** answers *"does it look right?"* (Creative visibility, icon, RU/EN rendering, actionbar). Neither can substitute for the other. §14's two-player requirement strains this environment — see ASM-010.

## C-12 — Effort envelope (planning constraint)

§15 budgets **2–5 h** to a first working prototype and **4–10 h** to a properly tested standalone module, *conditional on the AI agent being able to launch Bedrock and read runtime/content logs quickly*. That precondition is satisfied (`bds:check`, `bds:gametest`). The estimate explicitly attributes most of the cost to one-per-world persistence, death-retention/anti-dup and multiplayer edge cases — the same three areas C-6 and C-7 govern.




- **node**: L0

### Cool r001 concept rule (L0-cool-r001)

**R-cool-001 — Exactly 30-second cooldown duration.**

Source: §8 — *«Cooldown способности: ровно 30 секунд после успешного создания ловушки.»*

Duration is exactly 30 real-time seconds (600 ticks at 20 TPS). It is stored on the ability's registration (`L0-cool-ent1`, `AbilityRegistration.durationTicks`), not hardcoded inline at each call site — so a future weapon can register its own duration without touching this component's core logic (ADR-007 seam).

**Consequences:**
- `readyAtTick = currentTick + durationTicks` at the moment `start()` is called (R-cool-002).
- No mechanism shortens or extends an in-progress cooldown; the duration is fixed at start time.

**Rationale.** This is the ability's balance knob. §8 states it as an exact figure with no tolerance language, unlike several other spec clauses that hedge.

**Verified by:** `L0-cool-ac01`, `L0-cool-ac02`.




- **node**: L0-cool-r001

### Cool r002 concept rule (L0-cool-r002)

**R-cool-002 — Cooldown starts only on confirmed successful activation.**

Source: §5 — *«Если корректной цели нет или цель вне допустимой дистанции, способность не срабатывает и cooldown не запускается»*; §8; ADR-006's forced ordering (validate reach → check cooldown → place cells → start cooldown).

`start(player, abilityKey)` may only be called by `L0-trap`, and only after cell placement is confirmed complete. A failed reach check, an out-of-range target, or any other failed precondition must not call `start` — no cooldown-related state may be written on a failed attempt.

**Consequences:**
- `isReady()` (the pre-placement check) is strictly read-only — it must never have a side effect that could be mistaken for arming the timer.
- A failed attempt leaves any pre-existing cooldown record completely untouched, not reset, not extended.
- This component has exactly one call site that writes a new record; there is no secondary or implicit start path.

**Rationale.** §12's boundary note: *"failing [reach] is free"* — the cooldown is a cost of success only. Any other order lets a player burn the cooldown on a whiff.

**Verified by:** `L0-cool-ac04`.




- **node**: L0-cool-r002

### Cool r003 concept rule (L0-cool-r003)

**R-cool-003 — Cooldown is keyed by player + ability, never by item instance.**

Source: ASM-009 (inherited), ADR-007 (inherited).

The cooldown record's key is `(playerId, abilityKey)`. A player holding two Web Swords (e.g. one crafted, one admin-given per §4) shares exactly one timer between them. The service's public API must not accept an item or item-stack identifier as part of the key, and must not derive the key from which physical sword instance triggered the activation.

**Consequences:**
- Swapping which Web Sword is in hand mid-cooldown has no effect on the timer.
- A future second ability (e.g. weapon #2) gets its own `abilityKey` and therefore its own independent record for the same player — the two do not share a cooldown unless explicitly designed to.

**Rationale.** Per-instance keying would let a player alternate two copies to bypass the 30 s limiter entirely, defeating the weapon's only balance mechanism (ASM-009's impact-if-wrong).

**Note on verification.** §13's twelve acceptance tests do not exercise the two-copies-in-inventory case directly; this rule is structurally enforced by the entity model (`L0-cool-ent1`) rather than caught by a specific test, similar to ASM-008's gap note for `L0-trap`.




- **node**: L0-cool-r003

### Cool r004 concept rule (L0-cool-r004)

**R-cool-004 — Actionbar is visible only to current holders, and the render loop is scoped the same way.**

Source: §8 — *«При удержании Web Sword игрок должен видеть...»*; C-4; decomposition plan — *"the only child with a per-tick component, which must stay scoped to holders of the sword."*

The countdown renders only for a player currently holding (main or off hand — `L0-cool-asm3`) an item registered with an active ability key; it is cleared, or simply not written, the instant they stop holding it or the timer reaches zero. The recurring render interval that produces this must enumerate **only** such holders each cadence tick — never all online players unconditionally, never a world scan.

These are the same requirement seen from two sides: what the player sees, and what the loop is allowed to cost.

**Consequences:**
- Holding state is re-evaluated every cadence tick, not cached — unequipping mid-cooldown stops both the display and its per-tick cost immediately.
- A server with zero current holders costs this component nothing beyond the loop's own holder-filter check.

**Rationale.** C-4 forbids per-tick global scans; this is the one named exception, conditional on staying scoped.

**Verified by:** `L0-cool-ac03`, `L0-cool-ac05`.




- **node**: L0-cool-r004

### Cool r005 concept rule (L0-cool-r005)

**R-cool-005 — Countdown text is a translate key, never a literal.**

Source: C-9 (inherited), ADR-009 (inherited) — *«Использовать стандартную систему локализации Resource Pack, а не жёстко вшивать только один язык в скрипт»* (§10).

The actionbar string is emitted as rawtext with a `translate` key sourced from `L0-item`'s `.lang` catalogue and a `with` substitution for the remaining-seconds value. No hardcoded RU or EN string may appear anywhere in this component's code.

**Consequences:**
- This component requests a key from `L0-item` (e.g. `item.andrew:web_sword.cooldown`); it does not define the key itself (ownership rule from the decomposition plan: *"Localization ownership is central, use is distributed"*).
- Any new user-facing string this component introduces in the future is a `.lang` addition landed jointly with `L0-item`, never a standalone literal.

**Rationale.** Runtime messages are explicitly in scope for C-9, not just the item name — the decomposition plan calls this out by name for the cooldown readout specifically.

**Verified by:** `L0-cool-ac03`.




- **node**: L0-cool-r005

### Item r001 concept rule (L0-item-r001)

**Links** — `part_of: ["L0-item"]` · `is_a: ["rule"]` · `relates_to: ["L0-item-ent1"]`

**Rule — Damage & durability parity.** `andrew:web_sword` must replicate vanilla Diamond Sword melee damage and must never lose durability. Implementation: an explicit `minecraft:damage` component matching Diamond Sword's value, and **omission** of `minecraft:durability` entirely — not a very-high numeric durability pool.

**Rationale.** §1: *«Обычный удар должен иметь урон алмазного меча»* + *«Прочность: бесконечная; предмет не должен ломаться»*. §13 tests both "no durability loss after extended use" and passive-hit damage parity as separate acceptance criteria.

**Precedent.** `packs/behavior/items/miners_pickaxe.json` already uses component-omission for infinite durability rather than a large numeric value — this is the established project idiom, not a new choice.

**Source:** §1, §13 AC-5; carries ASM-005/Q-007 (see `L0-item-asm1`).




- **node**: L0-item-r001

### Item r002 concept rule (L0-item-r002)

**Links** — `part_of: ["L0-item"]` · `is_a: ["rule"]` · `relates_to: ["L0-item-ent1"]`

**Rule — Discoverability.** The item must be reachable through all four vanilla discovery paths simultaneously: the Creative Equipment tab ("Снаряжение"), the unfiltered "Все"/All catalogue, Creative Search, and `/give`.

**Rationale.** §1 lists all four explicitly, and §13's first acceptance test checks them together as **one** criterion — none may be satisfied by accident. A wrong `menu_category.group` can hide an item from its equipment tab while `/give` still works, silently failing the combined test.

**Implementation note.** `menu_category.category: "equipment"` with a sword-appropriate `group` (the sword-equivalent of the pickaxe's `itemGroup.name.pickaxe`), matching the pickaxe's precedent for tab placement.

**Source:** §1, §13 AC-1.




- **node**: L0-item-r002

### Item r003 concept rule (L0-item-r003)

**Links** — `part_of: ["L0-item"]` · `is_a: ["rule"]` · `relates_to: ["L0-item-ent2"]`

**Rule — Recipe shape.** The crafting recipe is a fixed 3×3 **shaped** recipe — a plus-pattern of 4× Cobweb (top/bottom/left/right cells) around 1× Diamond Sword (center cell) — yielding exactly 1× Web Sword.

**Must be `minecraft:recipe_shaped`, not shapeless.** Despite every non-empty cell holding one of only two ingredient types, position is meaningful: a Diamond Sword off-center, or Cobweb in a corner instead of an edge, must **not** match. Symmetric-looking ingredient sets are the most common source of shaped-vs-shapeless recipe bugs.

**Rationale.** §2's row-by-row layout (`Empty|Cobweb|Empty` / `Cobweb|DiamondSword|Cobweb` / `Empty|Cobweb|Empty`) is explicit and geometric.

**Precedent.** `packs/behavior/recipes/miners_pickaxe.json` uses `minecraft:recipe_shaped` with `tags: ["crafting_table"]` and an `unlock` clause — same shape expected here.

**Source:** §2, §13 AC-2.




- **node**: L0-item-r003

### Item r004 concept rule (L0-item-r004)

**Links** — `part_of: ["L0-item"]` · `is_a: ["rule"]` · `relates_to: ["L0-trap", "L0-cool"]`

**Rule — Passive behavior is exactly vanilla.** A normal melee attack with the Web Sword must have **no** side effects beyond standard Diamond Sword combat: no cobweb placement, no cooldown consumption, no message. This is achieved by *not attaching any behavior to the attack/hurt event* — the absence of a hook is the correct implementation, not a filtered no-op.

**Rationale.** §7 is explicit: *«У обычного melee-удара нет дополнительного эффекта… не создаёт паутину и не запускает cooldown»*; §13 AC-6 tests it directly.

**Cross-component boundary marker.** This rule constrains `L0-trap` and `L0-cool` as much as this component: their logic must gate on the **Use** event only, never on **hurt/attack**. If either sibling is found listening to an attack-family event, that is a boundary violation to flag upward, not a bug local to that sibling.

**Source:** §7, §13 AC-6; consistent with ASM-006 (parent, `L0-trap`/`L0-cool` scope).




- **node**: L0-item-r004

### Item r005 concept rule (L0-item-r005)

**Links** — `part_of: ["L0-item"]` · `is_a: ["rule"]` · `relates_to: ["L0-item-ent3", "L0-once", "L0-cool"]`

**Rule — Localization is exhaustive and centralized.** Every user-facing string this add-on will ever emit for the Web Sword — the item's own RU/EN display name, the first-craft broadcast text (owned by `L0-once`), and the cooldown actionbar text (owned by `L0-cool`) — must exist as a translate key in **this component's** `.lang` catalogue before the consuming sibling ships. No sibling may hardcode a literal string in either language.

**Rationale.** §10 (*«Использовать стандартную систему локализации Resource Pack, а не жёстко вшивать только один язык в скрипт»*) plus C-9 plus `concept-architecture-decision` ADR-009 make this a **structural** requirement, not a style preference. A literal string in a script permanently fails the "not hardcoded" test even when the visible in-game behavior looks correct in one language.

**Enforcement note.** Any sibling PR/change that adds a `sendMessage`/actionbar call without a matching `.lang` pair in the same change is incomplete — this belongs in `L0-qatg`'s acceptance checks.

**Source:** §10, C-9, ADR-009.




- **node**: L0-item-r005

### Component Constraints — Death Retention & Anti-Duplication (L0-keep-cons)

# Component Constraints — Death Retention & Anti-Duplication

**Links** — `part_of: ["L0-keep"]` · `is_a: ["constraint"]` · `relates_to: ["L0-keep-r002", "L0-keep-r005"]` · `inherits: ["C-1", "C-4", "C-5", "C-6", "C-7", "C-9", "C-10", "C-11"]`

Inherited constraints C-1…C-12 bind unchanged. The entries below are the component-specific reading — how each one actually bites here.

## KC-1 — C-7 is an absolute, not a target

C-7 admits no error budget: *«Нет известных способов дюпа»*. For this component that has a concrete consequence — **a dup bug is not shippable at any severity discount.** Unlike a mis-sized cobweb cube (`L0-trap`), a duplication defect produces permanent world state that cannot be detected after the fact without auditing every inventory and container on the server. Treat `L0-keep-ac03` and `ac04` as release blockers, not as regression tests.

## KC-2 — Fail toward loss, never toward duplication

The design must have no interruption window whose outcome is an extra item (`L0-keep-r002`). Where atomicity is unavailable, order the operations so a crash destroys the sword. This is a deliberate, stated trade: recoverable harm over unrecoverable harm.

## KC-3 — Durability across three discontinuities (C-6)

State must survive **logout**, **world save** and **server restart** independently. Restart is an explicit §13 acceptance test for the craft flag and the same bar applies to the ledger. In-memory or session-scoped state is disqualified outright.

## KC-4 — Stable API only (C-1)

Death/drop interception, durable properties, and any item-stack provenance marker must all exist on `@minecraft/server` 2.10.0. Per C-1 this binds *design*: if retention is only expressible via a Beta API, **the mechanic changes and the channel does not** — escalate to L0 rather than opening the Preview channel. `@minecraft/server-gametest` remains a devDependency and must not leak into `packs/behavior`.

## KC-5 — Dedicated-multiplayer safety (C-5)

Ledger keys are per-player and disjoint, so concurrent deaths do not interact. No global mutable retention state may be introduced that assumes a single player. The Docker BDS rig — not the single-player world — is the test surface (C-11).

## KC-6 — Event-driven only (C-4)

No per-tick work of any kind. This component has no recurring tick at all; the one permitted tick in the project belongs to `L0-cool`'s actionbar writer. See `L0-keep-r005`.

## KC-7 — No regression of the shipped platform (C-10)

Death handling is a broad hook. It must not alter drop behaviour for `andrew:miners_pickaxe`, for vanilla items, or for any other player. ADR-008 rejected `keepInventory` precisely to keep this blast radius at one item. The 7 existing suites must still pass.

## KC-8 — Verification is split and neither half suffices (C-11)

Dup-path testing is **BDS/GameTest work** — simulated player, scripted death, disconnect and restart cycles. The iPad contributes nothing here; there is no visual surface to this component. This is the one component whose acceptance is entirely log- and assertion-driven, which makes it a good fit for automation and a poor fit for manual checking.

## KC-9 — No user-facing literals (C-9)

This component emits no messages by design. If one is added (e.g. an inventory-full notice), it must be a translate key consumed from `L0-item`'s catalogue per ADR-009 — never a literal string.




- **node**: L0-keep-cons

### Rule K-R1 — A bonded Web Sword never becomes a death drop (L0-keep-r001)

# Rule K-R1 — A bonded Web Sword never becomes a death drop

**Links** — `part_of: ["L0-keep"]` · `is_a: ["rule"]` · `relates_to: ["L0-keep-p001", "L0-keep-ac01"]` · `spec: ["§4"]` · `implements: ["WS-9"]`

**Rule.** When a player dies carrying a provenance-marked Web Sword, that item must not appear as a dropped entity in the world at any point — not transiently, not for one tick.

**Source.** §4: *«Web Sword владельца не должен выпадать при смерти.»*

**Rationale.** A one-per-world legendary lying on the ground is lootable by the killer and despawnable by the engine. Either outcome defeats §4's *«предмет должен вернуться тому же владельцу»*. A *transient* drop is worse than a permanent one: if the item exists on the ground even briefly while a ledger entry is also owed, both can be collected — that is the primary dup path C-7 forbids.

**Scope.** Marked instances only. An unmarked admin/`/give` copy drops normally (`L0-keep-ent2`) — it is an ordinary item.

**Testable as.** `L0-keep-ac01`.

**Violation looks like.** Cobweb-sword item entity visible near the death location, or recoverable by another player, even if the owner also gets one back on respawn.




- **node**: L0-keep-r001

### Rule K-R2 — Conservation: the sword is in exactly one place, and loss is preferred to duplication (L0-keep-r002)

# Rule K-R2 — Conservation: the sword is in exactly one place, and loss is preferred to duplication

**Links** — `part_of: ["L0-keep"]` · `is_a: ["rule"]` · `relates_to: ["L0-keep-p001", "L0-keep-p002", "L0-keep-p003", "L0-keep-ent1", "L0-keep-ac02", "L0-keep-ac03", "L0-keep-ac04"]` · `spec: ["§4", "§12", "§14"]` · `governed_by: ["C-7"]`

> The central invariant of this component. Every other rule here serves it.

**Rule.** At all times, a bonded Web Sword is either **(a)** an item in exactly one inventory/container, or **(b)** a `pending` obligation in the Retention Ledger — **never both, and never neither-by-accident**. Every transition between (a) and (b) must be idempotent: replaying the triggering event must not produce a second item.

**Source.** §4 *«Реализация обязана предотвращать появление дополнительной копии при смерти, disconnect/reconnect и рестарте»* · §14 *«Нет известных способов дюпа через крафт, смерть или reconnect»* · C-7, which states this absolutely.

**Rationale.** Retention is implemented as *remove now, re-grant later*. That pair is a dup primitive whenever the two halves can both take effect, or the grant can run twice. Events in a game server are not guaranteed to fire exactly once, and a crash can land anywhere between the halves. Correctness therefore cannot rest on event delivery — it must rest on durable state read and flipped before the item is materialised.

## The ordering corollary

The two failure directions are **not** symmetric, so the crash window must always fail toward loss:

| Transition | Correct order | If interrupted |
|---|---|---|
| Retain (`p001`) | remove item **→ then** write `pending` | Item gone, nothing owed → sword lost |
| Restore (`p002`) | flip to `redeemed` **→ then** grant item | Nothing owed, no item → sword lost |

Reversing either order turns the interruption into a duplicate. A lost sword is an admin `/give` away from being fixed and is *visible* to the player who lost it; a duplicated sword is permanent, silent, and defeats the one-per-world design `L0-once` exists to enforce.

**Corollary — redemption is a claim, not a read.** "Check `pending`, then grant, then mark `redeemed`" is wrong even though it reads naturally. The check and the flip must be one operation, or two concurrent respawn events can both pass the check.

**Testable as.** `L0-keep-ac02` (happy path), `ac03` (reconnect replay), `ac04` (restart replay).

**Violation looks like.** Any sequence of death / disconnect / rejoin / restart, in any order and repeated any number of times, that ends with two `andrew:web_sword` instances where one existed before.




- **node**: L0-keep-r002

### Rule K-R3 — Retention applies only to provenance-marked instances (L0-keep-r003)

# Rule K-R3 — Retention applies only to provenance-marked instances

**Links** — `part_of: ["L0-keep"]` · `is_a: ["rule"]` · `relates_to: ["L0-keep-ent2", "L0-keep-ac06"]` · `source: ["CTR-005"]` · `blocked_by: ["Q-006"]` · `spec: ["§3", "§4"]`

> **CONDITIONAL — depends on Q-006.** Stated here as the recommended branch; `L0-keep`'s design assumes it.

**Rule.** The no-drop and restore-on-respawn behaviours apply **only** to Web Sword instances carrying the `survival_craft` provenance marker. An unmarked instance — obtained via Creative inventory or `/give` — behaves as an ordinary item: it drops on death, is lootable, and creates no ledger entry.

**Source.** Derived, not quoted. §3 and §4 permit unlimited admin copies (*«Creative/test copies могут существовать у администратора»*) while §4 and §14 forbid duplication absolutely. CTR-005 shows these cannot both hold without instance provenance.

**Rationale.** The restore predicate must answer *"is this **the** owner's sword?"*, not *"is this **a** Web Sword?"*. Without a marker the two questions are indistinguishable, and every implementation either dupes admin copies or strips retention from a legitimately-held one. Restricting retention to the marked instance makes the retained set exactly the set `L0-once` already bounds to one per world — which is what makes §14's absolute claim survivable.

**Consequence.** Admin copies are explicitly *not protected*. An operator testing on a live server will lose a `/give` sword on death. This is intended and should be documented for operators, not patched.

**If Q-006 is answered "no".** This rule is void and the component degrades: retention must be narrowed to some weaker heuristic (e.g. the first Web Sword a player acquires) or dropped, **and** §14's no-dup claim must be relaxed in writing to exclude admin copies. `L0-keep-ac06` changes meaning accordingly. Do not implement a heuristic silently — the relaxation is a spec change and belongs to the owner.

**Testable as.** `L0-keep-ac06`.




- **node**: L0-keep-r003

### Rule K-R4 — Death never touches the one-per-world craft flag (L0-keep-r004)

# Rule K-R4 — Death never touches the one-per-world craft flag

**Links** — `part_of: ["L0-keep"]` · `is_a: ["rule"]` · `relates_to: ["L0-once", "L0-keep-ac05"]` · `spec: ["§12"]` · `governed_by: ["C-7"]`

**Rule.** No path in this component may read-modify-write, clear, or otherwise affect the persistent one-per-world craft flag owned by `L0-once`. Death, respawn, disconnect, rejoin and restart leave it exactly as it was.

**Source.** §12: *«Смерть во время cooldown не должна создавать копию меча или сбрасывать persistent one-per-world flag.»* The parent decomposition assigns this invariant to `L0-keep` explicitly: *"`L0-once` owns the craft flag; `L0-keep` owns the item ledger… §12's invariant is the one that connects them and belongs to `L0-keep` as a constraint it must respect."*

**Rationale.** The flag counts **craft events**, not swords in existence (see `concept-boundary`). Losing a sword to death does not un-spend the world's one craft, so a reset would hand out a second legitimate craft — a dup path that arrives through the craft gate rather than the item, and one C-7 covers just as absolutely.

The inverse is equally forbidden: retention must not *set* the flag either. Restoring a sword is not a craft.

**Practical form.** The ledger and the flag are separate keys in durable storage with no code path between them. Reviewability is the point — a reviewer should be able to grep this component and find zero references to the craft-flag key.

**Testable as.** `L0-keep-ac05`.

**Violation looks like.** A player crafts the Web Sword, dies, and the world then permits a second survival craft.




- **node**: L0-keep-r004

### Rule K-R5 — Retention state is durable and event-driven; never derived by scanning (L0-keep-r005)

# Rule K-R5 — Retention state is durable and event-driven; never derived by scanning

**Links** — `part_of: ["L0-keep"]` · `is_a: ["rule"]` · `relates_to: ["L0-keep-ent1", "L0-keep-p003"]` · `governed_by: ["C-4", "C-6", "C-1"]` · `spec: ["§11"]`

**Rule.** Retention state lives in durable world-level storage on the stable API and is mutated **only** from discrete events (death, respawn, join). It is never reconstructed by enumerating players, scanning inventories, or searching the world for Web Sword instances — neither per tick nor once at server start.

**Source.** C-6 / §11 *«Persistent … state хранить в устойчивом world-level состоянии, доступном после рестартов»* · C-4 / §11 *«Не делать постоянный глобальный скан мира каждый tick»* · C-1, stable APIs only.

**Rationale.** Three separate reasons converge:

1. **Performance (C-4).** The prohibition is explicit and is the spec's only stated performance requirement.
2. **Correctness.** A scan cannot see offline players' inventories or items inside unloaded chunks, so any derived state is wrong exactly when it matters — a disconnected player mid-death is the case `L0-keep-p003` exists for.
3. **Precedent.** ADR-005 rejected *«Deriving the flag by scanning for existing Web Swords»* for the analogous craft flag. The same reasoning binds here.

**Corollary — no startup sweep.** Restart safety comes from the storage being durable, not from recovery logic. If a boot-time reconciliation pass seems necessary, the ledger design is wrong.

**Corollary — no cleanup job.** A `pending` entry for a player who never returns costs one map key and represents an item that does not exist. Expiring entries would risk granting on stale state; leave them.

**Storage class.** World-scoped dynamic properties on `@minecraft/server` 2.10.0 — the same mechanism ADR-005 chose, for the same durability requirements (survives logout, world save, restart) and within the same stable-API boundary. No Beta/Preview surface (C-1), no external files.




- **node**: L0-keep-r005

### Once r001 concept rule (L0-once-r001)

**R-001 — Exactly one survival craft of `andrew:web_sword` per world, forever.**

Source: §3 — *«В Survival конкретный Web Sword можно успешно скрафтить только один раз на весь мир/сервер.»*

The world craft flag (`L0-once-ecft`) is **write-once**. Once `crafted: true` is recorded, no game-logic path may clear, overwrite or bypass it. Every craft-completion event for `andrew:web_sword` is evaluated against it, and every evaluation after the first in Survival is a denial.

**Consequences:**
- There is no in-game reset. Not by death, not by reconnect, not by the crafter leaving the server, not by the sword being destroyed (see CTR-006 for the last one — an open question, not a licence to reset).
- "Blocked" means the player obtains no second Web Sword. It does not mean the craft attempt is prevented from occurring; see R-005 for the ingredient question.
- The rule is scoped to the **craft event**, not to the number of swords in the world. See R-003 and R-007.

**Rationale.** This is the weapon's entire scarcity design and the reason the item is "legendary". A re-openable gate is a C-7 duplication path by definition.

**Verified by:** `L0-once-accp1`, `L0-once-accp2`, `L0-once-accp3`.




- **node**: L0-once-r001

### Once r002 concept rule (L0-once-r002)

**R-002 — The craft flag survives logout, world save, server restart and player death.**

Source: §3 — *«Флаг успешного крафта должен сохраняться после выхода игроков, сохранения мира и рестарта сервера.»* · §11 — *«Persistent one-per-world state хранить в устойчивом world-level состоянии, доступном после рестартов.»* · §12 — *«Смерть во время cooldown не должна … сбрасывать persistent one-per-world flag.»*

Four survival events, each independently testable:

| Event | Requirement |
|---|---|
| Crafter logs out | Flag unaffected. Per-player storage therefore does not satisfy this |
| World save / autosave | Flag written durably, not held in memory only |
| Server restart | Flag readable on next boot. **Explicit §13 acceptance test** |
| Player death (incl. during cooldown) | Flag unaffected. §12 names this directly |

**Enforcement.** The flag is a world-scoped dynamic property (ADR-005), which gives the first three for free. The fourth is a **negative** requirement on a *sibling*: `L0-keep` handles death and respawn and must not write, clear or derive from this flag. The decomposition plan's ownership rule makes this explicit — `L0-once` owns the craft flag, `L0-keep` owns the item ledger, neither writes the other's state.

**Rationale.** C-6 makes durability a constraint; C-7 makes the consequence of losing it a duplication path. A flag lost on restart silently re-opens the world's craft budget, and no one notices until a second sword appears.

**Verified by:** `L0-once-accp3` (restart), `L0-once-accp6` (death).




- **node**: L0-once-r002

### Once r003 concept rule (L0-once-r003)

**R-003 — Creative crafting and `/give` neither spend nor restore the craft budget.**

Source: §3 — *«Creative и /give предназначены для тестирования/администрирования и НЕ расходуют право на единственный survival-крафт.»* · §4 — *«Creative/test copies могут существовать у администратора; one-per-world относится к survival crafting, а не к количеству dev/test copies.»*

The exemption is **symmetric and total**:

- A Creative craft before the first survival craft leaves the budget fully available.
- A Creative craft after it does **not** clear the gate.
- `/give` produces no craft event at all and is therefore exempt by construction.
- No announcement is broadcast on either path — the reveal belongs to the survival craft alone.
- There is **no cap** on the number of admin/test copies that may exist. §4 permits them without limit.

**Discrimination point.** Survival-vs-Creative is decided by reading the crafting player's game mode **at craft time**, server-side (C-3). It is not inferred from the item, the recipe or the inventory.

**Non-Creative, non-Survival modes.** Adventure-mode players can craft. The spec is silent. Assumed default: **Adventure spends the budget** (it is a play mode, not an admin mode); Spectator cannot craft and is moot. Recorded as ASM-013, raised as an open question. Do not treat this default as settled.

**Rationale.** Without this exemption, testing the weapon would consume the world's only craft, making the feature untestable on a live world. It is also the rule that makes swords indistinguishable by provenance — the root of CTR-005, which `L0-keep` owns.

**Verified by:** `L0-once-accp4`.




- **node**: L0-once-r003

### Once r004 concept rule (L0-once-r004)

**R-004 — Simultaneous crafts by two players yield exactly one success.**

Source: §9 — *«Два игрока не должны иметь возможность обойти one-per-world crafting из-за одновременного крафта.»* · C-5 (dedicated-multiplayer safety).

When two or more players complete a Web Sword craft in the same tick or in adjacent ticks:

- **Exactly one** claims the flag, keeps the sword, and triggers the announcement.
- **All others** are treated as blocked second crafts and follow `L0-once-pblk`.
- Which one wins is **unspecified and need not be fair** — the spec requires only that the gate cannot be bypassed. First-observed wins.

**Mechanism.** The flag read and the flag write must occur in a single synchronous handler invocation with no `await`, no promise, no `runTimeout` and no deferral between them. The Bedrock script host runs one event handler to completion before dispatching the next, so an uninterrupted read-check-write *is* the atomic claim (ASM-015, ADR-011). Introducing any asynchrony into that window re-opens the race.

**Anti-pattern to reject in review:** reading the flag in one handler and writing it from a queued callback, a `system.run`, or after an `await`. It will pass every single-player test and fail only under real concurrency — exactly the case C-5 says must be tested on BDS rather than in a single-player world.

**Rationale.** C-7 states "no known dup paths" absolutely. A craft race is the cheapest dup path in the design and the one a coordinated pair of players will find first.

**Verified by:** `L0-once-accp5`.




- **node**: L0-once-r004

### Once r005 concept rule (L0-once-r005)

**R-005 — A blocked craft must not silently tax the player.**

Source: §3 — *«повторный survival-крафт должен быть заблокирован без потери ингредиентов, насколько это позволяет стабильный API.»*

Two obligations, of different strength:

1. **Absolute** — the player obtains no second `andrew:web_sword`. The crafted result is removed. No escape clause applies to this half.
2. **Conditional** — the 4× Cobweb and 1× Diamond Sword are returned, *to the extent the stable API permits*. This is the only requirement in the entire spec carrying a built-in get-out, and the only one with **no corresponding §13 acceptance test** (CTR-003, open, inherited from L0).

**Preference order** (see `L0-once-pblk` for the full ladder): pre-craft veto > detect-and-refund > blocked-and-consumed.

**Floor.** If the implementation lands on "blocked-and-consumed", it **must** emit the localized denial message (`andrew.web_sword.already_crafted`) so the player learns why the ingredients vanished. A Diamond Sword per attempt is not a trivial cost, and silent consumption is the failure mode CTR-003 was filed to prevent.

**Do not self-resolve.** The owner must rank the fallbacks and the winner must be added to §13 as a testable criterion. Until then `L0-once-accp7` is written as conditional. An implementation that ships rung 3 while documenting rung 2 is a defect regardless of which rung the owner picks.

**Rationale.** As written, an implementation that eats a Diamond Sword on every blocked attempt passes §13 and §14 in full. The spec's own acceptance suite cannot detect the difference, so the rule has to carry it.

**Verified by:** `L0-once-accp2` (absolute half), `L0-once-accp7` (conditional half).




- **node**: L0-once-r005

### Once r006 concept rule (L0-once-r006)

**R-006 — Every message this component emits is a translate key, resolved by the Resource Pack.**

Source: §3 — *«отправить всем игрокам локализованное сообщение с названием оружия и именем создателя»* · §10 — *«Все пользовательские сообщения, включая first-craft announcement … должны иметь RU/EN варианты. Использовать стандартную систему локализации Resource Pack, а не жёстко вшивать только один язык в скрипт.»* · C-9, ADR-009.

**Prohibited:** literal strings in `sendMessage`, string concatenation to build a sentence, a script-side language dictionary, and inlining the weapon's name as text inside an otherwise-translated message.

**Required:** rawtext with `translate` keys plus `with` substitutions. The weapon name is a **nested** `translate` referencing the item's own name key, so it localizes alongside the sentence.

**Keys this component consumes** (owned and reconciled by `L0-item` — localization ownership is central, use is distributed):

| Key | Used by |
|---|---|
| `andrew.web_sword.first_craft` | `L0-once-pcft` step 6 |
| `andrew.web_sword.already_crafted` | `L0-once-pblk` step 4 |

Both require a `ru_RU.lang` **and** an `en_US.lang` entry, landed in the same change as the code that emits them (ADR-009's consequence). This component adds **no literals of its own** and does not edit the catalogue unilaterally; it declares its key list to `L0-item`.

**Audience.** The announcement goes to all players online at craft time. No replay for later joiners (ASM-012). The denial message goes to the blocked player only.

**Verified by:** `L0-once-accp8` (both locales render, no raw key text visible on screen).




- **node**: L0-once-r006

### Once r007 concept rule (L0-once-r007)

**R-007 — The flag is the sole authority. The gate is never derived from the world.**

Source: §3 (the budget counts crafts) · §4 (*«one-per-world относится к survival crafting, а не к количеству dev/test copies»*) · §11 / C-4 (no per-tick global world scan) · ADR-005 (rejected alternative: *deriving the flag by scanning for existing Web Swords*).

The craft gate reads `L0-once-ecft` and nothing else. The following are **forbidden** as inputs to the decision:

- Counting `andrew:web_sword` instances in player inventories, containers, or dropped on the ground.
- Scanning the world, periodically or on demand, for existing swords.
- Inspecting a scoreboard, a marker entity, or any file outside the world.
- Asking `L0-keep`'s ownership ledger whether a sword exists.

**Two independent reasons, either sufficient:**

1. **Correctness.** §4 permits an unbounded number of admin/Creative copies. Any count-based gate would be wrong the moment an operator runs `/give` — and would also wrongly re-open the budget if the crafted sword were destroyed.
2. **Performance.** A world scan is either per-tick (directly prohibited by §11 and C-4) or on-demand-and-incomplete (unloaded chunks are invisible), and neither is acceptable.

**Corollary for siblings.** `L0-keep` owns the item ledger and `L0-once` owns the craft flag; neither reads the other as an authority. The one connection between them is §12's invariant — death must not reset the flag — which is expressed here as R-002 and is a *prohibition* on `L0-keep`, not a data dependency.

**Rationale.** Separating "a craft happened" from "a sword exists" is what makes the Creative exemption (R-003) and the anti-dup requirement (C-7) coexist. Conflating them is precisely the mistake CTR-005 documents on the `L0-keep` side.




- **node**: L0-once-r007

### Component Constraints — Verification, Acceptance & Definition of Done (L0-qatg-cons)

# Component Constraints — Verification, Acceptance & Definition of Done

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["constraint"]` · `relates_to: ["L0-qatg-r003", "L0-qatg-r004"]` · `inherits: ["C-1", "C-5", "C-9", "C-10", "C-11", "C-12"]`

Inherited constraints C-1…C-12 bind unchanged. The entries below are the component-specific reading — how each one actually bites here. This component is unusual in that most of C-1…C-12 bite it **directly as gate criteria**, not just as background policy.

## QC-1 — C-10 is the floor this component exists to hold (regression)

Every other sibling's obligations are *additive*; C-10's is *conservative* — nothing may get worse. This component is where that distinction becomes an enforceable rule (`L0-qatg-r003`), not just a stated intent.

## QC-2 — C-11 splits verification into two non-substitutable halves

BDS answers "did it load and run?"; the iPad answers "does it look right?". This component's harness table exists specifically because conflating the two — e.g. assuming a green `bds:check` run means the icon renders correctly — would be a category error, not just an oversight.

## QC-3 — C-1: Beta evidence must never become a runtime claim

The one place in the repository importing a Beta module (`packs/gametest`) is also the one place most tempting to lean on for the two-player gate (`L0-qatg-p003`). `L0-qatg-r004` exists to keep that dev-only convenience from ever showing up as a shipped-pack dependency.

## QC-4 — C-5: the gate must mean something under dedicated multiplayer, not just locally

Evidence collected against a single-player world satisfies none of the multiplayer-tagged rows (`L0-qatg-r002`). The Docker BDS rig, not the single-player world, is this component's test surface wherever §9 is in play — same posture C-5 sets for every sibling.

## QC-5 — C-9: this component introduces no new user-facing literals

The Acceptance Matrix and DoD gate are internal/process artifacts with no in-game surface. If a future harness change adds a player-visible message (e.g. a debug HUD), the key must come from `L0-item`'s catalogue (ADR-009) like everywhere else — noted here for completeness, not because it currently applies.

## QC-6 — C-12: verification effort stays inside the estimated envelope

§15's 4–10h estimate for "a properly tested standalone module" already prices in the harness this component maps to (`bds:check`, `bds:gametest`) as a precondition, not an added cost. A gate design that requires building new infrastructure beyond what's listed in the harness table would silently blow this budget — which is why `L0-qatg`'s architecture decisions (`adr1`–`adr3`) all reuse existing mechanisms rather than adding new ones.




- **node**: L0-qatg-cons

### Rule Q-R1 — Every acceptance test has exactly one owner and at least one harness mechanism (L0-qatg-r001)

# Rule Q-R1 — Every acceptance test has exactly one owner and at least one harness mechanism

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["rule"]` · `relates_to: ["L0-qatg-ent1", "L0-qatg-ent2", "L0-qatg-p001"]` · `spec: ["§13"]`

**Rule.** Each of the twelve §13 tests must appear in the Acceptance Matrix (`L0-qatg-ent2`) with exactly one owning L1 component and at least one concrete harness mechanism producing its evidence. A test with zero owners, more than one owner, or zero harness mechanisms is a gap, not a pass.

**Source.** Decomposition plan: *"`L0-qatg` does not invent criteria... If it finds a §13 test with no owner, that is a gap to report upward, not to absorb."*

**Rationale.** Aggregation without this rule degenerates into either silent gaps (a test nobody actually verifies) or duplicated, drifting criteria (two siblings each half-cover the same test differently). Both defeat the point of a single release gate.

**Scope.** All twelve §13 bullets. Does not apply to the five §14 DoD conditions, which this component owns directly (`L0-qatg-ac01`..`ac06`).

**Testable as.** `L0-qatg-p001` (matrix build), `L0-qatg-ac06`.

**Violation looks like.** A matrix row with an empty owner column, or two components' `concept-acceptance-criterion` artifacts both claiming the same §13 bullet with different pass conditions.




- **node**: L0-qatg-r001

### Rule Q-R2 — Partial coverage is amber, not green (L0-qatg-r002)

# Rule Q-R2 — Partial coverage is amber, not green

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["rule"]` · `relates_to: ["L0-qatg-ac02", "L0-qatg-ent3"]` · `spec: ["§14", "§9"]`

**Rule.** The Definition-of-Done gate may report PASS only when all twelve §13 tests are green in a single-player world **and** the §14 "минимум в тесте с двумя игроками" requirement has produced evidence for every test where §9's multiplayer-determinism claim applies (AT-12 at minimum). Single-player-only coverage is reported as amber/blocked, never rounded up to green.

**Source.** §14: *«Все acceptance tests выше проходят в одиночном мире и минимум в тесте с двумя игроками.»*

**Rationale.** §14 conjoins the two conditions with "и" (and), not "or". A gate that treats single-player-green as sufficient silently drops the multiplayer half of the Definition of Done — exactly the failure C-5 and C-11 exist to catch.

**Scope.** The DoD gate as a whole; does not require every one of the twelve tests to be individually re-run two-player, only that the tests where multiplayer determinism is claimed (§9, boundary table WS-17) have multiplayer evidence.

**Testable as.** `L0-qatg-ac02`.

**Violation looks like.** A release note that says "all tests pass" backed only by `npm test` and single-player `bds:gametest` runs, with no two-client or two-simulated-player evidence anywhere.




- **node**: L0-qatg-r002

### Rule Q-R3 — Shipped-platform regression blocks the gate unconditionally (L0-qatg-r003)

# Rule Q-R3 — Shipped-platform regression blocks the gate unconditionally

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["rule"]` · `relates_to: ["L0-qatg-p002"]` · `governed_by: ["C-10"]`

**Rule.** If any of the 7 existing `npm test` suites (`autosmelt`, `gametest-pack`, `item`, `manifests`, `pickaxe`, `selftest-pack`, `validate`), `bds:check`, or `bds:gametest` regresses, the Web Sword release gate reports BLOCKED regardless of how many of the twelve Web Sword tests pass.

**Source.** C-10: *"Stages 0 and 1 are shipped at v0.2.1... `andrew:miners_pickaxe`... and the 7 existing test suites must continue to pass."*

**Rationale.** The Web Sword is additive to a shipped product (`L0` overview: *"lands in this codebase, not beside it"*). A gate that only checks new-feature tests would let a Web Sword change silently break the pickaxe — the one outcome C-10 rules out absolutely.

**Scope.** All 7 files under `tests/`, plus the `packs/selftest` and `packs/gametest` suites as they existed at v0.2.1. New suites added for the Web Sword are additive and evaluated separately (`L0-qatg-r001`).

**Testable as.** `L0-qatg-p002`.

**Violation looks like.** A merged Web Sword change accompanied by a green Web Sword AT report and a red or skipped `pickaxe.test.mjs`.




- **node**: L0-qatg-r003

### Rule Q-R4 — Beta evidence never becomes a runtime requirement (L0-qatg-r004)

# Rule Q-R4 — Beta evidence never becomes a runtime requirement

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["rule"]` · `relates_to: ["L0-qatg-ac04"]` · `governed_by: ["C-1"]`

**Rule.** No row of the Acceptance Matrix may cite a Preview/Experiments-gated capability as the verification mechanism for a **shipped** (`packs/behavior` / `packs/resource`) claim. `bds:gametest`'s Beta `@minecraft/server-gametest` dependency is a dev-only evidence-production tool; the fact that a test *runs* under Beta APIs must never be read as the *product* requiring them.

**Source.** §14: *«Нет обязательной зависимости от Experiments/Preview.»* · C-1.

**Rationale.** `packs/gametest` deliberately lives outside the product and runs against its own throwaway world specifically so this distinction holds (see `src/gametest/main.ts` header comment). The rule exists to stop that separation eroding under gate pressure — e.g., "just enable Beta APIs on the real world to make the two-player test easier."

**Scope.** `packs/behavior`, `packs/resource`, and their manifests only. Does not restrict `packs/gametest`/`packs/selftest` themselves, which are already dev-only by design.

**Testable as.** `L0-qatg-ac04`, `manifests.test.mjs` (existing suite, C-10).

**Violation looks like.** A manifest dependency entry for the Beta module inside `packs/behavior/manifest.json`, or release notes instructing a tester to enable Experiments on their own world to see a Web Sword feature.




- **node**: L0-qatg-r004

### Rule Q-R5 — Dup-safety evidence covers four vectors, not three (L0-qatg-r005)

# Rule Q-R5 — Dup-safety evidence covers four vectors, not three

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["rule"]` · `relates_to: ["L0-qatg-ac03", "L0-qatg-ctr1"]` · `governed_by: ["C-7"]`

**Rule.** Before the DoD's "no known dup paths" condition may be marked satisfied, the Acceptance Matrix must show evidence for **all four** duplication vectors — craft, death, disconnect/reconnect, and server restart — even though §14's own DoD sentence names only three (craft, death, reconnect).

**Source.** §4: *«...смерти, disconnect/reconnect и рестарте»* · §12 (craft-flag restart survival) · C-7 (parent rollup, four-vector reading). See `L0-qatg-ctr1` for the textual gap this rule closes.

**Rationale.** §14's prose is narrower than the invariant it is supposed to gate (C-7). A literal reading of §14 would let a restart-dup regression pass the DoD sentence while still breaching C-7. This component owns the gate wording and chooses the stricter, C-7-consistent reading rather than propagating the narrower one.

**Scope.** AT-4 (craft-flag restart persistence) and AT-11 (death retention, no dup) jointly; also binds any future restart-dup scenario `L0-keep`'s ledger work adds (`L0-keep-adrk1`).

**Testable as.** `L0-qatg-ac03`.

**Violation looks like.** A DoD sign-off citing only a craft/death/reconnect dup-cycle test, with no restart-cycle test in the evidence trail, even though the craft-flag restart test (AT-4) happened to pass for unrelated reasons.




- **node**: L0-qatg-r005

### Component Constraints — Active Ability (L0-trap-cons)

# Component Constraints — Active Ability

**Links** — `part_of: ["L0-trap"]` · `is_a: ["constraint"]` · `relates_to: ["L0"]` · `see_also: ["webswordspecv1ruen-part-2"]`

Component-scoped NFRs. These **refine** C-1…C-12, they do not replace them; C-1…C-12 are inherited unchanged (decomposition plan, reduce pass 4).

## TC-1 — Zero recurring work

The component registers **no** tick handler, no interval, no scheduled callback. All logic hangs off the item-use event. This is stricter than C-4 (which only forbids a *global* per-tick scan) and is adopted deliberately: the add-on's single permitted recurring tick is `L0-cool`'s actionbar writer, and spending it here would leave none.

## TC-2 — Bounded, single-tick execution

One activation performs at most: 1 raycast, 27 block reads, 27 block writes. No unbounded loop, no search, no retry. The whole pipeline completes inside one synchronous handler invocation (ADR-015) — this is also what makes §9's independent concurrent handling free.

## TC-3 — No inter-activation state

The component holds no mutable module-level state between invocations. Every input is re-read from the player or the world. Consequence: N concurrent activations cannot interfere, and a server restart leaves nothing to restore (C-5).

## TC-4 — Observer-independent results

Every computed value must derive from server-read state only. Forbidden inputs: client-supplied coordinates, client-reported hit results, anything keyed to a rendering context (C-3). Test: replaying the same activation from the same player state must yield the same 27 verdicts.

## TC-5 — Deny-by-default is not tunable downward without evidence

The classifier's `unknown ⇒ skip` branch may only be narrowed on **positive evidence** that a block class is safe, never on the grounds that the trap feels weak (C-8, ASM-007). Rationale: destroyed storage is unrecoverable; a weak trap is a tuning bug. Any narrowing lands with its own GameTest.

## TC-6 — No writes outside the loaded region

A cell that cannot be read is not written. No chunk may be force-loaded, ticket-pinned or otherwise coerced to satisfy an activation at the edge of the loaded area (§6, §12, R-007).

## TC-7 — Stable surface only for raycast and block mutation

Raycasting, entity intersection and block get/set must all be available on `@minecraft/server` 2.10.0. If any is Beta-only, **escalate to L0** rather than adopting the Beta channel: per C-1 the mechanic changes, not the channel. A documented degraded fallback (e.g. cube centred on the block directly in front of the player) is preferable to a Preview dependency.

## TC-8 — Silent failure

A failed activation produces no chat message, no sound cue beyond vanilla, and no state change (§5 specifies only *«способность не срабатывает»*). If the owner later asks for feedback on failure, it arrives as a translate key from `L0-item` (C-9, ADR-009) — this component must not introduce a literal string in the meantime.




- **node**: L0-trap-cons

### R-001 — The ability fires on Use and only on Use (L0-trap-r001)

# R-001 — The ability fires on Use and only on Use

**Links** — `part_of: ["L0-trap"]` · `is_a: ["rule"]` · `relates_to: ["L0-trap-pact", "L0-trap-ac05"]`

**Rule.** The ability is triggered exclusively by standard item use on a held `andrew:web_sword` — right click on desktop, long press on touch. A melee attack with the same sword triggers nothing: no target resolution, no cobweb, no cooldown.

**Source.** §5: *«Активация: стандартное использование предмета (Use / right click / long press, в зависимости от платформы).»* · §7: *«Обычный удар не создаёт паутину и не запускает cooldown.»*

**Rationale.** The two clauses are only jointly satisfiable if the engine raises distinct events for attack and use (ASM-006). If it does not, §7 is violated on every swing and the weapon becomes unusable in melee — which is the whole point of a sword. This is the cheapest assumption in the component to falsify, and the most expensive to discover late.

**Applies to.** The event registration itself — the handler must subscribe to the use surface only, and must filter on item type before doing any work.

**Violation looks like.** Cobweb appearing when the player swings at a mob; cooldown burning down with no trap placed; the player encasing themself mid-fight.

**Verified by.** `L0-trap-ac05` (§13: *«Обычный melee-урон … не создаёт паутину»*).




- **node**: L0-trap-r001

### R-002 — Targeting is bounded by ordinary survival reach; no artificial long ray (L0-trap-r002)

# R-002 — Targeting is bounded by ordinary survival reach; no artificial long ray

**Links** — `part_of: ["L0-trap"]` · `is_a: ["rule"]` · `relates_to: ["L0-trap-ptgt", "L0-trap-as17", "L0-trap-ac02"]`

**Rule.** The target must lie within normal survival interaction/melee reach of the activating player. A candidate beyond that distance is not a target — the activation fails. No extended, boosted or custom-range ray may be used to reach further.

**Source.** §5: *«Дальность: обычная survival interaction/melee reach — без искусственного дальнего луча.»* · §5: *«Если корректной цели нет или цель вне допустимой дистанции, способность не срабатывает.»* · §12: *«Цель за пределами reach: ничего не происходит, cooldown не тратится.»* The L0 boundary lists "artificial long-range targeting" as **excluded by decision**.

**Rationale.** Reach is the weapon's balance lever. An unbounded ray turns a close-quarters trap into a sniping tool and changes PvP entirely — which is why the spec states the prohibition twice and the boundary restates it a third time.

**Applies to.** The ray length passed to the raycast, and the final bound-check on the resolved point (`L0-trap-ptgt` steps 1 and 6). Both must use the same single named constant (ASM-017), so one owner answer retunes the whole component.

**Edge.** Creative mode reach differs from survival reach in vanilla. Which one applies to a Creative-mode holder is unspecified — recorded in ASM-017; defaulting to the survival value for all game modes is the conservative choice.

**Verified by.** `L0-trap-ac02` (§13: *«Use вне reach ничего не создаёт и не запускает cooldown»*).




- **node**: L0-trap-r002

### R-003 — The ray stops at the first solid block; never target through a wall (L0-trap-r003)

# R-003 — The ray stops at the first solid block; never target through a wall

**Links** — `part_of: ["L0-trap"]` · `is_a: ["rule"]` · `relates_to: ["L0-trap-ptgt", "L0-trap-ac06"]`

**Rule.** When the view ray meets a solid block, resolution ends there. The **actually reachable** point at that block becomes the target. The ability never resolves a target on the far side of an obstruction, even when that far side is within the reach distance.

**Source.** §12: *«Луч упирается в ближайший доступный блок: использовать фактически доступную целевую точку; не атаковать сквозь стены.»*

**Rationale.** Without this, a player standing behind cover could trap an opponent they cannot see or be hit by — a line-of-sight exploit rather than a melee-range ability. The spec phrases it as a positive instruction (*use the reachable point*) and a prohibition (*do not attack through walls*); both halves matter, because "stop at the wall" must not degrade into "fail at the wall".

**Applies to.** `L0-trap-ptgt` step 2. Hitting a wall is **not** a failure path — it is the normal way a target resolves. The cube then forms at the wall, and the wall's own cells are skipped or filled according to R-006, not according to how the target was found.

**Interaction with R-006.** A cube centred on a wall face will have many cells inside solid ordinary stone. Those are replaceable and get filled — that is intended, and is what makes the trap work against someone hugging cover.

**Verified by.** `L0-trap-ac06`.




- **node**: L0-trap-r003

### R-004 — Failure is free; the cooldown is a cost of success only (L0-trap-r004)

# R-004 — Failure is free; the cooldown is a cost of success only

**Links** — `part_of: ["L0-trap"]` · `is_a: ["rule"]` · `relates_to: ["L0-cool", "L0-trap-pact", "L0-trap-ac02", "L0-trap-ct07"]`

**Rule.** A failed activation must leave the world and the player bit-identical to the moment before it: no block written, no cooldown started, no timer extended, no state recorded. The player may retry immediately. The 30-second cooldown begins **only** after a successful placement.

The forced ordering (ADR-006) is therefore:

> **validate reach → check cooldown → place cells → start cooldown**

**Source.** §5: *«Если корректной цели нет или цель вне допустимой дистанции, способность не срабатывает и cooldown не запускается.»* · §8: *«ровно 30 секунд после успешного создания ловушки»* · §12: *«Цель за пределами reach: ничего не происходит, cooldown не тратится.»* · L0 boundary: *"Reach is the boundary of the ability, and failing it is free… The cooldown is a cost of success only."*

**Rationale.** Any other ordering punishes a mis-aimed click with 30 seconds of disarmament. The spec states the rule three times in three sections, which is how strongly it is held.

**Consequence for ownership.** This component owns the **success predicate**; `L0-cool` owns the timer. The predicate's evaluation must complete before `L0-cool` is told anything. The cooldown *read* in step 2 is non-mutating — see CTR-007 for the ownership seam it crosses.

**Open.** What counts as "success" when the plan permits **zero** cells is not settled — **CTR-008**. Do not encode an answer without the owner's ruling.

**Verified by.** `L0-trap-ac02`, `L0-trap-ac08`.




- **node**: L0-trap-r004

### R-005 — Real vanilla cobweb, permanent, and a partial cube is a success (L0-trap-r005)

# R-005 — Real vanilla cobweb, permanent, and a partial cube is a success

**Links** — `part_of: ["L0-trap"]` · `is_a: ["rule"]` · `relates_to: ["L0-trap-pfil", "L0-trap-ecub", "L0-trap-ac01", "L0-trap-ac03"]`

**Rule (three parts).**

1. The blocks placed are **ordinary vanilla `minecraft:web`** — not a custom block, not a variant, not tagged or marked in any way. They behave for every player and mob under normal Minecraft rules.
2. They are **permanent world state**. No expiry timer, no despawn, no ownership. They remain until players clear them by normal means.
3. A cube in which some cells were skipped is a **success**, not a failure. The remaining valid cells are filled anyway and the cooldown is consumed.

**Source.** §5: *«Созданная паутина является настоящими обычными cobweb blocks и остаётся в мире, пока игроки не уберут её обычным способом.»* · §6: *«Если часть куба защищена, пропустить только эти клетки; остальные допустимые клетки всё равно заполнить паутиной.»* · §9: *«Паутина после создания является общей частью мира и взаимодействует со всеми игроками/мобами по обычным правилам Minecraft.»* · §12: *«Игрок выходит сразу после активации: уже созданная паутина остаётся.»* · L0 boundary: "Cobweb cleanup / expiry" is **excluded by decision**.

**Rationale.** Using real cobweb is what makes the trap interact correctly with mobs, projectiles, shears and everything else without the component reimplementing any of it. Permanence is a balance choice the owner made by omission — adding a timer would change the weapon.

**Why the partial-cube clause lives here.** The all-or-nothing reading is the most natural misreading of §6 and it inverts the weapon's behaviour in exactly the situations it matters most (near buildings, near bedrock). §13 test 10 exists to catch it.

**Non-goal.** No cleanup command, no owner attribution, no "my cobweb vs yours" distinction. Once placed, the component has no further relationship with the blocks.

**Verified by.** `L0-trap-ac01`, `L0-trap-ac03`, `L0-trap-ac07`.




- **node**: L0-trap-r005

### R-006 — Deny by default: a cell whose safety is not established is skipped (L0-trap-r006)

# R-006 — Deny by default: a cell whose safety is not established is skipped

**Links** — `part_of: ["L0-trap"]` · `is_a: ["rule"]` · `relates_to: ["L0-trap-pfil", "L0-trap-ecel", "L0-trap-ad13", "L0-trap-ac03"]`

**Rule.** Each of the 27 cells is classified independently. A cell is filled **only** if it is positively identified as an ordinary replaceable block. Everything else is skipped, including anything the classifier does not recognise. Specifically skipped:

- cells occupied by an **entity** — entities are never removed or replaced;
- cells carrying a **block entity** — chests, barrels, shulker boxes, hoppers, furnaces, brewing stands, signs, spawners and similar containers/functional blocks with contents or data;
- **indestructible or explicitly protected** blocks — bedrock, barrier, command block, end portal frame and the like;
- cells that cannot be read (see R-007);
- **anything else not positively classified as ordinary and replaceable.**

**Source.** §6: *«Не удалять и не заменять сущности. Не заменять контейнеры и функциональные блоки с важным содержимым/данными (например, сундуки и аналогичные block entities). Не заменять bedrock и другие явно защищённые/неразрушаемые специальные блоки.»* · C-8.

**Rationale, and why the default is deny.** §6 names only *examples* — the list is open (ASM-007, Q-013). The two failure directions are not symmetric: too permissive destroys player storage **irrecoverably**, too restrictive yields a weaker trap, which is a tuning bug fixed in one line. So the unknown branch resolves to `skip`, and the list is narrowed only on positive evidence (TC-5).

**Applies to.** `L0-trap-pfil` phase A, and to any future change to the block classifier.

**Open.** The closed deny-list is **Q-013**, refined in `L0-trap__concept-client-question` with a concrete proposal. Do not treat the list above as final.

**Verified by.** `L0-trap-ac03` (§13: *«Контейнер/bedrock внутри объёма не уничтожается; допустимые соседние клетки заполняются»*).




- **node**: L0-trap-r006

### R-007 — Never write outside the loaded/accessible area (L0-trap-r007)

# R-007 — Never write outside the loaded/accessible area

**Links** — `part_of: ["L0-trap"]` · `is_a: ["rule"]` · `relates_to: ["L0-trap-pfil", "L0-trap-as20", "L0-trap-ac04"]`

**Rule.** A cell that lies in an unloaded or otherwise inaccessible chunk is skipped exactly like a protected cell. The component must not force-load, ticket-pin or otherwise coerce a chunk into existence to complete a cube, and must not attempt a speculative write and swallow the error.

**Source.** §6: *«Не пытаться создавать паутину вне загруженной/доступной области.»* · §12: *«Игрок активирует способность у края загруженной области: не форсировать опасную запись в незагруженные чанки.»* · L0 boundary: *"Chunk loading is a hard edge, not a best effort."*

**Rationale.** The spec calls the write *«опасная»* — dangerous — which is unusually strong language for a block placement. Forcing a load at the edge of the simulation distance risks corrupt or ghost state that outlives the activation, and it is the one failure here that can damage the world rather than merely annoy a player.

**Applies to.** `L0-trap-pfil` phase A, ladder rung 1 — the **first** check, before any other classification, so an unreadable cell costs one probe and nothing more.

**Method.** How "loaded and accessible" is probed on the stable surface is **ASM-020**: the working assumption is that a block read on an unloaded cell either returns undefined or throws, and either outcome is treated as `skip`. The probe must not itself be the thing that causes a load.

**Consequence.** A player activating at the render edge gets a clipped cube. That is correct behaviour, not a bug, and it is indistinguishable at the API level from a cube clipped by bedrock.

**Verified by.** `L0-trap-ac04`.




- **node**: L0-trap-r007

### R-008 — Server-authoritative and observer-independent (L0-trap-r008)

# R-008 — Server-authoritative and observer-independent

**Links** — `part_of: ["L0-trap"]` · `is_a: ["rule"]` · `relates_to: ["L0-trap-ptgt", "L0-trap-ad15", "L0-trap-ac09", "L0-once"]`

**Rule.** Targeting and placement are computed by server logic from server-read state. No client-supplied coordinate, hit result or target identifier may be trusted, and no computed value may depend on who is observing. Two clients watching the same activation see the same 27 cells resolve identically. Concurrent activations by different players are each handled independently.

**Source.** §9: *«Способность должна вычисляться серверной логикой, чтобы все игроки видели одинаковый результат.»* · §9: *«При одновременной активации несколькими игроками каждый успешный вызов обрабатывается независимо.»* · §11: *«Targeting и размещение 3×3×3 должны выполняться серверно.»* · C-3, C-5.

**Rationale.** Client prediction in a PvP add-on is a desync generator: the victim sees cobweb the attacker does not, or vice versa. The spec forbids it structurally rather than asking for reconciliation.

**Applies to.**
- `L0-trap-ptgt` — inputs restricted to the activating player's server-side position, view vector, dimension and the world.
- `L0-trap-pfil` — verdicts computed once, before any write, and not re-derived during apply (ADR-015); otherwise the result depends on write order.
- Module structure — no shared mutable state between handler invocations (TC-3), which is what makes independent concurrent handling free rather than something to engineer.

**Overlap note.** §9 also covers the concurrent-**craft** race; that half belongs to `L0-once` and is deliberately not duplicated here (decomposition plan: *"Multiplayer determinism is not a child"*).

**Verified by.** `L0-trap-ac09` (§13: *«Два клиента в multiplayer видят одинаковую паутину и одинаковое состояние мира»*). Test surface is Docker BDS, not the single-player world (C-5) — with the two-client caveat of ASM-010 / Q-012.




- **node**: L0-trap-r008

