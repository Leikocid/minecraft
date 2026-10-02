---
type: "concept-architecture-decision"
node_id: "L0-adr-ufnd"
source_channel: "rollout"
analysis_version: 4
title: "ADR-L0-ufnd · What UFO AC-10 \"nothing else drops\" means"
aliases: ["L0-adr-ufnd"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 2738
tags: ["v4", "status:accepted", "ufo", "relates_to:L0-magn", "relates_to:L0-lgnd", "relates_to:L0-magn-adhp", "relates_to:L0-magn-cxdp", "relates_to:L0-lgnd-cx13", "relates_to:L0-lgnd-r016", "relates_to:L0-lgnd-ac21", "relates_to:L0-xcx18"]
level: 2
---
---
title: "ADR-L0-ufnd · What UFO AC-10 \"nothing else drops\" means across `magn` and `lgnd`"
aliases: ["L0-adr-ufnd"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-magn", "L0-lgnd", "L0-magn-adhp", "L0-magn-rblk", "L0-magn-a10", "L0-magn-cxdp", "L0-lgnd-cx13", "L0-lgnd-r016", "L0-lgnd-ac21", "L0-xcx18"]
requires: ["L0-magn-adhp"]
status: accepted
resolves: ["L0-lgnd-cx13", "L0-magn-cxdp", "L0-xcx18"]
---
# ADR-L0-ufnd · What UFO AC-10 "nothing else drops" means

**Context.** Three artifacts from this run read AC-10 against different risks:
- **`L0-lgnd-cx13` / `lgnd-r016` §4:** pulling a hopper block would erase a legendary inside it. `lgnd` therefore wanted `protectLegendariesIn` first, which causes an extra drop.
- **`L0-lgnd-ac21`** (as first written) expected the hopper to be pulled and the Cannon to land beside the cell.
- **`L0-magn-adhp`** (which settles `L0-xcx18`): a hopper is a container only and **never** a pulled block.
- **`L0-magn-cxdp`:** removing an iron block pops dependants (a torch, rail or carpet resting on it) with their vanilla drops.

`lgnd-ac21` and `magn-adhp` contradicted each other directly. Both come from this run, so they were reconciled in place.

**Decision.**
1. **The hopper is never a pulled block.** `magn-adhp` governs. This is stronger than `lgnd-cx13` option (b), because full and empty hoppers alike stay put.
   - As a result, the magnet turns no `HOLDER_TYPES` block into air. `lgnd-r016` §4 is marked *dormant*: it stays as the floor if the block list ever changes.
   - `lgnd-ac21` was rewritten: the hopper block and the Cannon inside it stay untouched, and the negative control now stubs `isLegendaryStack`.
   - `L0-lgnd-cx13` and `L0-xcx18` are resolved.
2. **AC-10 reads as "the pulled block itself yields exactly one item".** This is `magn-cxdp` option (a).
   - A vanilla pop of a dependant (torch, rail, carpet, button, lantern, door on top) is allowed. It is the dependant's own drop: no loss and no duplication, so C-7″ holds.
   - The `magn-a10` GameTest keeps isolated blocks. A separate scenario documents the pop.
   - `L0-magn-cxdp` is resolved as the autopilot default.
3. **Deviation notes** in `src/ufo/README` and in the release notes:
   - "the hopper is a container, not a pulled block";
   - "blocks resting on a pulled block pop as in vanilla".

**Why.** Agent priority (1), no loss or corruption, outranks a literal reading of the §4 block list. Option (c) of `cxdp`, silent removal, is the only reading that loses items, and it is rejected.

**Operator review.** Both readings are autopilot defaults (`xcx18`, `cxdp`). If either is overturned, `lgnd-r016` §4 becomes live again and `lgnd-ac21` needs its hopper-block clause back.
