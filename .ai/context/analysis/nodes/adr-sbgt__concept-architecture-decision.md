---
type: "concept-architecture-decision"
node_id: "L0-adr-sbgt"
source_channel: "rollout"
analysis_version: 8
title: "ADR-L0-sbgt · The Storm Blade's merge gate"
aliases: ["L0-adr-sbgt"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 620
size_chars: 2085
tags: ["v8", "storm-blade", "merge-gate", "blast-radius", "status:accepted"]
level: 2
---
---
title: "ADR-L0-sbgt · Merge gate for Storm Blade work spans strm, katn, lgnd and magn"
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-katn", "L0-lgnd", "L0-magn", "L0-sclk", "L0-strm-adtr", "L0-adr-sbdm", "L0-xasm31", "L0-xasm32", "L0-strm-asm1"]
---
# ADR-L0-sbgt · The Storm Blade's merge gate

## Context
The L0 plan says to gate each Stage-10 merge by blast radius plus the legendary scenarios. The deep-dive shows the radius is wider than one weapon:
- **`katn`.** `L0-strm-adtr` A exports `trace`/`hitPoint` from `src/katana/plan.ts`, with a `range` parameter. As read during reduce at v8, those helpers are module-private (`plan.ts:123–216`). Only constants, types, `standsSafely` and `planTeleport` are exported. So the build edits a Katana file.
- **`lgnd`.** Def #6 is added to `registry.ts`, and every def-driven path picks it up: gate, retention, Void, protection, HUD and hands.
- **`magn`.** The magnet's legendary scenarios include def #6.
- **`sclk`.** It is *not* in the radius. `src/storm/damage.ts` mirrors `src/sculk/hit.ts` and does not import it (`L0-strm-rdmg`).

## Decision
| Stage-10 step | Gate |
|---|---|
| Vanilla recipes | recipe JSON load + the Crafter craft scenarios only |
| Def #6, item, token, recipe | `lgnd` scenarios + `magn` legendary scenarios + the new craft scenarios |
| Exporting the trace from `plan.ts` | Katana unit tests (default range unchanged) + **all Katana BDS scenarios** |
| Damage helper, active, passive | `strm` scenarios + `lgnd` death/hazard/Void with def #6 |

Two rules hold for every step:
- The full suite is not the default gate.
- The live ±5 % passive scenario (≈ 5 min, `L0-strm-asm1` §2) runs as its own scenario. It is not part of any merge gate.

## Consequences
- Any edit to `src/legendary/*` beyond the `registry.ts` entry is still a new L0 contradiction (`xasm32`). The `plan.ts` export is not, but it pulls `katn` into the gate.
- `src/sculk/` must not appear in a Storm Blade diff. If it does, `sclk` scenarios join the gate and the "mirrored, not shared" seam has broken.
