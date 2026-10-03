---
type: "concept-assumption"
node_id: "L0-orbc-as04"
source_channel: "rollout"
analysis_version: 5
title: "ASM-orbc-04 · All charges of one attack spawn at the same Y, derived from the target"
aliases: ["L0-orbc-as04"]
is_a: ["assumption"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 856
tags: ["is_a:assumption", "CAN_ASSUME", "relates_to:L0-orbc-r007", "relates_to:L0-ring"]
level: 2
---
# ASM-orbc-04 · All charges of one attack spawn at the same Y, derived from the target

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-r007", "L0-ring"]`

**Gap.** §10 says all RMB charges "are created simultaneously at the corresponding dimension height and start falling simultaneously". It is unclear whether "height" means per-column terrain + 60, or target + 60.

**Assumption.** There is one `spawnY` per attack, `target.y + offset` clamped (`r007`), shared by every ring column. On uneven terrain a column's fall is then longer or shorter, which matches §10's note that "actual detonation timing may differ slightly".

**Impact if wrong.** With per-column heights, every column needs a surface read at spawn: about 160 `getTopmostBlock` calls. The fall times would equalise. It is a change only in `p001` step 7.
