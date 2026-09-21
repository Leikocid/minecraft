---
type: "concept-assumption"
node_id: "L0-qatg-asm1"
source_channel: "rollout"
title: "ASM-Q1 — Simulated-player GameTest is accepted as primary two-player evidence, pending Q-012"
aliases: ["L0-qatg-asm1"]
part_of: ["L0-qatg"]
is_a: ["assumption"]
relates_to: ["L0-qatg-p003", "L0-qatg-adr2"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1632
tags: ["assumption","multiplayer","MUST_ASK","L0-qatg"]
---

# ASM-Q1 — Simulated-player GameTest is accepted as primary two-player evidence, pending Q-012

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["assumption"]` · `relates_to: ["L0-qatg-p003", "L0-qatg-adr2"]` · `governed_by: ["C-11"]`

**Assumed.** Until the spec owner answers Q-012, this analysis treats `bds:gametest` scenarios driven by two `SimulatedPlayer` instances as sufficient primary evidence for the §14 "≥2-player" requirement on tests whose claim is about **server-side logic** (craft race, placement determinism). A genuine two-client session is treated as best-effort corroboration, required only for AT-12's client-rendering claim, and only if a second device becomes available.

**Basis.** This refines ASM-010/Q-012 with the operational detail Q-012's recommended answer already points at (*"accept the simulated-player GameTest for scripted logic... keep one genuine two-client check for the §13 'both clients see the same cobweb' criterion if any second device can be borrowed"*), which Stage 1's `bds:gametest` already proved feasible.

**Impact if wrong.** If the owner instead requires a genuine second device for every multiplayer-tagged AT, `L0-qatg-p003`'s primary path stops being sufficient evidence and the DoD gate for AT-3, AT-7 and AT-12 cannot close without procuring a second Bedrock-capable device — a hard external dependency this project does not currently have.

**Does not resolve Q-012.** This is implementation-detail refinement per the decomposition plan's rule that children hand questions back rather than self-resolve them; the actual answer remains the spec owner's to give.
