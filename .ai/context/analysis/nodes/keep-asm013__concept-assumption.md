---
type: "concept-assumption"
node_id: "L0-keep-asm013"
source_channel: "rollout"
title: "ASM-013 — The stable API exposes a usable death-drop interception point `MUST_ASK`"
aliases: ["L0-keep-asm013"]
part_of: ["L0-keep"]
is_a: ["assumption"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1537
tags: ["assumption","MUST_ASK","api","L0-keep"]
---

# ASM-013 — The stable API exposes a usable death-drop interception point `MUST_ASK`

**Links** — `part_of: ["L0-keep"]` · `is_a: ["assumption"]` · `relates_to: ["L0-keep-p001", "L0-keep-r001"]` · `governed_by: ["C-1"]`

**Assumed.** `@minecraft/server` 2.10.0 (stable, no Beta) offers a hook on the death/drop path that lets the add-on prevent a specific item from entering the death drop — or, failing that, remove it from the player's inventory *before* drops are materialised.

**Basis.** ADR-008 decided to *«intercept the drop»* rather than use `keepInventory`, which presupposes such a hook. The spec requires the outcome (§4) but names no mechanism, and this analysis cannot confirm the API surface from the repository.

**Impact if wrong.** This is the load-bearing technical assumption of the whole component. If no pre-drop hook exists on the stable channel, the fallback is *remove-on-death-event then re-grant*, which opens a window in which the item may already have dropped — directly threatening `L0-keep-r001` (no transient drop) and, if the drop is collectable in that window, C-7 itself.

Per **C-1**, the response is **not** to reach for a Beta API. If retention is only expressible via Preview, the mechanic changes and the escalation goes to L0.

**How to falsify cheaply.** A GameTest on Docker BDS: kill a simulated player holding a marked item and assert on the drop set. Minutes of work, and it should be the **first** task when this component is unblocked — the design of `L0-keep-p001` depends on the answer.
