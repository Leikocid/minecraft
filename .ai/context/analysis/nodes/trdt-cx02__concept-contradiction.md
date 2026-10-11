---
type: "concept-contradiction"
node_id: "L0-trdt-cx02"
source_channel: "rollout"
analysis_version: 9
level: 2
title: "CX-trdt-02 · The ADRs vs the code: throw order, and a helper that cannot raise thrown hits"
aliases: ["L0-trdt-cx02"]
is_a: ["contradiction"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 1167
tags: ["above-water-trident","status:resolved","source-vs-code","target:L0-adr-twth","resolved"]
closed_at: 2026-10-11
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-trdt-cx02
---

---
title: "CX-trdt-02 · The ADRs vs the code: throw order, and a helper that cannot raise thrown hits"
aliases: ["L0-trdt-cx02"]
is_a: ["contradiction"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt", "L0-strm", "L0-adr-twth", "L0-adr-twlt", "L0-trdt-adcl", "L0-trdt-addm"]
target_node: "L0-adr-twth"
status: resolved
---
# CX-trdt-02 · The ADRs vs the code: throw order, and a helper that cannot raise thrown hits

**Status: resolved at the v9 reduce.** Both L0 ADRs were amended in place.

1. **Throw order.** `L0-adr-twth` §2 said "hand first, then ledger", which contradicted its own consequence line. **Amended:** the order is now record → clear hand → spawn → store id, in one sync block, keyed by `throwId`, matching `L0-trdt-adcl`.
2. **Shared helper.** `L0-adr-twlt` §2 said the thrown hit is "raised the same way". As read during reduce at v9, `raiseHit` in `src/storm/damage.ts:338` exits for any cause other than `entityAttack`. **Amended:** `raiseHit` gains an opt-in `causes` argument whose default keeps the Storm Blade unchanged. If probe P10 fails, the scripted `entityAttack` fallback is used (`L0-trdt-addm` §3). The `strm` scenarios gate the merge.
