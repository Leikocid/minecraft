---
type: "concept-architecture-decision"
node_id: "L0-adr-oprt"
source_channel: "rollout"
analysis_version: 3
title: "ADR-L0-oprt · The legendary-protection contract shared by `pntr` and `ring`"
aliases: ["L0-adr-oprt"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-pntr", "L0-ring", "L0-lgnd-p008", "L0-lgnd-r013", "L0-lgnd-ad10", "L0-lgnd-ac19", "L0-ring-ad04", "L0-ring-ac16", "L0-pntr-r005", "L0-ring-cx02", "L0-pntr-cx01", "L0-adr-odrp", "L0-xasm11"]
see_also: ["L0-lgnd-cx12", "L0-xcx10"]
requires: ["L0-lgnd-p008"]
priority: 540
size_chars: 4167
tags: ["status:accepted", "v3-reduce", "amends:L0-lgnd-p008", "resolves:L0-ring-cx02", "resolves:L0-pntr-cx01", "relates_to:L0-lgnd", "relates_to:L0-pntr", "relates_to:L0-ring", "relates_to:L0-lgnd-p008", "relates_to:L0-lgnd-ad10", "relates_to:L0-ring-ad04", "relates_to:L0-ring-cx02", "relates_to:L0-pntr-cx01", "requires:L0-lgnd-p008"]
level: 2
---
# ADR-L0-oprt · The legendary-protection contract shared by `pntr` and `ring`

**Status:** accepted (reduce, v3). **Amends:** `L0-lgnd-p008` (steps 4 and 6, cost note), `L0-lgnd-r013` §2. **Resolves:** `L0-ring-cx02`, `L0-pntr-cx01`.

## Context
`lgnd` published `protectLegendariesIn` (`L0-lgnd-p008`) before either effect was analysed. Each effect then found a hole in it, and each hole touches the other effect too:
- **`ring` (`cx02`):** a Bedrock explosion damages item entities out to about 2 × power, but `p008` protects only ± power. The 16-block safe-spot search also cannot leave a 37 × 37 `avoid` box, so "hand back" (the C-16 exception) became the normal path.
- **`ring` (`ad04`):** one call per detonation is 30–50× too many queries. `ring` batches one call per queue step, and that is why the `avoid` box is so large.
- **`pntr` (`cx01`):** item frames are blocks with no stable API. `setType(air)` deletes a framed legendary silently. The same is true for `ring`: under `L0-adr-odrp`'s `doTileDrops=false`, a frame broken by the blast drops nothing, including its item. So it is a shared gap, not a `pntr` one.

## Decision
1. **The caller sizes the volume, and `lgnd` does not assume a radius.**
   - `r013` §2 becomes: "the volume the effect will modify *or damage*".
   - `ring` passes blast centres ± 2·power (± 8).
   - `pntr` passes the column footprint over its full height.
   - `p008`'s "about 9³" cost note is replaced by `ring-ad04`'s batching: one call per `ring` queue step, and one per `pntr` attack before its first `setType`.
2. **The safe-spot search starts at the edge of `avoid`.**
   - `p008` step 4 walks outward from the XZ boundary of `avoid ∪ volume`.
   - Its limit is `max(16, halfExtent(avoid ∪ volume) + 4)`.
   - Step 6 (hand back to `holder ?? owner`) stays the only exit from the world. It is expected only in the End void or on unsupported terrain, and `ring-ac16`/`lgnd-ac19` assert `handedBack = 0` on normal ground.
3. **Frames belong to `lgnd`, not to each effect.**
   - `p008` gains step 2b. For each `minecraft:frame`/`glow_frame` in `volume`, it runs `setblock x y z air destroy`, so the engine spills the frame and its item as item entities.
   - It does this **before** the effect's first block change, and outside any `doTileDrops=false` window.
   - Step 3 (ground items) then collects a spilled legendary like any other.
   - Non-legendary items spilled from frames fall under each effect's normal rule: `pntr` removes them together with its column (no drops), and `ring`'s blast treats them like any other ground item.
   - This depends on probe `L0-xasm11` (spill happens, and the item entity is visible within the same tick, or one `system.run` later).
   - If the probe fails, **fallback:** both effects add frames to a shared keep set (`pntr` keep set; `ring` pre-pass `setType` skip is impossible, so for `ring` the limit is documented as C-16, next to `L0-lgnd-cx12`).
4. **One call site per effect, and no copying.** `pntr-r005` and `ring-r008` call `p008` and nothing else. Neither effect scans containers or frames itself. The `ac19` negative check (an effect without the call fails) covers both effects.

## Rejected
- A fixed ± 8 margin inside `p008`. `pntr` has no blast, and a margin would move items needlessly from beside the column.
- Per-effect frame handling. That would be two implementations of a `lgnd` rule, against the reduce plan ("`lgnd` answers first").

## Consequences
- Update `p008` steps 2b, 4 and 6 and `r013` §2 in the `lgnd` v3 task (step 5, `protectLegendariesIn`).
- `ring-ac16` stops "failing by design" once this change ships.
- `lgnd-ac19` gains an item-frame fixture for LMB and for RMB.
