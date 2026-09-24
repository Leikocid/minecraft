---
type: "concept-architecture-decision"
node_id: "L0-sitm-adr2"
source_channel: "rollout"
analysis_version: 1
title: "ADR — No mining capability: omit `minecraft:digger` and all tool tags entirely"
aliases: ["L0-sitm-adr2"]
is_a: ["architecture-decision"]
part_of: ["L0-sitm"]
relates_to: ["L0-sitm"]
priority: 520
size_chars: 1502
tags: ["scythe-of-calamity", "adr", "digger-trap"]
level: 2
---
**Links:** `part_of: ["L0-sitm"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-sitm-rul3", "L0-sitm-gl04"]`

# ADR — No mining capability: omit `minecraft:digger` and all tool tags entirely

**Context.** An earlier interim design pattern used elsewhere in this project for the same underlying tension (Diamond Hoe base item vs. a `Use`-triggered ability) kept the hoe tag/shape while suppressing tilling behavior procedurally in script. That approach still leaves a tool-adjacent tag on the item — exactly the shape of this project's recurring "digger tag trap" (an incompletely matched digger/tag definition digs unmatched blocks at bare-hand speed), already the root cause of two shipped-and-fixed regressions in this codebase (Web Sword cobweb speed, pickaxe block speed).

**Decision.** Omit `minecraft:digger` and every tool tag (`is_hoe`, etc.) from the item definition outright. The item has no mining behavior of any kind, by construction, with no runtime suppression code needed.

**Rejected alternative.** Keep the hoe tag/shape and suppress tilling in script (the earlier interim approach). Rejected because it re-invites the digger-tag trap and requires ability-trigger code to branch on block state to distinguish "cast" from "till," adding script-side complexity for a case a static config exclusion already handles cleanly.

**Consequence.** `Use` can be bound unconditionally as the ability trigger by the sibling that owns activation, with no block-state branching required.
