---
type: "concept-process"
node_id: "L0-once-pexm"
source_channel: "rollout"
title: "Process — Creative and `/give` exemption"
aliases: ["L0-once-pexm"]
part_of: ["L0-once"]
is_a: ["process"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2688
tags: ["process","creative","give","exemption","admin","L0-once"]
---

# Process — Creative and `/give` exemption

**Links** — `part_of: ["L0-once"]` · `is_a: ["process"]` · `relates_to: ["L0-once-r003", "L0-once-gadm", "L0-keep"]` · `source: §3, §4`

**Governing requirement.** §3: *«Creative и /give предназначены для тестирования/администрирования и НЕ расходуют право на единственный survival-крафт.»* §4: *«Creative/test copies могут существовать у администратора; one-per-world относится к survival crafting, а не к количеству dev/test copies.»*

**Trigger.** Either (a) a player completes a craft of `andrew:web_sword` while in Creative mode, or (b) an operator runs `/give … andrew:web_sword`.

## Steps

1. **Recognise the path as exempt** — for (a) by reading the crafting player's game mode at craft time; for (b) by the absence of any craft event at all.
2. **Do nothing.** No flag read that influences behaviour, no flag write, no announcement, no result removal.

That is the entire process. Its value is in what it *forbids*, not in what it does.

## Invariants this path must not break

- **The flag is neither set nor cleared.** A Creative craft before the first survival craft must leave the world's budget fully available; a Creative craft after it must not clear the gate.
- **No announcement.** The reveal (§3) belongs to the survival craft alone. Announcing an admin copy would falsely tell the server the budget is spent.
- **No cap on admin copies.** §4 permits an unbounded number. Any implementation that counts Web Swords in the world to enforce the gate breaks this rule and is forbidden by R-007.

## `/give` is a non-event, by design

`/give` produces an item with no craft signal, so the gate has no hook and needs none. This is the correct outcome, but it means the gate **cannot distinguish an admin-spawned sword from a survival-crafted one after the fact** — the two instances are identical. That limitation is what makes CTR-005 (owned by `L0-keep`) a real conflict. This component notes the boundary and does not resolve it: if the owner mandates a provenance marker, the natural place to *write* it is step 5 of `L0-once-pcft`, but the marker itself and the ledger reading it belong to `L0-keep`.

## Edge case — game modes that are neither Survival nor Creative

Adventure-mode players can craft at a crafting table. The spec never says whether an Adventure craft spends the budget. Recorded as ASM-013 and raised in `L0-once__concept-client-question`; the assumed default is **non-Creative crafting spends the budget** (Adventure is a play mode, not an admin mode).

## Verification

`L0-once-accp4` (Creative craft and `/give` leave the flag untouched, and the subsequent survival craft still succeeds and announces).
