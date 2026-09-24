---
type: "concept-rule"
node_id: "L0-sprj-r008"
source_channel: "rollout"
analysis_version: 1
title: "R-sprj-008 — Precedence within one tick"
aliases: ["L0-sprj-r008"]
is_a: ["rule"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 944
tags: ["is_a:rule", "ordering", "fsm"]
level: 2
---
# R-sprj-008 — Precedence within one tick

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj-p002", "L0-sprj-r004", "L0-sprj-r005"]`

**Rule:** within one tick, each volley is evaluated in this order:
1. invalidation marks from events;
2. the validity re-check;
3. projectile movement and **hits**;
4. the **leash**;
5. completion or expiry.

**Consequences:**
- If a projectile reaches the target in the same tick the target crosses 20 blocks, the hit counts, so the outcome is `ESCAPED_AFTER_HIT` with a cooldown. The player on the receiving end is not denied a hit that visibly landed.
- A target that logs out in the same tick a projectile would have hit takes no damage. The volley resolves on `hits` as it stood before that tick.
- The owner's own launch can carry the target out of the leash (`L0-sprj-as02`). That happens only after a hit, so it always resolves with a cooldown, which is consistent with §5.
