---
type: "concept-acceptance-criterion"
node_id: "L0-ench-ac05"
source_channel: "rollout"
analysis_version: 10
title: "AC-ench-05 · No hook before the xq11 answer; the default (c) is reported honestly"
aliases: ["L0-ench-ac05"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 848
tags: ["v10", "enchanting", "gating", "C-38", "channel:review"]
level: 2
---
# AC-ench-05 · No hook before the xq11 answer; the default (c) is reported honestly

**is_a:** acceptance-criterion · **part_of:** L0-ench · **relates_to:** L0-xq11, L0-xcx32, L0-adr-enrl

**GIVEN** `xq11` is unanswered, or answered (c),
**WHEN** the epic merges,
**THEN**:
- no module subscribes an event to enchant, re-roll, or open a custom station on behalf of §4 (`grep` of `src/enchanting/` for `world.` / `system.` returns nothing);
- `roll.ts` is imported only by tests;
- the C-37 scrubs are unchanged.

**AND** the release notes and the acceptance sheet carry the verdict's claim sentence. §5 bullets 4–6 are marked "rules engine built and statistically proven; not deliverable at the vanilla table on stable Bedrock (C-38)". Nothing claims a full implementation.

**Channel:** `review`, plus the `ipad` acceptance sheet signed by Andrey.
