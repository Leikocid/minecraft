---
type: "concept-assumption"
node_id: "L0-sauc-as03"
source_channel: "rollout"
analysis_version: 5
title: "AS-sauc-3 · The shooter's name is resolved from `attack.ownerId` at the shot; `Attack` gains an optional `ownerName`"
aliases: ["L0-sauc-as03"]
is_a: ["assumption"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 966
tags: ["is_a:assumption", "CAN_ASSUME", "broadcast", "orbc-seam", "relates_to:L0-sauc-r004", "relates_to:L0-adr-ufoi"]
level: 2
---
# AS-sauc-3 · The shooter's name is resolved from `attack.ownerId` at the shot; `Attack` gains an optional `ownerName`

**Assumption.**
- The shipped `Attack` (`src/orbital/flight.ts:24-34`) carries `ownerId` only, and `L0-adr-ufoi` §6 passes only that.
- The charge is at most ~3 s old when it crosses the hull, since it spawns 60 above the target and falls 1 block per tick. The owner is therefore almost always online.
- `sauc` resolves the name from `world.getAllPlayers()`, filtering out `undefined` (C-22).
- To cover a disconnect in that window, the seam adds an **optional** `ownerName` to `Attack`, filled at launch from `player.name`. This is additive and unused by `pntr`/`ring`. The broadcast uses the live name, then `ownerName`, then the literal `"?"`.

**Impact if wrong.**
- If adding a field to `Attack` is refused, a shooter who logs out within ~3 s is broadcast as "?".
- This is cosmetic. No AC exercises it beyond C-20′'s "the shooter is named".
