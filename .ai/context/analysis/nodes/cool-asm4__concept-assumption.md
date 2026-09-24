---
type: "concept-assumption"
node_id: "cool-asm4"
source_channel: "rollout"
analysis_version: 1
title: "A-4 · True damage and 10-block launch are implemented with stable APIs by health manipulation + vertical impulse"
aliases: ["cool-asm4"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 873
tags: ["CAN_ASSUME", "scythe", "title:True damage and launch mechanism"]
---
# A-4 · True damage and 10-block launch are implemented with stable APIs by health manipulation + vertical impulse

**Gap.** Scythe §4/§7 require exactly 3 HP ignoring armor/Protection and ~10-block vertical launch, leaving the mechanism to "the available API".

**Assumption (CAN_ASSUME).** True damage = reduce the `minecraft:health` component by 3 directly (with a non-armor damage cause for the hurt feedback and correct kill attribution when HP reaches 0); launch = `applyKnockback` / `applyImpulse` with a vertical strength tuned empirically on BDS to reach ≈10 blocks (±2). Fall damage is left to vanilla.

**Impact if wrong.** Direct health writes may bypass totems, death messages or kill credit; if the operator expects kill credit to the Scythe owner or totem interaction, the mechanism must change. Launch height varies with Jump Boost/levitation/slow-falling.
