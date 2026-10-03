---
type: "concept-acceptance-criterion"
node_id: "L0-katn-ac07"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-ac07"]
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 928
tags: ["acceptance-criterion", "katana", "channel:bds", "T16", "T17", "T18", "is_a:acceptance-criterion", "relates_to:L0-lgnd-p002", "relates_to:L0-lgnd-p003", "relates_to:L0-xcx21"]
level: 2
---
---
title: "AC-katn-07 (T16–T18, bds): Katana instances of the framework's protection tests"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-lgnd-ac24", "L0-lgnd-p002", "L0-lgnd-p003", "L0-lgnd-p008", "L0-xcx21", "L0-xasm22", "L0-adr-ktgr"]
---
These are framework rules. **The test text is `L0-lgnd-ac24`** (reconciled at reduce v6: this card used to restate it, and had drifted on two points). `katn` owns none of the assertions; it contributes only:
- the Katana def and item JSON that `L0-lgnd-ac24` runs against (`L0-katn-ent1`);
- the one Katana-specific case in that criterion, **death after a teleport** (into lava, or below the one-shot flag's cover), which `L0-lgnd-ac24` T16 already names.

**Reconciled points:**
- T16: retention keeps the **same id and gen**. `retention.ts` restore does not bump the gen (as read during reduce at v6). The earlier `gen + 1` here was wrong.
- T18: the return target is **`mark.owner`** until `L0-xcx11` closes. "Last owner" in Katana §3 is the open `L0-adr-hold` question, not a passing test today.
- T17: under C-16 (`L0-xcx21`, settled by `L0-adr-ktgr`).

Do not create a separate task criterion from this card. It would duplicate `L0-lgnd-ac24`.
