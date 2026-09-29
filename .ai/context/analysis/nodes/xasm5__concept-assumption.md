---
type: "concept-assumption"
node_id: "L0-xasm5"
source_channel: "rollout"
analysis_version: 2
title: "ASM-L0-5 · The two families share one dynamic-property store, with disjoint key families and one budget"
aliases: ["L0-xasm5"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 1428
tags: ["title:Weapons and structures share one world dynamic-property budget with disjoint key families", "CAN_ASSUME", "reduce", "cross-component", "relates_to:L0-lgnd", "relates_to:L0-strf", "relates_to:L0-wind", "relates_to:L0-infr", "relates_to:L0-adr-strs", "relates_to:L0-strf-p006", "relates_to:L0-strf-as05", "relates_to:L0-xasm1"]
level: 1
---
# ASM-L0-5 · The two families share one dynamic-property store, with disjoint key families and one budget

**Links:** `is_a: ["assumption"]` · `relates_to: ["L0-lgnd", "L0-strf", "L0-wind", "L0-adr-strs", "L0-strf-as05"]` · **status:** CAN_ASSUME

**Assumption.**
1. **Key families are disjoint by construction.**

   | Family | Keys | Stored on |
   |---|---|---|
   | Weapons | `andrew:<prefix>_*` (`ws`, `sc`), `andrew:cd_*`, `andrew:busy_*`, `andrew:hidden_until` | players, plus world-level craft flags |
   | Structures | `andrew:st:*` (`salt`, `<dim>:<rx>:<rz>`, `spawn`) | world only |

   `st` is reserved. No `LegendaryDef.keyPrefix` may be `st`.
2. **One budget.** The probe item 8 result (`strf-p006`) is the budget for the whole pack. The weapons' world-level use is a few short keys and negligible. The region shards (`L0-adr-strs`) are sized against that result minus a fixed 4 KB headroom for weapons.
3. **Durable deadlines** in structure records, if any appear (for example a sweep start time), are epoch ms, following `L0-xasm1`.
4. Only the release pack's store is the world's structure registry; test packs write `andrew:st:*` only into their own per-pack store, for runtimes they drive at chosen sites (`L0-adr-own`).

**If wrong.** If the probe shows the engine enforces a total per-pack limit near the shard design, the structure shards must shrink or compress, and the weapons stay unaffected. A prefix collision would corrupt state silently, so `infr`'s validate step adds a check that no `keyPrefix` equals `st`.
