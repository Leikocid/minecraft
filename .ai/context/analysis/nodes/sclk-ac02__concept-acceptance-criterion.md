---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac02"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 495
tags: ["acceptance-criterion", "T02", "bds", "lgnd-callsite", "restart"]
level: 2
---
**AC-sclk-02 (T02) · A repeat craft is blocked after a restart** · channel `bds` · the rule is in `lgnd`

GIVEN the `sk` flag was set (ac01) and the BDS was restarted, WHEN the recipe is crafted again in Survival,
THEN:
- no crossbow is produced;
- the token is swapped for the refund (echo shard ×2, deepslate ×2, crossbow ×1);
- the localized `craft_blocked` message is shown.

The proof uses the restart harness: SimulatedPlayers do not survive a restart, so a fresh one is spawned after it.
