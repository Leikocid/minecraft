---
type: "concept-assumption"
node_id: "L0-xasm40"
source_channel: "rollout"
analysis_version: 11
level: 1
title: "ASM-L0-40 · Release scope across `uwbw` and `ench`"
aliases: ["L0-xasm40"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 640
size_chars: 1570
tags: ["v10", "release", "cross-component", "CAN_ASSUME"]
---
---
title: "ASM-L0-40 · 1.11.0 ships the bow and the recipes without waiting for xq11; the two probes share the checks server but not criteria"
aliases: ["L0-xasm40", "v10 release scope"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-uwbw", "L0-ench", "L0-xq11", "L0-xcx32", "L0-xcx33", "L0-adr-enrl", "L0-uwbw-pprb", "L0-ench-prob"]
---
# ASM-L0-40 · Release scope across `uwbw` and `ench`

**Assumed (CAN_ASSUME).**
1. **There is no build dependency between the halves.**
   - The bow needs only `minecraft:enchantable` slot `bow`.
   - The roller sees def #8 through that slot.
   - Neither component waits on the other's probe.
2. **1.11.0 does not wait for `xq11`.** It ships:
   - the bow, the Mace and Rocket recipes;
   - the `ench` verdict and the dormant, tested roller.

   If `xq11` has no answer by then, the ending is (c): the acceptance sheet and the release notes mark §5 bullets 4–6 "not deliverable on stable Bedrock" (C-38). An approved adapter goes in a later minor version.
3. **The probes share one server.** Both run on checks (19136) in parallel, as distinct criterion sets, each on its own private BDS copy named after its full task id. Neither runs the full suite.
4. **`xcx33` rides on `xq11`** as a non-blocking sub-question. With no answer, the `xasm38` gesture ships, with a note on the acceptance sheet.

**Impact if wrong.**
- **Andrey wants one release with the table:** 1.11.0 waits on `xq11` plus the adapter. The bow's work is unchanged.
- **The probes must be serial:** stage 11 loses some parallelism; nothing else changes.
