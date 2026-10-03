---
type: "concept-acceptance-criterion"
node_id: "L0-katn-ac08"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-ac08"]
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 1026
tags: ["acceptance-criterion", "katana", "channel:bds", "probe", "is_a:acceptance-criterion", "relates_to:L0-adr-ktob", "relates_to:L0-adr-ktfl"]
level: 2
---
---
title: "AC-katn-08 (probe, bds): engine facts confirmed before the build"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-adr-ktob", "L0-adr-ktfl", "L0-katn-ad01", "L0-katn-p002"]
---
A probe GameTest on BDS 1.26.51 (checks instance, port 19136) records:
1. A SimulatedPlayer falling from 25 blocks and self-teleported 2 blocks above the floor takes no fall damage. The control without the self-teleport does take it.
2. `getBlockFromRay` with `{includePassableBlocks:false, includeLiquidBlocks:false}`:
   - passes water, lava, grass, flowers, cobweb, carpet;
   - stops at stone, a bottom slab, a fence and a glass pane.
3. The same ray through a cell column hits a bottom slab and a top slab when cast vertically (`L0-katn-ad01`).
4. The same ray reaching into an unloaded chunk: hit, no hit, or throw.
5. `spawnParticle("minecraft:cherry_leaves_particle")` does not throw.

Each fact goes to the memory and to the ADR status. A failed fact supersedes the relevant ADR before the build tasks start.
