---
type: "concept-contradiction"
node_id: "L0-xcx16"
source_channel: "rollout"
analysis_version: 4
level: 1
title: "CX-L0-16 · The v3 Orbital nodes still describe 10-block aim, +30 spawn, power-4 rings at d 1/5/10/15/20 and \\"not started\\"; the spec and v1.4.4 say otherwise"
aliases: ["L0-xcx16"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 1738
tags: ["status:open","category:source-vs-code","target:L0-orbc","severity:medium","relates_to:L0-orbc","relates_to:L0-pntr","relates_to:L0-ring","see_also:orbitalcannonspecv1ruen-part-2","see_also:orbitalcannonspecv1ruen-part-3","v4","resolved"]
closed_at: 2026-10-03
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx16
---

---
title: "CX-L0-16 · The v3 Orbital nodes still describe 10-block aim, +30 spawn, power-4 rings at d 1/5/10/15/20 and \"not started\"; the spec and v1.4.4 say otherwise"
aliases: ["L0-xcx16"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-orbc", "L0-pntr", "L0-ring", "L0-xcx8", "L0-xcx14", "L0-xq5"]
see_also: ["orbitalcannonspecv1ruen-part-2", "orbitalcannonspecv1ruen-part-3", "orbitalcannonspecv1ruen-part-4"]
status: open
category: source-vs-code
---
# CX-L0-16 · The v3 Orbital nodes still describe 10-block aim, +30 spawn, power-4 rings at d 1/5/10/15/20 and "not started"; the spec and v1.4.4 say otherwise

**Re-imported Orbital spec (priority 570) and shipped code:**
- Operator decisions of 2026-10-02:
  - aim ≤ 25;
  - RMB not nearer than 7;
  - spawn +60 in the Overworld and End, +10 in the Nether;
  - ring diameters 1/7/14/21/28;
  - powers 4/4/2/1/1, where power is a radius, so reach is 8/8/4/2/2;
  - damage scales with each ring's power.
- These are merged in v1.4.1–1.4.4.

**The v3 `L0-orbc`, `L0-ring` and `L0-pntr` artifacts** and the v3 L0 overview, ACs and `xasm8` still carry the old figures and the "not started / analysis only" state. Task generation from them would regress the build.

**Also affected:**
- `L0-xcx8`, `L0-xcx14` and `L0-xq5` were framed around 10-block reach. The 25-block aim through `playerSwingStart` may already settle them.
- `L0-sauc` depends on +60 > +40: charges spawn above the hovering saucer, so they can cross its hull. At +30 they could not.

**Resolution:** a separate reconcile run of `orbc`, `pntr` and `ring` against v1.4.4 and the decision records. It does not block Stage 6, but `sauc` must read figures from the code (`src/orbital/`), not from the v3 nodes.
