---
type: "concept-component"
node_id: "L0-keep"
source_channel: "rollout"
title: "Death Retention & Anti-Duplication"
aliases: ["L0-keep"]
part_of: ["L0"]
is_a: ["component"]
relates_to: ["L0"]
analysis_version: 2
level: 1
priority: 510
size_chars: 6244
tags: ["component","death-retention","anti-dup","web-sword","L0-keep","blocked:Q-006"]
needs_rebuild_marked_at: 2026-09-21T21:27:45.355Z
---

# Death Retention & Anti-Duplication

**Links** — `title: Death Retention & Anti-Duplication` · `aliases: ["L0-keep", "Death Retention"]` · `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-once", "L0-cool", "L0-item", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]` · `governed_by: ["C-1", "C-5", "C-6", "C-7", "C-10"]` · `implements: ["WS-9", "WS-10"]`

> **STATUS: analysis complete, implementation blocked on Q-006 / CTR-005.** Everything below that depends on telling one Web Sword instance from another is written *conditionally*. Do not build the ledger before the owner answers.

## Responsibility

Own the lifecycle of a Web Sword across **player death** and **session/world discontinuity**, such that the item is neither *lost* nor *multiplied*. Spec §4 and §12.

Two obligations that pull in opposite directions:

- **Retention (WS-9).** The owner's sword must not appear as a death drop, and must be back in the owner's hands after respawn.
- **Anti-duplication (WS-10, C-7).** Death, disconnect/reconnect and server restart must not — alone or in combination — yield a second copy. C-7 states this absolutely: *«Нет известных способов дюпа через смерть или reconnect.»*

Retention is implemented by *removing* an item from the world and *re-granting* it later. Every such pair is a dup primitive if the two halves can ever both run, or run twice. The entire component is therefore an **idempotency problem**, not an inventory problem.

## In scope

| Ref | Obligation | Spec |
|---|---|---|
| K-1 | Web Sword is excluded from the death drop — it never lands on the ground | §4 |
| K-2 | On respawn the same owner receives exactly one instance back | §4 |
| K-3 | The retain→restore pair is idempotent across death, disconnect/reconnect and server restart | §4, §12 |
| K-4 | Death during ability cooldown creates no copy | §12 |
| K-5 | Death never resets the one-per-world craft flag | §12 |
| K-6 | Retention state is durable world-level state, surviving logout/save/restart | §11, C-6 |

## Out of scope — belongs to siblings

- **The craft flag itself** (`L0-once`). K-5 is a *read-only invariant this component must not breach*; the flag's storage and semantics are `L0-once`'s. Per the parent ownership rule, neither child writes the other's state.
- **Cooldown persistence across death** (`L0-cool`). K-4 only forbids *item* duplication during the cooldown window; whether the timer itself survives is Q-009.
- **The item definition and its `.lang` keys** (`L0-item`). If retention emits any player-visible message, the key is consumed from `L0-item`'s catalogue (C-9, ADR-009); this component adds no literal strings.
- **Non-Web-Sword inventory.** Everything else follows vanilla death rules untouched — ADR-008 rejects `keepInventory` precisely to avoid this blast radius.

## Interfaces

**Consumes**
- Death / drop-path event on the stable `@minecraft/server` surface (ASM-013).
- Respawn event for the same player.
- Player join event (for reconnect reconciliation).
- Instance **provenance marker** written at craft time — *pending Q-006*, and written by `L0-once`'s handler (see CTR-009, resolved at L0 by ADR-016).

**Produces**
- A durable **Retention Ledger** entry per bonded owner (`L0-keep-ent1`).
- Exactly one restored `andrew:web_sword` instance per redeemed entry.

**Touches nothing else.** No world blocks, no other players' inventories, no craft flag.

## Core design (ADR-008, refined here)

Intercept the drop rather than change the gamerule. Concretely, the retain and restore halves are separated by a **durable ledger entry that acts as the idempotency token**:

1. **Retain** — on death, remove the bonded sword from the drop set and write a ledger entry `owner → pending`. Writing the entry and removing the item must be observably atomic (`L0-keep-r002`).
2. **Restore** — on respawn *or* on next join if respawn was missed, grant one instance **only if** an entry is `pending`, then flip it to `redeemed` in the same operation. A second event finds nothing pending and is a no-op.

The ledger is what makes restart safety free: an entry written before the crash is still `pending` after it, so a player who died and immediately crashed the server is made whole on next join — exactly once. This is `L0-keep-p003`.

**Why not "give if missing" at respawn** — rejected in ADR-008 and reconfirmed here: it cannot distinguish "died and lost it" from "an admin took it" or "the player is legitimately carrying an admin copy", so it dupes on the third case. The ledger replaces inference with a record.

## The blocking problem (CTR-005 / Q-006)

The restore predicate is *"does this player still have **their** sword?"* The spec permits unlimited Creative/`/give` copies (§3, §4) while specifying **no way to distinguish instances**. Without provenance, retention and anti-dup are not simultaneously satisfiable — see CTR-005's three-way case analysis.

This component's position: **adopt option three** — retention applies only to instances carrying a durable provenance marker set at survival craft. It is the only branch that satisfies §4 and §14 together. It requires a spec addition the owner must approve (Q-006).

Everything downstream is shaped by the answer:
- **Yes (recommended)** → the ledger binds `player → marked instance`, admin copies drop normally on death like any other item, and §14 holds without qualification.
- **No** → retention must be narrowed to "the first Web Sword a player ever acquires" or to nothing at all, and §14's absolute no-dup claim must be relaxed in writing to exclude admin copies. Two acceptance criteria (`L0-keep-ac05`, `L0-keep-ac06`) change meaning.

## Risk profile

§15 names death-retention/anti-dup as one of the three top cost drivers, alongside one-per-world persistence and multiplayer edge cases — and all three are governed by C-6 and C-7. The distinguishing risk here is that **failures are silent and permanent**: a dup path produces a second legendary item that persists in the world indefinitely, cannot be detected after the fact without auditing every inventory, and directly defeats the one-per-world design that `L0-once` exists to enforce. Test the failure modes (`L0-keep-ac03`, `ac04`) before the happy path.
