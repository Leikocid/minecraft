---
type: "concept-assumption"
node_id: "L0-qatg-asm2"
source_channel: "rollout"
title: "ASM-Q2 — The static npm test suite cannot catch a duplication regression"
aliases: ["L0-qatg-asm2"]
part_of: ["L0-qatg"]
is_a: ["assumption"]
relates_to: ["L0-qatg-ac03", "L0-qatg-r005"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1364
tags: ["assumption","dup-safety","test-harness","L0-qatg"]
---

# ASM-Q2 — The static npm test suite cannot catch a duplication regression

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["assumption"]` · `relates_to: ["L0-qatg-ac03", "L0-qatg-r005"]`

**Assumed.** `npm test`'s 7 suites (build output, manifests, static item/recipe shape) exercise no live engine state and therefore cannot detect a duplication bug — dup-safety evidence must come exclusively from `bds:gametest`'s live death/respawn/restart cycling, never from the fast static suite.

**Basis.** Read directly off `tests/`'s file list (`autosmelt`, `gametest-pack`, `item`, `manifests`, `pickaxe`, `selftest-pack`, `validate`.test.mjs) — none instantiate a world or a player. This differs from the pickaxe, which carried no dup risk, so this blind spot never mattered for C-10's existing suites.

**Impact if wrong (i.e., if some static check does catch it).** Low-risk direction — a static check that happens to catch a dup bug is a welcome bonus, not a problem. The real risk is the reverse: treating a green `npm test` run as any evidence at all for `L0-qatg-ac03`, which it is not.

**How to falsify cheaply.** Not falsifiable by inspection alone once written — the corrective action is procedural: `L0-qatg-r005`/`L0-qatg-p002` already exclude `npm test` from the dup-safety evidence chain, so no code change is implied, only gate discipline.
