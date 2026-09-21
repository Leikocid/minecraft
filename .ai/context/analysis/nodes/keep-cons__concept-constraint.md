---
type: "concept-constraint"
node_id: "L0-keep-cons"
source_channel: "rollout"
title: "Component Constraints — Death Retention & Anti-Duplication"
aliases: ["L0-keep-cons"]
part_of: ["L0-keep"]
is_a: ["constraint"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 3393
tags: ["constraint","nfr","L0-keep"]
---

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
