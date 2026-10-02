---
type: "concept-process"
node_id: "L0-loot-p001"
source_channel: "rollout"
analysis_version: 5
title: "P-loot-001 · Custom weighted-table chest fill (Windmill & Airship)"
aliases: ["L0-loot-p001"]
is_a: ["process"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 1488
tags: ["is_a:process", "relates_to:L0-strf", "relates_to:L0-wind", "relates_to:L0-airs"]
level: 2
---
# P-loot-001 · Custom weighted-table chest fill (Windmill & Airship)

**Trigger:** strf's post-place init hook, once per Windmill/Airship chest (`L0-adr-strc` step 5).

**Steps:**
1. Draw attempt count `N` uniformly from [5, 12] inclusive, once per chest.
2. For `i` in 1..N: run one attempt.
   a. Build the candidate weight pool from the 13 categories in `L0-loot-e001`. If Golden Apple already succeeded once in this chest, drop it from the pool for the remainder (see `L0-loot-asm1`).
   b. Draw one category by relative weight — cumulative-weight roll (`L0-loot-adr1`) — or draw "no category" if the implementation treats an exhausted slot as a no-op; either is acceptable per `L0-loot-asm1`.
   c. If a category was drawn, resolve it to one item stack: roll quantity in its range; for equipment categories, roll material (80% iron / 20% diamond, `L0-loot-r004`), roll a random armor slot (armor categories only), and for "Enchanted" categories roll compatible non-curse enchantments up to vanilla max level (`L0-loot-r005`).
   d. Place the resulting stack into the chest's container (stacking with existing compatible stacks per normal inventory rules).
3. After all N attempts, the chest is complete; no further calls touch this chest (`L0-loot-r006`).

**Note on independence:** attempts do not read each other's output except for the Golden-Apple-once constraint (step 2a) — every other category, including Diamonds and duplicate armor pieces, may repeat freely across attempts.
