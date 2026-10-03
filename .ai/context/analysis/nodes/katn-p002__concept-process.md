---
type: "concept-process"
node_id: "L0-katn-p002"
source_channel: "rollout"
analysis_version: 6
title: "P-katn-002: One-shot fall protection"
aliases: ["L0-katn-p002"]
is_a: ["process"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 1869
tags: ["process", "katana", "fall-damage", "is_a:process", "relates_to:L0-adr-ktfl", "relates_to:L0-xasm20"]
level: 2
---
---
title: "P-katn-002: One-shot fall protection (arm, watch, consume)"
is_a: ["process"]
part_of: ["L0-katn"]
relates_to: ["L0-adr-ktfl", "L0-xasm20", "L0-katn-ent2", "L0-katn-r006", "L0-katn-as04", "L0-katn-ac05"]
see_also: ["dragonkatanaspecv1ruen-part-2"]
---
# P-katn-002: One-shot fall protection

This implements `L0-adr-ktfl`. It is subject to probe (1). Engine fact: a teleported player carries no stored fall distance, so only the drop that **starts at B** matters.

1. **Arm.** After a successful teleport, `flags.set(player.id, { until: Date.now() + 10_000, dimId })` (`L0-xasm20`). A new teleport replaces the entry; flags never stack.
2. **Watch.** A module-local `system.runInterval(tickFallFlags, 1)`, created on the first `armFallFlag` (`handle ??= …`) and cleared when `flags` empties. This follows the Orbital precedent (`src/orbital/penetrator.ts:615`). As read during reduce at v6, the pack had no pack-wide tick hub to join, and none is added: the watcher is `katn`-local, not a framework hook. It costs nothing while no flag is armed (C-5e). For each entry:
   - player gone or invalid, dead, `dimension.id !== dimId`, or `Date.now() > until` → delete;
   - `isOnGround`, `isInWater`, in lava, `isClimbing`, `isGliding` → delete (the first qualifying landing);
   - `velocity.y < 0` and the first solid block below the feet (`getBlockFromRay` down, `L0-katn-ad01` flags) is within `lookAhead = max(2, ceil(|velocity.y|) + 1)` blocks (`L0-katn-as04`) → `player.teleport(player.location, { rotation: player.getRotation() })`, then delete. The self-teleport resets fall distance, so the landing deals no damage.
3. **Restart.** `flags` is a module `Map`, never a dynamic property (C-23, C-25). A script reload mid-fall drops the protection. That is accepted.
4. **Fallback if probe (1) fails.** Supersede `L0-adr-ktfl` with a `katn` ADR: apply `slow_falling` for 1 tick-window in the same look-ahead tick instead of the self-teleport. Same arm and consume rules.

**Never.** No `resistance` effect, and no `entityHurt` heal (rejected in `L0-adr-ktfl`). Nothing reads the flag except this watcher.
