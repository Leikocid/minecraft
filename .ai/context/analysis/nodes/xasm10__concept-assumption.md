---
type: "concept-assumption"
node_id: "L0-xasm10"
source_channel: "rollout"
analysis_version: 3
title: "ASM-L0-10 · Mobile LMB/RMB mapping and \"successful activation\""
aliases: ["L0-xasm10"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0", "L0-orbc", "L0-xcx8"]
see_also: ["orbitalcannonspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-2", "orbitalcannonspecv1ruen-part-3", "orbitalcannonspecv1ruen-part-4"]
priority: 540
size_chars: 919
tags: ["title:ASM-L0-10 · Mobile LMB/RMB mapping and \"successful activation\"", "alias:L0-xasm10", "is_a:assumption", "relates_to:L0", "relates_to:L0-orbc", "relates_to:L0-xcx8", "see_also:orbitalcannonspecv1ruen-part-1", "see_also:orbitalcannonspecv1ruen-part-2", "see_also:orbitalcannonspecv1ruen-part-3", "see_also:orbitalcannonspecv1ruen-part-4", "CAN_ASSUME"]
level: 1
---
# ASM-L0-10 · Mobile LMB/RMB mapping and "successful activation"

**Gap.** Orbital §6 asks for "the closest stable equivalent on mobile" and says the cooldown starts on "successful activation".

**Assumption (CAN_ASSUME).**
- On iPad touch (the default "tap to interact" scheme), **tap on a block = Use (RMB)** and **hold on a block = Attack/break start (LMB)**. The `entityHitBlock` event fires at the start of the hold.
- "Successful activation" means a valid target was found and the charges were spawned. The cooldown and target lock are written in the same tick as the spawn, before any charge moves.

**Impact if wrong.**
- If the iPad's tap fires both a hit and a use in one gesture, one activation must win per tick. The rule: the first event that tick consumes the cooldown, and the second is a no-op.
- If "successful" means "hit something", AC-16 changes. The spec says otherwise (§6: "not after the hit").
