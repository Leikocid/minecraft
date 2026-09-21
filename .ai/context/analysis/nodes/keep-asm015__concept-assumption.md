---
type: "concept-assumption"
node_id: "L0-keep-asm015"
source_channel: "rollout"
title: "ASM-015 — A per-instance marker can be attached to an item stack and survives normal handling `MUST_ASK`"
aliases: ["L0-keep-asm015"]
part_of: ["L0-keep"]
is_a: ["assumption"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1847
tags: ["assumption","MUST_ASK","provenance","blocked:Q-006","L0-keep"]
---

# ASM-015 — A per-instance marker can be attached to an item stack and survives normal handling `MUST_ASK`

**Links** — `part_of: ["L0-keep"]` · `is_a: ["assumption"]` · `relates_to: ["L0-keep-ent2", "L0-keep-r003"]` · `blocked_by: ["Q-006"]` · `governed_by: ["C-1", "C-6"]`

**Assumed.** The stable `@minecraft/server` surface allows a durable custom attribute on an **item stack** that survives: being dropped and picked up, moving between inventory slots, being stored in and retrieved from a container, and **world save/restart**.

**Basis.** CTR-005's resolution requires instance provenance (`L0-keep-ent2`), and Q-006 asks the owner to permit it. But permission is only half — the capability must also exist on the stable channel. Q-006 settles the *policy*; this assumption settles the *feasibility*, and the two are independent.

**Impact if wrong.** The recommended resolution to CTR-005 becomes unimplementable regardless of the owner's answer. A marker that is lost by any of the listed operations is worse than no marker at all: it silently converts a crafted sword into an admin copy, turning retention off for that player with **no error and no signal** — the owner simply loses the sword on their next death and cannot tell why.

In that case the "no" branch of Q-006 applies by force, and §14's absolute no-dup claim must be relaxed in writing.

**Note on loss asymmetry.** Marker loss fails *safe* with respect to C-7 (an unmarked sword is never retained, so no dup) but fails *badly* with respect to §4. That is the correct direction per `L0-keep-r002`, but it is not acceptable as routine behaviour.

**How to falsify.** Round-trip test on BDS: mark a stack, drop/repick, chest/retrieve, restart the server, assert the marker each time. Do this **before** committing to the ledger design — it is the second gate after ASM-013.
