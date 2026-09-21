---
type: "concept-contradiction"
node_id: "L0-qatg-ctr1"
source_channel: "rollout"
title: "CTR-010 — §14's Definition-of-Done sentence names three dup vectors; C-7/§4/§12 name four"
aliases: ["L0-qatg-ctr1"]
part_of: ["L0-qatg"]
is_a: ["contradiction"]
relates_to: ["L0-qatg-r005","L0-qatg-ac03"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2298
tags: ["contradiction","open","source-vs-source","target:L0-qatg","L0-qatg","resolved"]
closed_at: 2026-09-21
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-qatg-ctr1
---

# CTR-010 — §14's Definition-of-Done sentence names three dup vectors; C-7/§4/§12 name four

> **Renumbered at reduce (analysis_version 2).** This was filed as "CTR-007", which `L0-trap` had independently used for a different contradiction. L0 assigned the canonical number **CTR-010**; see `concept-contradiction` at `L0` for the full register.

- **Status:** `open` · **Category:** source-vs-source disagreement · **Target node:** `L0-qatg` (this component owns the gate wording) · **Severity:** Medium
- **Raised by:** `L0-qatg`

## The disagreement

| Where | Statement |
|---|---|
| §14 (DoD) | *«Нет известных способов дюпа через крафт, смерть или reconnect.»* — three vectors |
| §4 | *«...предотвращать появление дополнительной копии при смерти, disconnect/reconnect и рестарте.»* — restart named explicitly |
| C-7 (parent rollup, `concept-constraint`) | Read as constraining `L0-once` and `L0-keep` jointly across the full set the spec names elsewhere: craft, death, disconnect/reconnect and restart |

§14's own DoD checklist is narrower than the invariant §4/§12/C-7 already establish elsewhere in the same document. A gate implementation that follows §14's sentence literally would not require restart-dup evidence to report DoD-satisfied, even though a restart-dup regression would still breach §4/§12/C-7.

## Why this is a real conflict, not a nitpick

The DoD gate is meant to be the **release-blocking summary** of everything else in the spec. If its own wording is narrower than the invariants it's supposed to summarize, the gate can report green in a state that a stricter, equally-textual reading (C-7) calls a failure. This is exactly the "false green" risk named in this component's risk profile.

## Suggested resolution

Adopt the four-vector reading for the gate (`L0-qatg-r005`, `L0-qatg-ac03`) — i.e., treat §14's sentence as elliptical (dropping "and restart" because §12 already covers it two paragraphs earlier) rather than as a deliberate narrowing. This is the reading this component's rules already implement.

**Not escalating as a spec defect requiring the owner's input.** The four-vector reading is already the stricter, safer one and costs nothing to adopt; there is no scenario where following C-7 instead of §14's literal text produces a worse outcome. Recorded here so the gap between the two texts stays visible rather than being silently resolved inside the rule text alone.
