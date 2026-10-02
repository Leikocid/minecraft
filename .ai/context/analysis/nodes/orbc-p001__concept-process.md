---
type: "concept-process"
node_id: "L0-orbc-p001"
source_channel: "rollout"
analysis_version: 5
title: "Process · Activation (input → target → gate → lock → spawn)"
aliases: ["L0-orbc-p001"]
is_a: ["process"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 2041
tags: ["is_a:process", "relates_to:L0-orbc-r003", "relates_to:L0-orbc-r004", "relates_to:L0-orbc-r005", "relates_to:L0-orbc-r006", "relates_to:L0-orbc-ad01", "relates_to:L0-adr-orbc"]
level: 2
---
# Process · Activation (input → target → gate → lock → spawn)

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["process"]` · `relates_to: ["L0-orbc-r003", "L0-orbc-r004", "L0-orbc-r005", "L0-orbc-r006", "L0-orbc-ad01", "L0-adr-orbc"]`

1. **Input.**
   - RMB: `itemUse`, `itemUseOn` or `playerInteractWithBlock`.
   - LMB: `entityHitBlock` where the damager is a `Player`.
   - In `beforeEvents.playerBreakBlock`, cancel the break when the main hand holds the Cannon (`as05`).
2. **Hand.** `resolveActivation(player, mode)` (`lgnd` `hands.ts`, main then off). If the result is not the Cannon, stop.
3. **Dedup.** If `lastActivationTick[player.id] === system.currentTick`, stop silently. This covers both RMB events, and LMB+RMB in one touch gesture (`r006`).
4. **Cooldown.** If `!isReady(player, "orbital_cannon")`, stop silently. No charge, no sound, no message (`as06`).
5. **Target.** Resolve by `ad01`:
   - Use the event block when the event supplies one and it is within 10 blocks.
   - Otherwise use `player.getBlockFromViewDirection({maxDistance: 10, includeLiquidBlocks: false, includePassableBlocks: false})`.

   If no block is found, **stop silently and start no cooldown** (`r004`, AC-3).
6. **Lock.** Copy `block.location` into `target`, and copy the `dimensionId`. The player is never read again for aim (`ent2`).
7. **Commit, all in this tick.**
   - `startCooldown(player, "orbital_cannon")`. This is the "successful activation" point (`xasm10`, C-17).
   - Set `lastActivationTick`.
   - Compute `spawnY` (`r007`).
   - Ask the effect for charge columns: LMB is `[target.xz]`; RMB is `ring.layout(target)`.
   - Spawn all charges (`p002`).
   - Register the attack with the job.
8. **Fail-safe.** If spawning throws, the cooldown stays (C-17: never refunded). The error is logged with `console.warn`. No partial attack is left registered.

**Concurrency.** Two players activating in the same tick make two independent attacks. There is no shared lock beyond the per-player cooldown. Each attack's state is keyed by `attackId`.
