---
type: "concept-assumption"
node_id: "L0-xasm11"
source_channel: "rollout"
analysis_version: 3
title: "ASM-L0-11 · Engine facts assumed across `lgnd`, `pntr` and `ring`, to be probed once on BDS 1.26.51.1 (checks instance, port 19136)"
aliases: ["L0-xasm11"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-pntr", "L0-ring", "L0-orbc", "L0-adr-oprt", "L0-adr-odrp", "L0-adr-ochg", "L0-ring-as02", "L0-pntr-cx01", "L0-lgnd-p008"]
see_also: ["L0-pntr-as01", "L0-ring-as01"]
priority: 540
size_chars: 2054
tags: ["status:to-probe", "channel:bds", "v3-reduce", "relates_to:L0-lgnd", "relates_to:L0-pntr", "relates_to:L0-ring", "relates_to:L0-adr-oprt", "relates_to:L0-adr-odrp"]
level: 1
---
# ASM-L0-11 · Engine facts assumed across `lgnd`, `pntr` and `ring`, to be probed once on BDS 1.26.51.1 (checks instance, port 19136)

Each child has its own local probes (`pntr-as01…08`, `ring-as01…08`). The probes below are the ones that **more than one** component's design rests on. They run once, as the first commit of the `lgnd` v3 step 5, before `pntr` or `ring` code is written.

| # | Assumed (CAN_ASSUME) | Rests on it | If false |
|---|---|---|---|
| P1 | `runCommand("setblock x y z air destroy")` on `frame`/`glow_frame` spills the frame and its item as item entities, and `getEntities` sees them in the same tick or after one `system.run`. | `L0-adr-oprt` §3 (`p008` step 2b), used by both effects | Frame fallback: `pntr` keeps frames. For `ring`, a C-16 documented limit. |
| P2 | Setting `world.gameRules.doTileDrops` from script is silent to clients (no chat line or toast) and applies to blocks broken by `createExplosion` in the same synchronous call. | `L0-adr-odrp`, `ring-ad01` | `ring-ad01`'s fallback: an item diff limited to destroyed-block cells. |
| P3 | With `doTileDrops=false`, a container destroyed by `createExplosion` does not spill its contents (`ring-as02`). | `L0-adr-odrp` §2 | `ring-ad01`'s container fallback. Legendaries are already safe through `p008`. |
| P4 | A `createExplosion` of power 4 damages or destroys item entities no farther than 2 × power (8 blocks) from its centre. | `L0-adr-oprt` §1 margin | Widen the `ring` margin to the measured value. The `p008` contract is unchanged, because the caller sizes the volume. |

**Why an assumption, not a question.** These are all engine facts that the checks instance can answer in one GameTest. Nothing here needs the client.
