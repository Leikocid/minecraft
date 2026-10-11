---
type: "concept-process"
node_id: "L0-trdt-pmov"
source_channel: "rollout"
analysis_version: 9
title: "Process · Release decision, dash, fall grant, swim boost"
aliases: ["L0-trdt-pmov"]
is_a: ["process"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 2025
tags: ["above-water-trident", "dash", "fall", "swim", "C-35", "C-36"]
level: 2
---
# Process · Release decision, dash, fall grant, swim boost

**Links.** is_a: process. relates_to: L0-adr-twrp, L0-xcx28, L0-xq9, L0-xasm36, L0-xasm37, L0-katn.

## Release decision
`itemReleaseUse` for `andrew:above_water_trident` (main hand or off hand):
- charge = max use duration − `useDuration` remaining;
- charge < 10 ticks: nothing happens;
- `player.isSneaking` read at release: true → dash; false → throw (`L0-trdt-pthr`).

Probe P3 confirms that the event and the charge arrive from iPad touch, and that `isSneaking` reads true when the sneak toggle is held at release.

## Dash
- `applyKnockback({x: v.x·H, z: v.z·H}, v.y·V)` along the full view vector, including upward.
- H and V are calibrated by probe P4 to a vanilla Riptide III launch distance ± 20 %.
- Plays `item.trident.riptide_3`.
- No cooldown, no water or weather check, works in every dimension.
- Sets the fall grant.

## Fall grant (C-35, `xasm36`)
- A per-player in-memory record `{ until: now + 10 s }`. A second dash refreshes it; grants do not stack.
- In `beforeEvents.entityHurt`, when the cause is `fall` and the hurt entity has a live grant: `cancel = true` and consume the grant.
- A ground, water, ladder or slime contact without damage also consumes it. This is checked in the shared interval, starting from the first tick after the player has been airborne for ≥ 2 ticks (`isOnGround` lags a teleport by 2 ticks).
- Expiry clears it.
- **Fallback if probe P5 fails** (cancel ignored for fall): reuse `src/katana/fall.ts` (self-teleport resets the stored fall). The katana fall scenarios then join the gate.

## Swim boost (C-36, `xasm37`)
- In the shared interval, for each player whose main hand or off hand `isItemOf(TRIDENT)`, who is `isInWater` and swimming or moving:
  - add a forward horizontal impulse along the view direction to reach 5.6 b/s;
  - cap it, never above target + 15 %.
- Nothing is applied when the trident is not held, so the boost is gone on the next tick after a switch, drop or throw.
- No effects are used.
