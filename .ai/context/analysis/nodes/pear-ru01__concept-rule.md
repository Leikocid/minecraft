---
type: "concept-rule"
node_id: "L0-pear-ru01"
source_channel: "rollout"
analysis_version: 11
title: "Rule: a binding is honoured only for its living binder, and is cleared only by success or a dead plate"
aliases: ["L0-pear-ru01"]
is_a: ["rule"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 1689
tags: ["v11", "pearl-rod", "rule", "ownership", "C-45"]
level: 2
---
# Rule: a binding is honoured only for its living binder, and is cleared only by success or a dead plate

**Is a:** rule. **Part of:** L0-pear. **Relates to:** L0-xasm42, C-44, C-45, L0-pear-pr03.

1. **Who may use the binding.** It is honoured only when `pr_owner === user.id` **and** `pr_epoch === user's current andrew:life_epoch`. For any other holder the rod is unbound, and a use is a vanilla cast, which may then bind it afresh and overwrite the record. Spec: «Передача/выбрасывание не дают другому игроку права…».
2. **Death.** Every player death increments the epoch, so every binding that player made is void wherever the rod is. That holds even if the same player picks the rod up again after respawning. Spec: «При смерти привязавшего игрока все его активные привязки… сбрасываются».
3. **Clears the binding:**
   - a successful teleport with a matching read-back;
   - the plate typeId differs from the record, or is no longer a plate;
   - the plate generation differs;
   - a new binding (overwrite).
4. **Keeps the binding (and reports):**
   - the preload timed out (200 ticks);
   - the ticking-area budget is exhausted;
   - another dimension was refused;
   - no safe spot;
   - the read-back mismatched;
   - the rod left the inventory mid-wait.
5. **One trip per binding.** After a success, the next use is a vanilla cast (§8).
6. **No queueing.** A use while a teleport is pending is cancelled with a message.
7. **Every outcome sends the player a specific message**, except death. No outcome reports success without the read-back (C-44).

**Rationale:** spec §7 and §8; outcome table `xasm42`; C-44 and C-45. Negative controls in `L0-pear-ac03` and `L0-pear-ac04`.
