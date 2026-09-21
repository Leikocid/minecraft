---
type: "concept-rule"
node_id: "L0-keep-r003"
source_channel: "rollout"
title: "Rule K-R3 — Retention applies only to provenance-marked instances"
aliases: ["L0-keep-r003"]
part_of: ["L0-keep"]
is_a: ["rule"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2015
tags: ["rule","provenance","conditional","blocked:Q-006","L0-keep"]
---

# Rule K-R3 — Retention applies only to provenance-marked instances

**Links** — `part_of: ["L0-keep"]` · `is_a: ["rule"]` · `relates_to: ["L0-keep-ent2", "L0-keep-ac06"]` · `source: ["CTR-005"]` · `blocked_by: ["Q-006"]` · `spec: ["§3", "§4"]`

> **CONDITIONAL — depends on Q-006.** Stated here as the recommended branch; `L0-keep`'s design assumes it.

**Rule.** The no-drop and restore-on-respawn behaviours apply **only** to Web Sword instances carrying the `survival_craft` provenance marker. An unmarked instance — obtained via Creative inventory or `/give` — behaves as an ordinary item: it drops on death, is lootable, and creates no ledger entry.

**Source.** Derived, not quoted. §3 and §4 permit unlimited admin copies (*«Creative/test copies могут существовать у администратора»*) while §4 and §14 forbid duplication absolutely. CTR-005 shows these cannot both hold without instance provenance.

**Rationale.** The restore predicate must answer *"is this **the** owner's sword?"*, not *"is this **a** Web Sword?"*. Without a marker the two questions are indistinguishable, and every implementation either dupes admin copies or strips retention from a legitimately-held one. Restricting retention to the marked instance makes the retained set exactly the set `L0-once` already bounds to one per world — which is what makes §14's absolute claim survivable.

**Consequence.** Admin copies are explicitly *not protected*. An operator testing on a live server will lose a `/give` sword on death. This is intended and should be documented for operators, not patched.

**If Q-006 is answered "no".** This rule is void and the component degrades: retention must be narrowed to some weaker heuristic (e.g. the first Web Sword a player acquires) or dropped, **and** §14's no-dup claim must be relaxed in writing to exclude admin copies. `L0-keep-ac06` changes meaning accordingly. Do not implement a heuristic silently — the relaxation is a spec change and belongs to the owner.

**Testable as.** `L0-keep-ac06`.
