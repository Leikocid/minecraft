---
type: "concept-architecture-decision"
node_id: "L0-qatg-adr2"
source_channel: "rollout"
title: "ADR-Q2 — Two-player evidence uses the existing SimulatedPlayer path first, genuine devices second"
aliases: ["L0-qatg-adr2"]
part_of: ["L0-qatg"]
is_a: ["architecture-decision"]
relates_to: ["L0-qatg-p003", "L0-qatg-asm1"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1636
tags: ["architecture-decision","multiplayer","gametest","L0-qatg"]
---

# ADR-Q2 — Two-player evidence uses the existing SimulatedPlayer path first, genuine devices second

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-qatg-p003", "L0-qatg-asm1"]` · `governed_by: ["C-11"]`

**Context.** §14 requires ≥2-player evidence; the documented environment has exactly one iPad and no second Bedrock client (C-11, ASM-010). Stage 1 already built and proved a `SimulatedPlayer`-based multiplayer path in `bds:gametest`.

**Decision.** `L0-qatg-p003` layers evidence collection: simulated two-player `bds:gametest` scenarios are the primary, always-available path for every multiplayer-tagged AT; a genuine two-client Docker BDS LAN session is secondary, used opportunistically for AT-12 specifically (the one test whose claim is partly about client-side rendering, which a simulated player cannot exercise). This reuses Stage 1's proven infrastructure rather than inventing a new one.

**Rejected alternatives.**
- *Block the whole gate until a second physical device is procured* — turns an environment constraint into a hard project stop, for a requirement (§9's server-side determinism) that a simulated player already demonstrably covers.
- *Treat single-player evidence as sufficient and silently drop the multiplayer requirement* — directly contradicts §14's explicit conjunction (`L0-qatg-r002`).

**Consequences.** This decision is provisional on Q-012: it implements the *recommended* answer, not a confirmed one. If the owner answers differently, `L0-qatg-p003` and this ADR are revisited together — they were written as one unit deliberately.
