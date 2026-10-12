---
type: "concept-assumption"
node_id: "L0-xasm44"
source_channel: "rollout"
analysis_version: 11
level: 1
title: "ASM-L0-44 · Release scope across v10 and v11"
aliases: ["L0-xasm44"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 650
size_chars: 1908
tags: ["v11", "release", "CAN_ASSUME"]
---
---
title: "ASM-L0-44 · v3 supersedes v2 by content only; the Pearl Rod ships in 1.11.x independently of the bow and xq11"
aliases: ["L0-xasm44", "v11 release scope"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-uwbw", "L0-ench", "L0-xasm40", "L0-xq11"]
see_also: ["underwaterbowfinalspecv3ruen-part-1", "underwaterbowfinalspecv3ruen-part-5", "underwaterbowmacefireworksenchantingspecv2ruen-part-1"]
---
# ASM-L0-44 · Release scope across v10 and v11

**Class:** CAN_ASSUME.

**Gap.**
- The new document calls itself "FINAL Specification v3". It repeats v2 §1–§5 verbatim and says "Preserve all v2 … rules above".
- Both documents are now in the KV, with priorities 640 and 650.
- The spec does not say whether the Pearl Rod belongs to the same release as the bow.

**Assumption.**
- **v3 is the governing text for §1–§8.** v2 is retained as an identical earlier copy, not a conflicting source. Version labels do not drive supersession here, but the content is the same, so nothing in `uwbw` or `ench` changes. Their `see_also` gains the v3 fragments at rollout.
- **The Pearl Rod is its own epic.** It shares no code path with the bow beyond the recipe-collision test, and none with `ench` beyond eligibility data.
  - It ships in the first 1.11.x build where its criteria are closed.
  - It neither waits for nor blocks the bow, and it never waits for `xq11` (`xasm40` carries).
  - It does not wait for `xq12`, which has defaults.
- **The probe order is distinct criterion sets on checks (19136)**, run in parallel with the `uwbw` and `ench` probes. It must never be run against production (19132).

**Impact if wrong.**
- If Andrey wants one bundled 1.11.0, the release simply waits for the slower epic. The work does not change.
- If v3 was meant to *change* a v2 rule, it did not say which. A diff found none, so a re-run of `uwbw` or `ench` would be needed only on a new document.
