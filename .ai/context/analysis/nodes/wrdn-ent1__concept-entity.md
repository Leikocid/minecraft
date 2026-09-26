---
type: "concept-entity"
node_id: "L0-wrdn-ent1"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-wrdn-ent1"]
is_a: ["entity"]
part_of: ["L0-wrdn"]
relates_to: ["L0-wrdn"]
priority: 530
size_chars: 1418
tags: ["is_a:entity", "instance", "worldgen"]
level: 2
---
## MiniWardenCityInstance

One per generated city. Written once at successful placement; read for idempotency checks on every subsequent chunk load.

**Attributes**
- `instanceId` — stable key derived from anchor chunk coordinates (dimension is always Overworld, so no dimension field needed).
- `anchorPosition` — world position of the template's placement anchor (pre-rotation origin).
- `rotation` — one of `0 | 90 | 180 | 270`, chosen once at generation.
- `topY` — integer in `[-45, -35]`, chosen once at generation, independent of the candidate roll.
- `footprintApprox` — fixed constant, ≈30×30×(10–15), documented for reference (not stored per instance; same for every city).
- `surfaceMarkerPosition` — surface coordinate of the ~5×5 sculk patch, derived from `anchorPosition` + `rotation`.
- `centralHallBounds` / `monumentBounds` — derived from the fixed template + rotation; used for the "digging down from marker hits the hall" guarantee (`L0-wrdn-rul3`).
- `state` — `candidate → placed | cancelled`. Cancelled instances are not persisted (no relocation, per `L0-wrdn-rul1`).
- `placedAtTick` / `placedAtTimestamp` — for persistence/idempotency auditing.

**Relates to:** `L0-wrdn-ent2` (chests), `L0-wrdn-ent3` (shriekers) — both keyed by `instanceId`.

**Invariant:** exactly one `MiniWardenCityInstance` per anchor chunk; a reload must find the existing record and skip re-placement (`L0-wrdn-rul7`).
