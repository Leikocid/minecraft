---
type: "concept-assumption"
node_id: "L0-orbc-as06"
source_channel: "rollout"
analysis_version: 3
title: "ASM-orbc-06 · A press during cooldown is silent"
aliases: ["L0-orbc-as06"]
is_a: ["assumption"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 552
tags: ["is_a:assumption", "CAN_ASSUME", "relates_to:L0-orbc-r005"]
level: 2
---
# ASM-orbc-06 · A press during cooldown is silent

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-r005", "L0-orbc-r004"]`

**Gap.** §6 says only "a repeated press does not create a charge" during cooldown.

**Assumption.** A press during cooldown gives no message, sound or flash. The Action Bar countdown (`r012`) is the only feedback, and it is always visible while the Cannon is held.

**Impact if wrong.** If a "not ready" cue is wanted, add one lang key and a player-only `playSound`. There is no state change.
