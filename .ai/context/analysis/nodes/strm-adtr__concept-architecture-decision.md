---
type: "concept-architecture-decision"
node_id: "L0-strm-adtr"
source_channel: "rollout"
analysis_version: 8
title: "ADR-strm-adtr · How the blade reuses `src/katana/plan.ts`"
aliases: ["L0-strm-adtr"]
is_a: ["architecture-decision"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 1985
tags: ["v8", "storm-blade", "trace", "katn", "status:proposed"]
level: 2
---
---
title: "ADR-strm-adtr · Reuse the Katana trace by exporting it, not by copying it"
is_a: ["architecture-decision"]
part_of: ["L0-strm"]
relates_to: ["L0-katn", "L0-xasm31", "L0-strm-pact"]
governs_files: ["src/katana/plan.ts", "src/storm/trace.ts"]
---
# ADR-strm-adtr · How the blade reuses `src/katana/plan.ts`

## Context
The L0 plan and xasm31 say the trace reuses `src/katana/plan.ts` helpers, "imported, not copied". At 1.8.0 that module exports only `planTeleport`, `standsSafely`, `TRACE_FLAGS`, `KATANA_RANGE`, `PULLBACK`, `SEARCH_STEP`, `HAZARDS` and the `RayOptions`/`RayHit`/`KatanaWorld` types. The block-walk helpers it relies on are **module-private**: `trace`, `cast`, `cellsAlong`, `hitPoint` and `readability` (`plan.ts:123–259`). They carry the hard-won ray fixes: cell-step budget, part-blocks on exit, unreadable chunks, and float32 margins. `trace` also takes no range parameter: it uses `KATANA_RANGE` = 20.

## Options
- **A (proposed): export a range-parameterised `trace`** (plus `hitPoint`) from `plan.ts`. Add an optional `range` argument that defaults to `KATANA_RANGE`, so Katana behaviour does not change. The Katana unit tests and the Katana BDS scenarios gate the edit. `src/storm/trace.ts` adds the entity pick and the Euclidean clamp.
- **B: move the helpers to a shared `src/ray/`** used by both. It is cleaner, but it touches more Katana code for one consumer.
- **C: copy the helpers into `src/storm/`.** Rejected: it breaks the "imported, not copied" seam and forks the ray fixes.

## Decision
**A.** This is a `katn` file but not a framework file, so it does not trigger xasm32's "new L0 contradiction" clause. It still widens strm's blast radius: the merge gate must include the Katana scenarios.

## Consequences
- The diff in `plan.ts` is limited to `export` keywords and the `range` parameter. A Katana unit test asserts that the default range is unchanged.
- Storm entity picking stays in `src/storm/`. `katn` gains no entity-ray code.
