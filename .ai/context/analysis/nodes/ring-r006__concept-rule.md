---
type: "concept-rule"
node_id: "L0-ring-r006"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-r006"]
is_a: ["rule"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1175
tags: ["is_a:rule", "drops", "relates_to:L0-xasm7", "relates_to:L0-ring-ad01", "relates_to:L0-ring-cx01", "relates_to:L0-ring-ac14", "relates_to:L0-ring-ac18"]
level: 2
---
**R-ring-006 · No block drops and no container spill. Everything else drops as in vanilla** (Orbital §10, §15; AC-14; `L0-xasm7`)

**Suppressed:**
- Every item a *block* would drop because the ring explosion broke it.
- The ordinary contents of a container the ring explosion destroyed (`xasm7`).

**Not suppressed (stays vanilla):**
- Loot and XP from mobs killed by the blast.
- The death drops of players killed by the blast, under `keepInventory` false.
- Item entities that already lay on the ground (they may be destroyed by blast damage, as in vanilla).
- Items spilled later by world TNT that a ring blast primed (`as07`).

**Never suppressed or lost:**
- Live marked legendaries (`r008`).

**Mechanism:** `L0-ring-ad01`. `doTileDrops` is false only during the synchronous explosion call. It is restored in `finally`, to its previous value.

**Rationale:**
- §10 says "blocks the explosion destroyed disappear WITHOUT item drops". It is about blocks.
- Deleting a killed player's inventory would be a C-15 rank-2 violation, and it is not asked for.
- C-19 ("no uncontrolled item entities") is met by never *creating* block drops, instead of deleting them afterwards.
