---
type: "concept-assumption"
node_id: "L0-lgnd-as06"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-lgnd-as06"]
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 403
tags: ["assumption", "CAN_ASSUME", "limits"]
level: 2
---
**ASM-lgnd-06: Ledger sizes stay far below the dynamic-property string limit (about 32 KB).**

Admin `give` copies are rare, and each owed entry is about 200 chars.

**Impact if wrong:** a long-running test world with many lost admin copies could overflow `_owed`. The mitigation is to drop the oldest `despawn` entries and log a line. That loses those debts, which in practice means admin copies only.
