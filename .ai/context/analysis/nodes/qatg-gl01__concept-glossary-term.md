---
type: "concept-glossary-term"
node_id: "L0-qatg-gl01"
source_channel: "rollout"
title: "Glossary — Acceptance Test (AT)"
aliases: ["L0-qatg-gl01"]
part_of: ["L0-qatg"]
is_a: ["glossary-term"]
relates_to: ["L0-qatg-ent1", "L0-qatg-gl02"]
analysis_version: 2
level: 2
priority: 510
size_chars: 680
tags: ["glossary-term","L0-qatg"]
---

**Acceptance Test (AT)** · RU: *«приёмочный тест»* (§13)

One of the twelve bulleted checks in spec §13. Not a code artifact by itself — a natural-language claim ("Web Sword виден в Creative Equipment...") that this analysis assigns a stable `AT-1`..`AT-12` id and an owning L1 component (`L0-qatg-ent1`). Distinguish from a **test suite** (a `.test.mjs` file) or a **GameTest scenario** (a `Test`-registered function): an AT is the *requirement*, the harness mechanisms are how it gets *evidenced*.

**Related**: **Definition of Done** — the five conditions that gate on all twelve ATs jointly; **Acceptance Matrix** — the table that tracks them.
