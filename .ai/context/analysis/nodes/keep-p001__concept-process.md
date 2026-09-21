---
type: "concept-process"
node_id: "L0-keep-p001"
source_channel: "rollout"
title: "Process — Retain on Death"
aliases: ["L0-keep-p001"]
part_of: ["L0-keep"]
is_a: ["process"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2906
tags: ["process","death","retain","L0-keep"]
---

# Process — Retain on Death

**Links** — `part_of: ["L0-keep"]` · `is_a: ["process"]` · `relates_to: ["L0-keep-p002", "L0-keep-ent1", "L0-keep-r001", "L0-keep-r002"]` · `implements: ["WS-9", "K-1"]` · `spec: ["§4", "§12"]`

**Trigger.** The owning player dies while holding or carrying a provenance-marked Web Sword (`L0-keep-ent2`).

**Goal.** The sword does not become a ground drop, and the world gains a durable record that it is owed back.

## Steps

1. **Detect death** on the stable death/drop-path event (ASM-013).
2. **Locate marked instances** in the dying player's inventory. Scan the player's own inventory only — never the world (C-4).
3. **For each marked instance:**
   a. Remove it from the set of items that will be dropped.
   b. Write/arm the ledger entry `owner_id → pending` (`L0-keep-ent1`).
4. **Leave everything else untouched.** All other items follow vanilla death rules (ADR-008 rejects `keepInventory` for exactly this reason).
5. **Do not touch the craft flag** (`L0-keep-r004`, §12).

## Ordering requirement

Step 3b must not be observable as "done" unless 3a is also done, and vice versa. The two failure directions are asymmetric:

- **Item removed, entry not written** → the sword is destroyed. Player loses a one-per-world legendary permanently. Bad, but recoverable by an admin `/give`.
- **Entry written, item not removed** → the sword drops on the ground *and* is owed back. **This is a dup.** C-7 breached.

Therefore, if the two cannot be made atomic, **write the ledger entry only after the removal is confirmed**. Prefer losing the sword to duplicating it. This ordering is `L0-keep-r002` and it is the single most important implementation detail in the component.

## Edge cases

| Case | Behaviour |
|---|---|
| Player dies during ability cooldown | Retain normally. No copy, no craft-flag change (§12, `L0-keep-ac05`). |
| Player dies holding an **unmarked** (admin/`/give`) copy | Not retained. Drops normally. Outside this component (`L0-keep-ent2`). |
| Player dies holding a marked sword **and** an unmarked copy | Only the marked one is retained; the other drops. |
| Player dies with the sword in a container, not on their person | Out of scope — the item was never in the death drop set. No entry. |
| Player dies and disconnects before respawning | Entry stays `pending`. Reconciled on next join (`L0-keep-p003`). |
| Server crashes between removal and entry write | Sword lost, no dup. The safe direction, by the ordering rule above. |
| Player already has a `pending` entry and dies again | Entry is re-armed, not appended. At most one entry per owner (`L0-keep-ent1` invariant 1). This cannot normally happen — a `pending` entry means the player has no sword to lose. |

## Multiplayer note

Two players dying simultaneously each touch their own ledger key. No shared mutable state, so no race (C-5). This process never reads another player's entry.
