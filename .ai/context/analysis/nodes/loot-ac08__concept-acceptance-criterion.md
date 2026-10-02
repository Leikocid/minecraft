---
type: "concept-acceptance-criterion"
node_id: "L0-loot-ac08"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-loot-ac08"]
is_a: ["acceptance-criterion"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 281
tags: ["is_a:acceptance-criterion", "relates_to:L0-loot-r006", "source:spec-section2-3-13.6-13.7-15"]
level: 2
---
GIVEN any structure chest (custom or vanilla path) whose contents have already been rolled, WHEN the chest is reopened, the chunk is unloaded/reloaded, or the server restarts, THEN its contents are unchanged — no re-roll, no refill.

Source: spec §2, §3 preamble, §13.6/§13.7, §15.
