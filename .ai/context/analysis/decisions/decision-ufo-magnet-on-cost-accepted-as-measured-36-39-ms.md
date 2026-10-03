---
type: "decision"
node_id: "decision-ufo-magnet-on-cost-accepted-as-measured-36-39-ms"
source_channel: "cli"
analysis_version: null
title: "UFO magnet-on cost accepted as measured (36–39 ms, one tick)"
aliases: ["decision-ufo-magnet-on-cost-accepted-as-measured-36-39-ms"]
is_a: ["decision"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 500
statement: "Question: L0-xasm16 budgets 12 ms for the magnet-on pass; measured 23–41 ms over 200 chests (MAGN-HOLD-01-AA, final main run 39 ms) while the server holds 20.01 TPS. Decision (operator, 2026-10-03): accept as is — keep the single synchronous pass at onPhase(magnet) (L0-magn-adsc); do not spread the scan over ticks. Impact: the 12 ms figure in L0-xasm16 is superseded by the measurement; TPS 20 over the magnet stays the acceptance bar (L0-magn-atps)."
decided_at: "2026-10-03"
tags: ["refine","decision"]
size_chars: 452
---

Question: L0-xasm16 budgets 12 ms for the magnet-on pass; measured 23–41 ms over 200 chests (MAGN-HOLD-01-AA, final main run 39 ms) while the server holds 20.01 TPS. Decision (operator, 2026-10-03): accept as is — keep the single synchronous pass at onPhase(magnet) (L0-magn-adsc); do not spread the scan over ticks. Impact: the 12 ms figure in L0-xasm16 is superseded by the measurement; TPS 20 over the magnet stays the acceptance bar (L0-magn-atps).
