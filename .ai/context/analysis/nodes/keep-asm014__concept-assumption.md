---
type: "concept-assumption"
node_id: "L0-keep-asm014"
source_channel: "rollout"
title: "ASM-014 — A stable player identity survives reconnect and restart"
aliases: ["L0-keep-asm014"]
part_of: ["L0-keep"]
is_a: ["assumption"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1582
tags: ["assumption","identity","L0-keep"]
---

# ASM-014 — A stable player identity survives reconnect and restart

**Links** — `part_of: ["L0-keep"]` · `is_a: ["assumption"]` · `relates_to: ["L0-keep-ent1", "L0-keep-p003", "L0-keep-gloss-owner"]` · `governed_by: ["C-6"]`

**Assumed.** The stable API exposes a player identifier that is constant across disconnect/reconnect **and** across server restart, and that is suitable as a durable ledger key. Display names are explicitly not used.

**Basis.** §4 requires the sword to return *«тому же владельцу»*, and §4/§12 require this to hold across disconnect and restart. That is only meaningful if "the same player" is expressible in durable storage. The spec never says how.

**Impact if wrong.** Severe and bidirectional. If the identity is session-scoped, a reconnecting player reads as a *different* player:
- their `pending` obligation is stranded — the sword is silently destroyed; and
- a fresh entry can be armed for the same person, which is a **dup path** (C-7).

A ledger keyed on an unstable identity fails exactly the scenario `L0-keep-p003` exists to handle, so this is not a peripheral detail.

**Secondary question folded in.** If the identifier is available but *expensive* or only resolvable while the player is online, the reconnect-reconciliation path needs care — it must read a `pending` entry belonging to someone not currently connected (`L0-keep-ent1` storage note).

**How to falsify.** Assert identity equality across a scripted disconnect/reconnect and across a BDS restart. Bundle it with `L0-keep-ac03` / `ac04`, which already exercise both cycles.
