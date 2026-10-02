---
type: "concept-glossary-term"
node_id: "L0-loot-gl05"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-loot-gl05"]
is_a: ["glossary-term"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 292
tags: ["is_a:glossary-term"]
level: 2
---
**One-Time Fill**

The persistence contract shared by both loot mechanisms (`L0-loot-r006`): a chest's contents are decided exactly once, at structure post-place init, and frozen thereafter regardless of reopen/restart/chunk reload. Enforced by `strf`'s instance registry, not by loot itself.
