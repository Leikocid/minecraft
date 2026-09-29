---
type: "concept-architecture-decision"
node_id: "L0-ring-ad03"
source_channel: "rollout"
analysis_version: 3
title: "AD-ring-03 · The script classifies underwater and sets explicit flags"
aliases: ["L0-ring-ad03"]
is_a: ["architecture-decision"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1260
tags: ["is_a:architecture-decision", "underwater", "status:proposed", "relates_to:L0-ring-r007", "relates_to:L0-ring-as04", "relates_to:L0-adr-ochg"]
level: 2
---
# AD-ring-03 · The script classifies underwater and sets explicit flags

**Status:** proposed. It confirms the flags in `L0-adr-ochg` §3.

**Context.**
- §10 says: "underwater the explosion does not deform/destroy blocks, but still deals normal TNT damage".
- The typings describe `allowUnderwater` only as "whether parts of the explosion also impact underwater". The engine's own water test is undocumented: it may check the centre cell, the rays, or waterlogged blocks.

**Decision.**
- `ring` decides `underwater` itself from the centre cell (`r007`, `r010`) and passes:
  - `breaksBlocks: !underwater`;
  - `allowUnderwater: true`, so the damage part is never switched off by the engine's water test;
  - `causesFire: false`.
- AC-15 is then deterministic whatever the engine does.

**Rejected.**
- **`allowUnderwater: false` and trusting the engine:** unknown semantics, and it may also cancel the damage (`as04`).
- **An attack-level classification** (the target block is in water → the whole RMB is damage-only): it gives wrong results for rings that straddle a shoreline.

**Consequence.** On land, `allowUnderwater: true` also lets land blasts break blocks that border water, such as a waterlogged slab at the shore. That matches vanilla TNT on land.
