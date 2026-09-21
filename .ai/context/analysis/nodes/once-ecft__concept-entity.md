---
type: "concept-entity"
node_id: "L0-once-ecft"
source_channel: "rollout"
title: "Entity — WorldCraftFlag"
aliases: ["L0-once-ecft"]
part_of: ["L0-once"]
is_a: ["entity"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 3214
tags: ["entity","state","dynamic-property","persistence","L0-once"]
---

# Entity — WorldCraftFlag

**Links** — `part_of: ["L0-once"]` · `is_a: ["entity"]` · `relates_to: ["L0-once-r001", "L0-once-r002", "L0-once-r007", "L0-once-pcft"]` · `source: §3, §11` · `decided_by: ADR-005, ADR-012`

The single piece of durable state owned by this component. It records that the world's one survival craft of `andrew:web_sword` has been spent.

## Storage

A **world-scoped dynamic property** on the stable `@minecraft/server` surface (ADR-005). Not a scoreboard, not a marker entity, not an external file — all three were rejected at L0. Scope is the **world**, which on a dedicated BDS instance is also the server; copying the world copies the spent budget, which matches *«один раз на весь мир/сервер»*.

## Shape

Stored as a JSON string under a namespaced key, **not** as a bare boolean (ADR-012). Proposed key: `andrew:web_sword_craft_gate`.

| Attribute | Type | Required | Meaning |
|---|---|---|---|
| `v` | integer | yes | Record schema version. Starts at `1`. Lets a future weapon-framework migrate without re-opening the gate |
| `crafted` | boolean | yes | The gate itself. `true` = budget spent |
| `crafterName` | string | yes | Display name of the player who crafted it. Used in the first-craft announcement and re-usable in the blocked-craft denial message |
| `crafterId` | string | yes | Stable player identifier. Survives a name change; the name alone does not |
| `at` | number | yes | Epoch-ish timestamp or world tick of the claim. Diagnostic only — lets a log reader reconstruct when the budget was spent |

Absent property ⇒ budget unspent. This is the initial state of every new world and requires no bootstrap write.

## Lifecycle

- **Created** exactly once, in step 4 of `L0-once-pcft`, inside the same synchronous handler that read it.
- **Read** on every craft-completion event for `andrew:web_sword`, and nowhere else.
- **Never updated** after creation. A blocked craft does not touch it.
- **Never deleted** by game logic. There is no in-game reset path — see CTR-006 for why that is a question, not a settled decision.

## Invariants

1. **Write-once.** Any code path that can clear or overwrite `crafted: true` is a C-7 duplication path. (R-001)
2. **Durable across logout, world save and server restart.** Restart survival is an explicit §13 acceptance test. (R-002, C-6)
3. **Unaffected by death.** §12 is explicit: death during cooldown must not reset the flag. `L0-keep` must respect this and may not write here. (R-002)
4. **Sole authority.** No sibling component reads or writes it, and the gate is never derived from any other source such as counting swords in the world. (R-007)
5. **No instance linkage.** The record deliberately does **not** name the crafted item stack. It counts a *craft event*, not a sword. Adding an instance link would pull CTR-005's provenance question into this component, where it does not belong.

## Failure semantics

A failed write must leave the record absent, not partially written — which is why the payload is a single serialized value rather than several independent properties. A torn multi-property write could yield `crafted` set with no `crafterName`, producing a broken announcement and an unattributable gate.
