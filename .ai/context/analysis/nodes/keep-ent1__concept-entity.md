---
type: "concept-entity"
node_id: "L0-keep-ent1"
source_channel: "rollout"
title: "Entity — Retention Ledger Entry"
aliases: ["L0-keep-ent1"]
part_of: ["L0-keep"]
is_a: ["entity"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2856
tags: ["entity","ledger","state","durable","L0-keep"]
---

# Entity — Retention Ledger Entry

**Links** — `part_of: ["L0-keep"]` · `is_a: ["entity"]` · `relates_to: ["L0-keep-ent2", "L0-keep-r002", "L0-keep-p001", "L0-keep-p002", "L0-keep-p003"]` · `governed_by: ["C-6", "C-7"]`

The single piece of durable state this component owns. One entry per bonded owner. It is simultaneously the retention record **and** the idempotency token that makes the retain→restore pair safe to replay (`L0-keep-r002`).

## Attributes

| Attribute | Type | Meaning |
|---|---|---|
| `owner_id` | stable player identifier | Key. The player the sword returns to. Must be the identity that survives reconnect, not a display name (ASM-014). |
| `state` | `pending` \| `redeemed` | `pending` = the sword was withheld from a death drop and is owed back. `redeemed` = it has been returned. |
| `instance_ref` | provenance marker value (`L0-keep-ent2`) | Which sword instance is owed. **Conditional on Q-006.** |
| `retained_at` | tick / timestamp | Diagnostic; lets an operator see a stuck entry. |

## Lifecycle

```
(absent) --death, sword withheld--> pending --restore granted--> redeemed
                                      ^                              |
                                      +------ next death ------------+
```

- Only a `pending` entry may be redeemed. Redemption flips the state in the same operation that grants the item.
- A second respawn/join event finds `redeemed` and does nothing. This is the whole anti-dup mechanism.
- A new death re-arms the entry to `pending`. Entries are reused, not accumulated.

## Storage

World-scoped durable state on the stable `@minecraft/server` surface — the same class of storage ADR-005 chose for the craft flag, for the same reasons (C-6: must survive logout, world save and restart; C-1: stable API only).

**World-scoped, keyed by player** rather than stored on the player object, deliberately: a player-scoped property is not readable while that player is offline, and the reconnect-reconciliation path (`L0-keep-p003`) must be able to observe a `pending` entry belonging to a player who is not currently connected. It also means the ledger travels with the world, matching the craft flag's semantics.

## Invariants

1. At most one entry per `owner_id`. The ledger is a map, not a log.
2. A `pending` entry implies **zero** instances of that bonded sword exist in the world. The item is in the ledger *or* in an inventory, never both — this is the conservation law the whole component defends (`L0-keep-r002`).
3. The ledger is never read or written by `L0-once`, and never reads or writes the craft flag (`L0-keep-r004`).

## Boundary note

The ledger records **owed swords**, not swords in existence. It is not a census and must never be used as one — deriving anything by scanning the world for Web Swords is forbidden by C-4 and explicitly rejected in ADR-005.
