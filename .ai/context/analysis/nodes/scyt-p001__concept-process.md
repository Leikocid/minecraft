---
type: "concept-process"
node_id: "L0-scyt-p001"
source_channel: "rollout"
analysis_version: 5
title: "P-scyt-001 — Activation and target acquisition (as shipped)"
aliases: ["L0-scyt-p001"]
is_a: ["process"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1660
tags: ["is_a:process", "targeting", "activation", "delta:2026-09-26"]
level: 2
---
# P-scyt-001 — Activation and target acquisition (as shipped)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["process"]` · `relates_to: ["L0-scyt-ad01", "L0-scyt-ad02", "L0-scyt-ad03", "L0-scyt-r001", "L0-scyt-r002", "L0-scyt-r003", "L0-lgnd"]`

Code: `registerScytheTargeting` → `activate` → `selectTarget` → `onTarget` (`registerScytheVolley`).

1. **Trigger** (`L0-scyt-ad03`): `itemUse`, or `playerInteractWithBlock` with `isFirstEvent`. The source must be a Player.
2. **Item check:** `defForStack(stack)` must be a legendary. **De-dup:** `claimTick(player)`.
3. **Dispatch:** `resolveActivation(player)?.def === SCYTHE_OF_CALAMITY`, otherwise return silently. That covers another hand winning, cooldown and busy, and the HUD shows the state.
4. **Gather** (`L0-scyt-ad01`): all valid players, plus entities with health within 20 blocks of the owner.
5. **Build candidates:** `{id, location, dimensionId, hidden (players only), isPlayer}`.
6. **Pick** (`L0-scyt-r001`/`r002`): filter, sort by tier then distance, and walk nearest first with a lazy LOS check (`L0-scyt-ad02`) inside the ε 0.5 window. Gaze decides among the tied candidates.
7. **Log:** `[andrew] scythe: <owner> targets <typeId> <nameTag> at x,y,z`, or `no target for …`.
8. **Miss** (`L0-scyt-r003`): the action bar shows `andrew.scythe.no_target`. No cooldown, no busy.
9. **Hit:** `launchVolley(owner, target)` (`L0-scyt-p002`).

**Notes:**
- Steps 4–6 run once per press. There is no tick scan (C-5).
- A Creative or Spectator owner is **not** blocked here. Whether they can press depends on the engine: a spectator cannot use items.
- Two owners may lock the same target independently.
