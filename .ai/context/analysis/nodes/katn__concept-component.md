---
type: "concept-component"
node_id: "L0-katn"
source_channel: "rollout"
analysis_version: 6
title: "Dragon Katana (`andrew:dragon_katana`)"
aliases: ["L0-katn"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 600
size_chars: 3941
tags: ["component", "katana", "legendary", "teleport", "v6", "is_a:component", "relates_to:L0-lgnd", "relates_to:L0-webs", "relates_to:L0-scyt", "relates_to:L0-magn", "relates_to:L0-adr-ktob", "relates_to:L0-adr-ktfl"]
level: 1
---
---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-lgnd-p001", "L0-lgnd-p002", "L0-lgnd-p003", "L0-lgnd-p004", "L0-lgnd-p005", "L0-lgnd-p008", "L0-webs", "L0-scyt", "L0-magn", "L0-adr-ktob", "L0-adr-ktfl", "L0-xasm18", "L0-xasm19", "L0-xasm20", "L0-xasm21", "L0-xasm22", "L0-xcx21"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3"]
governs_files: ["src/katana/", "packs/behavior/items/dragon_katana.json", "packs/behavior/recipes/dragon_katana*.json", "packs/resource/texts/*.lang"]
---
# Dragon Katana (`andrew:dragon_katana`)

**Responsibility.** This component owns what is unique to the fourth legendary weapon:
- the item and recipe identity (`L0-katn-ent1`, `L0-katn-r001`);
- the teleport ability body: trace → safe cell → teleport → cooldown (`L0-katn-p001`, rules `r002`–`r005`);
- the one-shot fall flag (`L0-katn-p002`, `L0-katn-ent2`, `r006`);
- the cherry-petal trail (`L0-katn-r007`);
- the Katana HUD strings (`L0-katn-r008`);
- the GameTests for T04–T15 and the Katana call sites of T01–T03 and T16–T18.

It is the Katana's counterpart to `L0-webs` (trap body) and `L0-sprj`/`L0-scyt` (volley body). All four plug into `L0-lgnd`.

**Not owned here (cite `lgnd`, do not restate).**
- One Survival craft per world, the persistent flag, refund, Creative and `/give` copies, first-craft broadcast: `L0-lgnd-p001`.
- Death retention, and a contained item left alone: `L0-lgnd-p002`.
- Void, offline and owed return: `L0-lgnd-p003`.
- Orbital blast and ring protection: `L0-lgnd-p008`.
- Hand priority (main hand first, then a ready off hand): `L0-lgnd-p004`, through the shipped `resolveActivation` (`src/legendary/hands.ts:35`).
- The cooldown clock (`startCooldown`, epoch ms, `src/legendary/cooldown.ts:47`) and the shared HUD pass: `L0-lgnd-p005`.
- The T17 reading under C-16: `L0-xcx21`, `L0-xasm22`.

**What `katn` adds to the framework.** Def #4 in `LEGENDARIES` with `hudKeys` set: the def field already exists and the Orbital Cannon uses it. Nothing else. If a probe shows a framework hook is needed, that is an L0 contradiction, not a local patch (plan §"lgnd answers first").

**Inputs.**
- `world.afterEvents.itemUse`, plus `playerInteractWithBlock` for the same press, de-duplicated as in `src/websword/trap.ts`.
- The server-side `player.getHeadLocation()` and `getViewDirection()`.
- Block state along the segment.

**Outputs.**
- One `player.teleport(B, { keepVelocity: false, rotation kept })` in the same dimension.
- `startCooldown(player, "dragon_katana")`.
- An in-memory fall flag.
- A bounded burst of pink petal particles A→B.
- No block edits, no damage and no entities.

**Core flow** (`L0-katn-p001`): resolve → trace (`L0-adr-ktob`, refined by `L0-katn-ad01`) → endpoint (`L0-xasm18`, `L0-katn-as01`) → safe-cell search (`L0-xasm19`, `L0-katn-r004`) → teleport → cooldown → fall flag → trail. Any refusal leaves no state: no teleport, no cooldown, no message.

**Constraints honoured.**
- C-24: server-authoritative, ≤ 20, unreadable = solid, no block edits.
- C-25: the fall flag is one-shot, bounded and not persisted.
- C-5e: a one-shot trail; the watcher costs nothing while no flag is set.
- C-21: epoch-ms clocks.
- C-16: closest stable behaviour, deviations documented.

**Open items.**
- `L0-katn-cx01`: resolved at reduce v6 by amending `L0-adr-ktob` §3 (fits ≠ safe).
- `L0-katn-as01` … `as04`: endpoint geometry, aim source on iPad, hazards, the fall look-ahead.

**Probe first** (before any build task): (1) a self-teleport mid-fall resets fall distance (`L0-adr-ktfl`); (2) the ray flags: liquids skipped, cobweb/grass/carpet passable, slabs and fences hit; (3) `getBlockFromRay` behaviour at an unloaded chunk; (4) `minecraft:cherry_leaves_particle` via `spawnParticle` renders on iPad.

**Channels.** `bds`: T01–T18 as GameTests (`L0-katn-ac01` … `ac08`). `ipad`: trail, HUD, icon, Creative placement, aim feel (`L0-katn-ac09`).
