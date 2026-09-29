---
type: "concept-rule"
node_id: "L0-orbc-r009"
source_channel: "rollout"
analysis_version: 3
title: "Rule · The Void destroys a charge without effect"
aliases: ["L0-orbc-r009"]
is_a: ["rule"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 592
tags: ["is_a:rule", "relates_to:L0-orbc-p002", "void"]
level: 2
---
# Rule · The Void destroys a charge without effect

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-p002", "L0-orbc-r005", "L0-orbc-ac07"]`

- A charge whose next Y is below `dim.heightRange.min` without meeting a contact cell is removed. For example, the End outer islands, or a column already cut to bedrock-less air by an earlier LMB.
- It gets **no** `onDetonate`, no sound and no particle.
- The attack's cooldown stays (§8).
- This is the *charge* Void rule. The Void rule for the *item* (return to the last holder) is `lgnd`'s (`L0-xcx11`, `L0-adr-hold`).
