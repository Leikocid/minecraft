---
type: "concept-rule"
node_id: "L0-orbc-r008"
source_channel: "rollout"
analysis_version: 5
title: "Rule · Contact: charges stop on blocks, never on entities"
aliases: ["L0-orbc-r008"]
is_a: ["rule"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1244
tags: ["is_a:rule", "relates_to:L0-orbc-as03", "relates_to:L0-orbc-p002", "contact"]
level: 2
---
# Rule · Contact: charges stop on blocks, never on entities

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-as03", "L0-orbc-p002", "L0-orbc-ac05", "L0-orbc-ac06"]`

`isContact(block)` is true when all of these hold:
- the block is not air;
- it is not a liquid (water, lava, or a flowing variant);
- it is not in the `PASS_THROUGH` set (`as03`).

The rule:
- **At spawn**, if the spawn cell is a contact block, the charge detonates at once, at that cell (§8, AC-5). This holds even at the clamped ceiling.
- **In flight**, the first contact cell swept (`p002`) is the detonation point. No cell is skipped, whatever the fall speed.
- **Entities never stop a charge.** Collision is 0, physics has no collision, and the sweep never queries entities. Players, mobs, item entities, boats and minecarts are all passed through (AC-6).
- **Liquids never stop a charge.** It sinks through water and lava to the solid floor. That is what lets `ring`'s "underwater = damage only" case (§10) and `pntr`'s "liquids stay" case (§9) occur.
- **Survival-unbreakable blocks** (bedrock and so on) are contact blocks. A charge landing on bedrock detonates there. Whether the effect continues below it is `pntr`'s business (`xasm6`).
