---
type: "concept-rule"
node_id: "L0-qatg-r005"
source_channel: "rollout"
title: "Rule Q-R5 — Dup-safety evidence covers four vectors, not three"
aliases: ["L0-qatg-r005"]
part_of: ["L0-qatg"]
is_a: ["rule"]
relates_to: ["L0-qatg-ac03", "L0-qatg-ctr1"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1508
tags: ["rule","invariant","dup-safety","L0-qatg"]
---

# Rule Q-R5 — Dup-safety evidence covers four vectors, not three

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["rule"]` · `relates_to: ["L0-qatg-ac03", "L0-qatg-ctr1"]` · `governed_by: ["C-7"]`

**Rule.** Before the DoD's "no known dup paths" condition may be marked satisfied, the Acceptance Matrix must show evidence for **all four** duplication vectors — craft, death, disconnect/reconnect, and server restart — even though §14's own DoD sentence names only three (craft, death, reconnect).

**Source.** §4: *«...смерти, disconnect/reconnect и рестарте»* · §12 (craft-flag restart survival) · C-7 (parent rollup, four-vector reading). See `L0-qatg-ctr1` for the textual gap this rule closes.

**Rationale.** §14's prose is narrower than the invariant it is supposed to gate (C-7). A literal reading of §14 would let a restart-dup regression pass the DoD sentence while still breaching C-7. This component owns the gate wording and chooses the stricter, C-7-consistent reading rather than propagating the narrower one.

**Scope.** AT-4 (craft-flag restart persistence) and AT-11 (death retention, no dup) jointly; also binds any future restart-dup scenario `L0-keep`'s ledger work adds (`L0-keep-adrk1`).

**Testable as.** `L0-qatg-ac03`.

**Violation looks like.** A DoD sign-off citing only a craft/death/reconnect dup-cycle test, with no restart-cycle test in the evidence trail, even though the craft-flag restart test (AT-4) happened to pass for unrelated reasons.
