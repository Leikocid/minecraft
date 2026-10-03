---
type: "concept-architecture-decision"
node_id: "L0-adr-ktob"
source_channel: "rollout"
analysis_version: 6
level: 1
title: "ADR-L0-ktob · The Katana's obstacle semantics"
aliases: ["L0-adr-ktob"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 600
size_chars: 3013
tags: ["v6", "katana", "status:proposed", "alias:L0-adr-ktob", "is_a:architecture-decision", "relates_to:L0-katn", "relates_to:L0-scyt", "relates_to:L0-xasm19", "see_also:dragonkatanaspecv1ruen-part-1", "see_also:dragonkatanaspecv1ruen-part-3"]
---
---
title: "ADR-L0-ktob · The Katana's obstacle semantics: the engine's solid ray, not the Scythe's line of sight"
aliases: ["L0-adr-ktob", "Katana obstacle ADR"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-scyt", "L0-xasm18", "L0-xasm19", "L0-katn-ad01", "L0-katn-as03", "L0-katn-cx01", "L0-lgnd-r017"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3"]
governs_files: ["src/katana/"]
---
# ADR-L0-ktob · The Katana's obstacle semantics

**Status:** proposed (autopilot default). `katn` confirms it by probe.

## Context
- Katana §5/§13 says "solid blocks stop the trace, water and lava do not", and "never phase through a solid obstacle".
- Stable `@minecraft/server` 2.10.0 has **no runtime `Block.isSolid`** (an engine fact).
- The only shipped precedent is the Scythe's `hasLineOfSight` (`src/scythe/targeting.ts`). It treats **every non-air, non-liquid block** as an obstacle, including tall grass, flowers, cobweb and glass. That is right for "can I see a target". For a teleport it is wrong: a flower 3 blocks ahead would stop a 20-block jump.

## Decision
1. **Trace.** Use `dimension.getBlockFromRay(head, viewDir, { maxDistance: 20, includePassableBlocks: false, includeLiquidBlocks: false })`.
   - The engine's own collision notion decides "solid".
   - Passable blocks (grass, flowers, torches) and liquids do not stop the trace.
   - The hit face gives the endpoint. With no hit, the endpoint is `head + 20·dir` (`L0-xasm18`).
2. **Unreadable means solid.** If any cell along the segment is in an unloaded chunk or outside the height range, the trace stops before it (C-12, C-24).
3. **Fit and safety** (amended at reduce v6, resolving `L0-katn-cx01`).
   - **Fits:** one vertical ray down the centre of the feet and head cells, with the trace flags, hits nothing (`L0-katn-ad01`). Both cells being `isAir` skips the ray. The cell below is not counted against the player. No hand-kept solid list is used.
   - **Safe:** it fits, **and** neither cell is `lava`, `flowing_lava`, `fire` or `soul_fire` (`L0-katn-as03`). Water is allowed. That list names hazards, not solids, so it does not reintroduce the hand-kept solid list rejected below.
   - Liquids do not stop the **trace** (§1); that is not the same as being a valid landing.
4. Documented deviations (C-16):
   - Blocks the ray treats as passable but the player cannot walk through: **none known**.
   - Blocks with partial collision (slabs, fences, glass panes): they count as solid for the trace and as occupied for the fit check. The Katana stops short rather than risk a stuck player.

## Rejected alternatives
- **Reuse the Scythe's line of sight.** Grass and flowers would block the ability, and wall-jumping off foliage would feel broken.
- **A hand-maintained solid/passable id list.** It drifts with every Bedrock update and contradicts the "engine-measured facts" practice.
- **Cell-step DDA over `getBlock` with `isAir`/`isLiquid` only.** Same flaw as line of sight, and it costs up to 20+ reads per use.

## Consequences
- `katn` must probe the ray flags on 1.26.51 before building. Memory notes record that the block ray passes carpet, signs and ladders. The probe confirms that liquids are skipped only with `includeLiquidBlocks: false`, and that cobweb is passable.
- The Scythe keeps its own stricter rule. The two notions are deliberately different and are named in each module's README.
