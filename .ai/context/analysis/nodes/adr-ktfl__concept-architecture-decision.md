---
type: "concept-architecture-decision"
node_id: "L0-adr-ktfl"
source_channel: "rollout"
analysis_version: 6
level: 1
title: "ADR-L0-ktfl · One-shot fall protection"
aliases: ["L0-adr-ktfl"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 600
size_chars: 2796
tags: ["v6", "katana", "status:proposed", "alias:L0-adr-ktfl", "is_a:architecture-decision", "relates_to:L0-katn", "relates_to:L0-xasm20", "see_also:dragonkatanaspecv1ruen-part-2", "see_also:dragonkatanaspecv1ruen-part-3"]
---
---
title: "ADR-L0-ktfl · One-shot fall protection by resetting fall distance just before the landing"
aliases: ["L0-adr-ktfl", "Katana fall ADR"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-xasm20"]
see_also: ["dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3"]
governs_files: ["src/katana/"]
---
# ADR-L0-ktfl · One-shot fall protection

**Status:** proposed (autopilot default). It is subject to a `katn` probe before the build.

## Context
- Katana §7 / T11 / T12: the first landing that follows a teleport deals no fall damage. The next ordinary fall deals normal damage. This must not become standing immunity (C-25).
- Stable 2.10.0 has **no damage before-event**. `entityHurt` is an after-event: it cannot stop a lethal fall.
- A measured engine fact: a player who is teleported carries **no stored fall distance**. So the risk is only the fall that **starts at B**, when B is in the air or above a drop.

## Decision
1. On a successful teleport, set a per-player, in-memory flag `{ until: Date.now() + bound }` (bound: `L0-xasm20`).
   - If B is already supported, the flag is still set. The first `isOnGround` tick consumes it.
2. One `katn`-local watcher interval visits only flagged players (C-5e). It exists only while a flag is armed, following the Orbital precedent; it is not a framework hook (`L0-katn-p002`, reconciled at reduce v6):
   - It consumes the flag on the first tick the player is on the ground, in a liquid, climbing, or gliding, or when they die, change dimension or leave.
   - While the player is falling (`velocity.y < 0`) and the ground is within the look-ahead (`max(2, ceil(|velocity.y|)+1)` blocks, `L0-katn-as04`), it **re-teleports the player to their own current location**, keeping the facing. That resets fall distance, and the landing deals no damage. It clears the flag in the same tick.
3. The flag is never persisted (C-23, C-25). A restart mid-fall drops the protection; that is accepted.

## Rejected alternatives
- **`resistance` amplifier 255 until landing.** It blocks *all* damage, PvP hits included, during the window. That is standing immunity in disguise.
- **`slow_falling` from B.** It changes how the descent looks and plays: a visible float that the spec does not ask for, and an exploitable glide.
- **Heal the damage in `entityHurt`.** A lethal fall kills before the after-event, so it fails T11 at height.
- **Teleport B to the ground below.** That contradicts "a point in the air is a valid destination" (§5).

## Consequences
- The probe must confirm three things on BDS 1.26.51 with a SimulatedPlayer:
  - that a self-teleport mid-fall resets fall distance;
  - the 2-block look-ahead at terminal velocity (about 3.9 blocks per tick). The look-ahead may need to scale with `velocity.y`;
  - that a self-teleport near a ledge does not snag on it.
- If the reset does not hold, `katn` supersedes this ADR. The fallback is `slow_falling` applied only in the last ticks before landing.
