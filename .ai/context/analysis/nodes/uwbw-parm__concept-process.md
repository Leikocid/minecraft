---
type: "concept-process"
node_id: "L0-uwbw-parm"
source_channel: "rollout"
analysis_version: 10
title: "P-uwbw-arm · Arming the charge and the HUD"
aliases: ["L0-uwbw-parm"]
is_a: ["process"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 1372
tags: ["v10", "underwater-bow", "arming", "hud", "process"]
level: 2
---
# P-uwbw-arm · Arming the charge and the HUD

**Links.** relates_to: L0-xcx33, L0-xasm38, L0-lgnd, L0-uwbw-earm, L0-uwbw-cons.

1. **Gesture.** `world.beforeEvents.itemUse` fires for `andrew:underwater_bow` while `player.isSneaking` is true. The hands are read live, in the before-event, so modules cannot double-fire.
2. **Gate.** This step reads `ub:armed` and the cooldown. Arming during the cooldown is refused, with an action-bar hint showing the seconds left; the draw goes on. Arming while already armed does nothing.
3. **Arm.** On the next tick (`system.run`; the before-event may not write), set `ub:armed` = true and play a short sound. The draw is never cancelled, so sneak-draw-release both arms and fires the armed arrow.
4. **HUD.** The legendary HUD loop renders the state from `L0-uwbw-earm` while the bow is held: `hudKeys.ready`, `hudKeys.armed`, or `hudKeys.cooldown` with the seconds.
5. **Cooldown end.** The cooldown expires on its own. The HUD returns to ready, and nothing re-arms automatically.

**Not done.** The bow does **not** claim Use through `resolveActivation`. Doing so would start the cooldown at activation (`src/legendary/cooldown.ts`) and would block the shot. It calls `startCooldown` only from the hit (`L0-uwbw-phit`).

**Creative.** A Creative copy arms and fires the same way; the legendary rules on copies are unchanged (lgnd).
