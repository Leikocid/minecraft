---
type: "concept-glossary-term"
node_id: "L0-qatg-gl02"
source_channel: "rollout"
title: "Glossary — Definition of Done (DoD)"
aliases: ["L0-qatg-gl02"]
part_of: ["L0-qatg"]
is_a: ["glossary-term"]
relates_to: ["L0-qatg-ent3", "L0-qatg-gl01"]
analysis_version: 2
level: 2
priority: 510
size_chars: 782
tags: ["glossary-term","L0-qatg"]
---

**Definition of Done (DoD)** · RU: *«готовность первой версии»* (§14)

The five §14 conditions that together decide whether the Web Sword counts as a finished, standalone module: clean import, full acceptance coverage (single- and multi-player), no known duplication path, no mandatory Preview/Experiments dependency, and the derived "ready to proceed" conclusion. Modelled as `L0-qatg-ent3`.

The DoD is a **superset** of the twelve ATs, not a synonym for them — it adds gate-level conditions (dup-safety across all four vectors, the Preview-dependency check) that no single AT states on its own.

**Related**: **Acceptance Test** — the individual checks the DoD aggregates; **Release Gate** — the process (`L0-qatg-p002`) that evaluates the DoD.
