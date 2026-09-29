---
type: "concept-assumption"
node_id: "L0-orbc-as05"
source_channel: "rollout"
analysis_version: 3
title: "ASM-orbc-05 · Blocks stay unbreakable while the Cannon is in the main hand"
aliases: ["L0-orbc-as05"]
is_a: ["assumption"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 813
tags: ["is_a:assumption", "CAN_ASSUME", "relates_to:L0-orbc-p001", "input"]
level: 2
---
# ASM-orbc-05 · Blocks stay unbreakable while the Cannon is in the main hand

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-p001", "L0-adr-orbc"]`

**Gap.** `L0-adr-orbc` cancels `playerBreakBlock` so that Creative LMB does not break the target. It does not say what happens in Survival or during cooldown.

**Assumption.** `beforeEvents.playerBreakBlock` is cancelled whenever the main hand holds `andrew:orbital_cannon`, in every game mode, during cooldown or not. LMB is purely a weapon: a Survival hold never mines the targeted block, and players cannot mine with the Cannon.

**Impact if wrong.** If mining with the Cannon is expected, drop the cancel in Survival. It is a one-line change. The risk is that a Survival hold mines the block in the same gesture that fires.
