---
type: "concept-architecture-decision"
node_id: "L0-scyt-ad03"
source_channel: "rollout"
analysis_version: 1
title: "ADR-scyt-03 — Trigger on `itemUse` **and** `playerInteractWithBlock`, de-duplicated per player per tick"
aliases: ["L0-scyt-ad03"]
is_a: ["architecture-decision"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1177
tags: ["is_a:architecture-decision", "trigger", "delta:2026-09-26"]
level: 2
---
# ADR-scyt-03 — Trigger on `itemUse` **and** `playerInteractWithBlock`, de-duplicated per player per tick

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-scyt-p001", "L0-lgnd"]`

Status: **implemented** (`registerScytheTargeting`, `claimTick`). It reverses the earlier "itemUse only" proposal.

**Context.** A tap on a block may reach script only as `playerInteractWithBlock`, and a single press may produce both events. The Web Sword already used both.

**Decision.** Subscribe to `world.afterEvents.itemUse` and to `world.afterEvents.playerInteractWithBlock`. The second is used only with `isFirstEvent`, so holding Use against a block does not repeat. Both go to `activate`, which:
1. checks `defForStack(stack)`;
2. claims `(player, system.currentTick)`, so a second event in the same tick is dropped;
3. requires `resolveActivation(player).def === SCYTHE_OF_CALAMITY` (hand priority, cooldown and busy).

**Rejected.** `itemUse` alone. It risks losing presses on blocks. A time-window de-dup is also rejected, because a tick key is exact and resets itself.

**Check:** one press on a block gives one `[andrew] scythe:` log line.
