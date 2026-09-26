---
type: "concept-rule"
node_id: "L0-strf-r011"
source_channel: "rollout"
analysis_version: 2
title: "Rule: placed structures are ordinary world. Nothing is protected, nothing is restored."
aliases: ["L0-strf-r011"]
is_a: ["rule"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 735
tags: ["is_a:rule", "C-13", "no-restoration"]
level: 2
---
# Rule: placed structures are ordinary world. Nothing is protected, nothing is restored.

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- After `place`, `strf` never subscribes to block-break, container or explosion events for structure blocks, and never cancels them (§2, C-13).
- No code path writes blocks into a `done` instance's AABB again. The only re-placement is the `planned` resume (`L0-strf-p003`), which by definition happens before init.
- A broken chest drops its contents by vanilla rules (§2). A looted chest stays looted after a restart (§9, test 22).
- Guards killed stay dead (§9, test 58). Converted, cured villagers are ordinary (§9).
- No chat announcements when a structure appears (§8). Debug log only.
