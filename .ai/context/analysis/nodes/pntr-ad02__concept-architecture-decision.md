---
type: "concept-architecture-decision"
node_id: "L0-pntr-ad02"
source_channel: "rollout"
analysis_version: 3
title: "ADR-pntr-2 · Deterministic seeded band mask for irregularity"
aliases: ["L0-pntr-ad02"]
is_a: ["architecture-decision"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 1127
tags: ["title:ADR-pntr-2 · Deterministic seeded band mask for irregularity", "is_a:architecture-decision", "status:proposed", "relates_to:L0-pntr-r001", "relates_to:L0-pntr-as01"]
level: 2
---
# ADR-pntr-2 · Deterministic seeded band mask for irregularity

**Status:** proposed.

**Context.**
- The column must be "approximately 5×5", "not perfectly square" and look like TNT aftermath (§9).
- AC-7 must be checkable by a gametest, so the shape must be reproducible.

**Decision.**
- Seed a small PRNG (mulberry32) with a hash of `attackId`.
- For each band of 4 layers, draw one 7×7 mask:
  - the 3×3 core is always included;
  - the 12 edge cells of the 5×5 are included with p = 0.9;
  - the 4 corners with p = 0.5;
  - the 24 rim cells of the 7×7 with p = 0.08.

**Rejected alternatives.**
- **A perfect 5×5.** This violates §9.
- **Per-cell noise on every layer.** It looks like a render glitch and gives no passable guarantee.
- **3D Perlin noise.** It needs a dependency or a hand-written implementation, with no visible benefit at this scale.
- **Using `Math.random`.** The shape can't be reproduced in tests.

**Consequences.**
- Gametests call the same `planColumn(attackId, …)` and assert the exact cell set.
- The probabilities are tunables, and the iPad look check may adjust them without changing the rule.
