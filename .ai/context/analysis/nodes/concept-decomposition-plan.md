---
type: "concept-decomposition-plan"
node_id: "L0"
source_channel: "rollout"
title: "Decomposition Plan"
aliases: ["L0"]
part_of: ["L0"]
is_a: ["decomposition-plan"]
relates_to: ["L0"]
analysis_version: 2
level: 0
priority: 510
size_chars: 7834
tags: ["plan","decomposition-plan","web-sword","L0"]
needs_rebuild_marked_at: 2026-09-21T21:27:45.355Z
---

# Decomposition Plan

**Links** — `title: Decomposition Plan` · `aliases: ["L0-decomposition-plan", "Decomposition Plan"]` · `part_of: ["L0"]` · `is_a: ["plan"]` · `relates_to: ["L0"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]` · `supersedes: ["L0"]`

## Decomposition strategy: diversity

Volume does not force a split (~7.5 KB unique spec). **Diversity does.** The Web Sword spec bundles four unrelated engineering problems — durable world state, inventory-ownership invariants, server-authoritative world mutation, and timed UI state — each with its own failure mode, its own subset of §13's twelve acceptance tests, and its own file footprint in an existing codebase. The spec itself partitions the risk this way in §15: *«Больше всего времени займут one-per-world persistence, death-retention/anti-dup и multiplayer edge cases.»*

Six children. Each is independently specifiable, independently testable, and owns a disjoint slice of §13.

| id_suffix | label | prompt | model_hint |
|-----------|-------|--------|------------|
| item | Item Definition, Recipe & Localization | component-deep-dive | sonnet |
| once | One-per-World Craft Gate | component-deep-dive | opus |
| keep | Death Retention & Anti-Duplication | component-deep-dive | opus |
| trap | Active Ability — Targeting & Cobweb Placement | component-deep-dive | opus |
| cool | Cooldown & Actionbar UI | component-deep-dive | sonnet |
| qatg | Verification, Acceptance & Definition of Done | component-deep-dive | sonnet |

## Child scopes

**`L0-item` — Item Definition, Recipe & Localization.** Spec §1, §2, §7, §10, §11 (RP half). Owns `andrew:web_sword`: Diamond Sword base and damage parity, infinite durability (no durability component), `minecraft:enchantable` with `slot: "sword"`, Creative Equipment/«Снаряжение» + «Все» + search placement, `/give`, the plus-pattern recipe (4 Cobweb + Diamond Sword), the icon, and — as the single owner — the **RU/EN string catalogue** in `packs/resource/texts/`. Carries ASM-005 / Q-007 as its blocking risk. Files: `packs/behavior/items/`, `packs/behavior/recipes/`, `packs/resource/`.

**`L0-once` — One-per-World Craft Gate.** Spec §3, §9 (craft race), §12 (flag survives death). Owns the persistent world-level flag (ADR-005), survival-only enforcement, the blocked second craft, the localized first-craft broadcast naming the creator, the Creative//`give` exemption, and the concurrent-craft race under C-5. Carries CTR-003 / Q-008 and ASM-011, ASM-012. `opus` because persistence + race safety is named in §15 as a top cost driver.

**`L0-keep` — Death Retention & Anti-Duplication.** Spec §4, §12. Owns the no-drop-on-death path, respawn restoration to the same owner, and idempotency across death / disconnect / reconnect / restart under C-7 (ADR-008). **Blocked on Q-006 / CTR-005** — the provenance question determines the ledger's shape, so this child must surface that before proposing an implementation. `opus`: the highest-severity open contradiction lives here.

**`L0-trap` — Active Ability: Targeting & Cobweb Placement.** Spec §5, §6, §9, §11 (server-side, no per-tick scan), §12 (reach, wall-blocking, chunk edges). Owns activation on item-use, reach-bounded raycast, target resolution for block/entity/nearby-point, the 27-cell cube, and the per-cell safety filter (ADR-006). Carries ASM-006, ASM-007, ASM-008 and Q-011, Q-013. The largest child by requirement count and the one where C-4, C-8 and C-3 all bind at once.

