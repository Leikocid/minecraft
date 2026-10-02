---
type: "concept-contradiction"
node_id: "L0-magn-cxdp"
source_channel: "rollout"
analysis_version: 5
title: "CX magn-cxdp · \\"Nothing else drops\\" (AC-10) vs vanilla pops of blocks resting on a removed iron block"
aliases: ["L0-magn-cxdp"]
is_a: ["contradiction"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 1118
tags: ["is_a:contradiction","status:resolved","category:assumption-gap","target:L0-magn","severity:medium","relates_to:L0-magn-rblk","see_also:ufomagnetspecv1ruen-part-2","see_also:ufomagnetspecv1ruen-part-4","resolved"]
level: 2
closed_at: 2026-10-02
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-magn-cxdp
---

# CX magn-cxdp · "Nothing else drops" (AC-10) vs vanilla pops of blocks resting on a removed iron block

**Spec.**
- UFO §5 Blocks: "no extra drop".
- AC-10: "a pulled block becomes air and exactly one item … nothing else drops".

**Engine.**
- `setType(air)` fires neighbour updates. A torch, rail, carpet, button, lantern or door standing on (or hanging from) a removed iron block pops off with its **vanilla drop**.
- U6 tested isolated blocks only, so it did not cover this.

**Options.**
- **(a) Allow vanilla pops.** The dependant's own item drops. This is no loss and no duplication (C-7″ holds). AC-10 is read as "the pulled block itself yields exactly one item".
- **(b) Skip any built block that has an attached dependant.** This needs a support check on the 6 neighbours for each candidate.
- **(c) Remove the dependants silently.** This loses items and violates C-15 priority 1.

**Autopilot default: (a).**
- The AC-10 GameTest uses isolated blocks and asserts exactly one new item per pulled block.
- A separate scenario documents that the dependant pops.

This needs operator acceptance of the reading.

**Resolved at reduce v4** by `L0-adr-ufnd`: the autopilot default (a) is adopted. The operator may overturn it; the default is recorded as a C-16 deviation note.
