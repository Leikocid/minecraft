---
type: "concept-glossary-term"
node_id: "L0-qatg-gl04"
source_channel: "rollout"
title: "Glossary — Harness"
aliases: ["L0-qatg-gl04"]
part_of: ["L0-qatg"]
is_a: ["glossary-term"]
relates_to: ["L0-qatg-gl05"]
analysis_version: 2
level: 2
priority: 510
size_chars: 729
tags: ["glossary-term","L0-qatg"]
---

**Harness** · analysis term, collective

The set of mechanisms that can produce verification evidence for this project: `npm test` (7 static/build-time suites), `bds:check` (`packs/selftest`, stable-API in-engine assertions), `bds:gametest` (`packs/gametest`, Beta-API `SimulatedPlayer` scenarios, dev-only), the **iPad visual pass** (manual, one device), and — situationally — a genuine two-client Docker BDS LAN session. Each has a disjoint blind spot (see `L0-qatg` component doc, harness table); no single mechanism is "the" harness, and the Acceptance Matrix exists precisely to record which mechanism backs which claim.

**Related**: **iPad Visual Pass** — the one harness mechanism this component cannot automate.