**`L0-cool` — Cooldown & Actionbar UI.** Spec §8, §12 (cooldown across logout). Owns the exact-30 s timer keyed per player + ability, start-on-success-only ordering, the actionbar remaining-time readout, and the seam for the future cross-item framework (ADR-007). Carries CTR-004, Q-009, Q-010, ASM-009. The only child with a per-tick component, which must stay scoped to holders of the sword.

**`L0-qatg` — Verification, Acceptance & Definition of Done.** Spec §13, §14, §15. Owns the twelve acceptance tests as executable criteria, their mapping onto the existing harness (`tests/`, `packs/gametest`, `packs/selftest`, `bds:check`, `bds:gametest`, iPad visual pass), the no-Preview/Experiments gate, and pickaxe regression protection under C-10. Carries ASM-010 / Q-012. Cross-cutting by nature: it consumes criteria from all five siblings and adds none of its own.

## Ownership rules — to prevent scope overlap between children

- **Localization ownership is central, use is distributed.** `L0-item` owns the `.lang` catalogue. `L0-once` (first-craft broadcast) and `L0-cool` (cooldown text) **consume** translate keys from it and must introduce no literal strings (C-9, ADR-009). Each child lists the keys it needs; `L0-item` reconciles them.
- **`L0-once` owns the craft flag; `L0-keep` owns the item ledger.** These are different pieces of state and neither may write the other's. §12's *«смерть … не должна … сбрасывать persistent one-per-world flag»* is the invariant that connects them and belongs to `L0-keep` as a constraint it must respect.
- **Success is decided by `L0-trap`; the cooldown is consumed by `L0-cool`.** The ordering — validate reach → check cooldown → place cells → start cooldown (ADR-006) — spans both. `L0-trap` owns the success predicate; `L0-cool` owns everything after it.
- **Multiplayer determinism (§9) is not a child.** It is constraint C-3/C-5 and applies to `L0-trap` (identical placement) and `L0-once` (craft race) separately. It was deliberately not made its own node — it would own no code and would overlap both.
- **`L0-qatg` does not invent criteria.** It aggregates and makes executable what the other five define. If it finds a §13 test with no owner, that is a gap to report upward, not to absorb.

## Reduce plan

Children roll up into L0 in four passes:

1. **Rules and entities merge upward.** Each child emits `concept-rule` and `concept-entity` artifacts for its slice; L0's domain model is their union. `andrew:web_sword` is the single shared entity — `L0-item` defines it, the others attach state to it (craft flag, ownership marker, cooldown key). Conflicting attribute definitions across children are a signal that the ownership rules above were breached, and must be reconciled at L0, not inside a child.

2. **Acceptance criteria funnel into `L0-qatg`.** The five feature children each map their spec sections onto §13's twelve tests; `L0-qatg` reduces those into one executable matrix and reports any test left unclaimed or claimed twice. L0 adopts that matrix as the project's release gate.

3. **Open questions and contradictions escalate unchanged.** Q-006 (`L0-keep`), Q-008 (`L0-once`), Q-009/Q-010 (`L0-cool`), Q-011/Q-013 (`L0-trap`), Q-007 (`L0-item`), Q-012 (`L0-qatg`) are already routed to their owners. Children must **not** self-resolve them — they refine the question with implementation detail and hand it back. L0 re-aggregates into `concept-client-question` for the owner.

4. **Constraints are inherited, never re-derived.** C-1…C-12 bind every child. A child that believes it must violate one (most likely C-1, stable-API-only, or C-4, no per-tick scan) escalates to L0 rather than deciding locally — per C-1 the mechanic changes, not the channel.

**Expected shape after reduce:** one domain model centred on `andrew:web_sword` with three pieces of durable state (world craft flag, per-instance ownership marker, per-player cooldown), one executable twelve-test acceptance matrix, and an unresolved-question list whose top entry is Q-006.

## Build order (informational — not a pipeline split)

`item` → `once` → `trap` → `cool` → `keep` → `qatg` throughout. `keep` is placed late deliberately: it is blocked on Q-006, and the other children can proceed without it. `qatg` runs continuously rather than last, since the existing harness already gates every commit.
