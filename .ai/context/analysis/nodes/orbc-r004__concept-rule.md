---
type: "concept-rule"
node_id: "L0-orbc-r004"
source_channel: "rollout"
analysis_version: 3
title: "Rule · With no target, nothing happens"
aliases: ["L0-orbc-r004"]
is_a: ["rule"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 608
tags: ["is_a:rule", "relates_to:L0-orbc-p001", "relates_to:L0-orbc-ac03"]
level: 2
---
# Rule · With no target, nothing happens

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-p001", "L0-orbc-ac03"]`

When the target resolution in `p001` step 5 returns nothing:
- no charge is spawned;
- no cooldown is written, so `andrew:cd_orbital_cannon` is unchanged;
- no chat message, Action Bar override, title or sound is shown;
- the dedup tick is **not** consumed, so a second event in the same tick may still succeed.

This differs deliberately from the Scythe, which says `andrew.scythe.no_target`. The Cannon has no `no_target` lang key.

Source: Orbital §6 and AC-3.
