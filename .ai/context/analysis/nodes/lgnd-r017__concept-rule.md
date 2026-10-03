---
type: "concept-rule"
node_id: "L0-lgnd-r017"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-lgnd-r017"]
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 600
size_chars: 1980
tags: ["v6", "katana", "recovery"]
level: 2
---
---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-katn", "L0-lgnd-p003", "L0-lgnd-ad12", "L0-lgnd-ac24", "L0-adr-ktob"]
---
**R-lgnd-017: A wielder teleport is not a loss event, and every Katana teleport stays in the player's own dimension.**

**1. Recovery sees nothing.** The framework's loss triggers are:
- (a) a watched `minecraft:item` entity removed or below the floor;
- (b) a departure from a player slot within ±2 ticks of a `DropItem` swing (`inFlight`);
- (c) a `VOID_HOLDER_TYPES` entity removed below the floor.

`player.teleport` moves the player and the stacks the player holds. It spawns no item entity, raises no `playerInventoryItemChange` and no `DropItem` swing, and removes no minecart. So a Katana activation can trip none of them. This holds even when the teleport is used to escape a Web Sword trap or the magnet's hold (`L0-xasm21`).

**2. Ground items left behind.** If the player teleports away and a watched item's chunk unloads, `recovery.ts:326` logs "unloaded with its chunk" and `entityLoad` re-watches the item. It is **never** returned. The same is true when a player walks away.

**3. Same dimension only.**
- The Katana calls `player.teleport(location, { facingLocation | rotation })` **without** the `dimension` option.
- Every cell it reads uses `player.dimension`.
- An unloaded or out-of-range cell counts as solid (C-12, C-24). A destination in an unloaded chunk is never attempted; the trace stops before it.
- No framework call the Katana makes takes a second dimension. `protectLegendariesIn` is not called at all, because the teleport removes no blocks (`r013` applies only to block-removing effects, and T10 says nothing is destroyed).

**4. Death after a teleport** (into lava, or a fall the one-shot flag does not cover) goes through cause-agnostic retention (`r008`, `ac22` precedent).

**Violation signal.** A `[andrew] legendary recovery: … lost` or `returned` log line during a Katana GameTest where no item was dropped.
