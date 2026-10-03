---
type: "concept-constraint"
node_id: "L0"
source_channel: "rollout"
analysis_version: 6
level: 0
title: "Global Constraints"
aliases: ["L0"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 600
size_chars: 2307
tags: ["v6", "title:Global Constraints", "alias:L0-constraint", "is_a:constraint", "relates_to:L0", "see_also:dragonkatanaspecv1ruen-part-2", "see_also:dragonkatanaspecv1ruen-part-3", "see_also:constraints", "supersedes:L0-constraint@v4"]
---
---
title: "Global Constraints"
aliases: ["L0-constraint", "Constraints"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0", "L0-adr-ktob", "L0-adr-ktfl", "L0-katn"]
see_also: ["constraints", "dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3", "ufomagnetspecv1ruen-part-4"]
supersedes: ["L0-constraint@v4"]
---
# Global Constraints

**Carried unchanged:**
- C-1 … C-14 (v2);
- C-5a′ and C-15 … C-20 (v3);
- C-5d, C-7″, C-12′ and C-21 … C-23 (v4).

All of them bind the Katana. The ones it leans on most:
- C-2: stable 2.10.0, no Experiments.
- C-7: no duplication. The craft gate and protection come from `lgnd`.
- C-12: never write into unloaded chunks. An unreadable trace cell is a blocker.
- C-15: the priority order.
- C-16: closest stable equivalent, documented.
- C-21: the cooldown is in epoch ms.
- C-22: filter out `undefined` players.

v6 adds:

| ID | Constraint | Source |
|---|---|---|
| C-24 | *(new)* **Wielder movement is server-authoritative and conservative.** The destination is computed only by the script from the server-side head location and view direction at activation, and capped at 20 blocks. The player is never placed in a cell the obstacle predicate (`L0-adr-ktob`) calls solid. Nothing is placed into a cell that cannot be read (unloaded chunk or outside the height range): such a cell counts as solid. A movement ability never edits blocks. | Katana §5, §6, §11, §14 |
| C-25 | *(new)* **Protective flags are one-shot and bounded.** A protection granted by an ability (the Katana's fall flag) is consumed by its first qualifying event and also expires after a wall-clock bound (epoch ms, C-21), whichever comes first. Like in-flight events (C-23), it is not persisted across a restart. It must never become a standing immunity. | Katana §7; T12 |
| C-5e | *(new)* **Ability visuals are one-shot.** A trail is spawned once, on success, as a bounded number of particle emissions in the activation tick (or spread over ≤ 10 ticks via the shared interval), with no lingering entities and no per-tick scans. The fall-flag watch costs nothing while no player carries the flag. | Katana §8, §14; C-5d |
| C-20″ | *(extended)* Katana acceptance uses ≥ 2 players: the trail is visible to an observer, and the cooldown belongs to the owner only. | Katana §8, §11 |
