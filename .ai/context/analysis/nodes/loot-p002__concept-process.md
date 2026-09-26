---
type: "concept-process"
node_id: "L0-loot-p002"
source_channel: "rollout"
analysis_version: 2
title: "P-loot-002 · Vanilla loot-table application (Mini Warden City & Mini Bastion)"
aliases: ["L0-loot-p002"]
is_a: ["process"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 1339
tags: ["is_a:process", "relates_to:L0-strf", "relates_to:L0-wrdn", "relates_to:L0-bast"]
level: 2
---
# P-loot-002 · Vanilla loot-table application (Mini Warden City & Mini Bastion)

**Trigger:** strf's post-place init hook, once per Warden City/Bastion chest.

**Steps:**
1. Determine the chest's vanilla table id from its role, fixed by structure/position (owned by `wrdn`/`bast`, not rolled here):
   - Mini Warden City, all 10 chests → `chests/ancient_city`.
   - Mini Bastion, 3 central chests → `chests/bastion_treasure`.
   - Mini Bastion, 7 outer chests → `chests/bastion_other`.
2. Invoke the vanilla loot table against the chest position, unmodified — full vanilla category/quantity/rarity distribution applies, including rare drops the custom table never produces (Enchanted Golden Apple, Swift Sneak books, etc. — normal for `ancient_city`).
3. No post-processing: no golden-apple cap, no curse filter, no material-split override. Those are exclusive to `L0-loot-p001`.

**Open implementation question (`L0-loot-asm2`):** the stable-API mechanism for step 2 (most likely `Dimension.runCommand("loot insert ...")`) is pending confirmation by the `strf` probe (L0 decomposition plan v2, reduce section: "is `/loot insert` with vanilla chest tables available through `runCommand`"). This process assumes the command path; if the probe finds it unavailable, `p002` needs a different stable mechanism and this process must be revised.
