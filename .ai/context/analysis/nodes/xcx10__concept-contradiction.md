---
type: "concept-contradiction"
node_id: "L0-xcx10"
source_channel: "rollout"
analysis_version: 3
title: "CX-L0-10 · \\"Legendaries are not destroyed\\" vs the as-built \\"destroyed means returned\\""
aliases: ["L0-xcx10"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0","L0-lgnd","L0-pntr","L0-ring"]
see_also: ["orbitalcannonspecv1ruen-part-1"]
priority: 540
size_chars: 1478
tags: ["title:CX-L0-10 · \"Legendaries are not destroyed\" vs the as-built \"destroyed means returned\"","alias:L0-xcx10","is_a:contradiction","relates_to:L0","relates_to:L0-lgnd","relates_to:L0-pntr","relates_to:L0-ring","see_also:orbitalcannonspecv1ruen-part-1","category:source-vs-code","severity:medium","status:open","target:L0-lgnd","resolved"]
level: 1
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx10
---

# CX-L0-10 · "Legendaries are not destroyed" vs the as-built "destroyed means returned"

**Spec (Orbital §5, a general rule for all legendaries).** A legendary must **not be destroyed** by fire, lava, cactus, TNT, the Orbital Cannon or other ordinary item-entity destruction. When a container holding one is destroyed, the legendary must **survive or drop**, not vanish.

**Code (`src/legendary/recovery.ts` header).** "The stable API has no way to make an item entity indestructible, so the rule is 'destroyed means returned'." A lost instance is re-issued to the owner's inventory, and that happens elsewhere, not where it lay. Container destruction is not handled specially. Vanilla drops container contents, and recovery watches the resulting item entity.

**Conflict.**
- Spec: the item stays in the world.
- Code: it teleports to a player.

The Orbital effects make this worse:
- LMB deletes containers "with contents", so the vanilla contents drop never happens.
- RMB drop suppression (`L0-adr-ochg`) could delete a legendary that a container spilled.

**Proposed resolution for `lgnd`:**
- Keep "destroyed → returned" as the stable fallback for fire, lava, cactus and the Void.
- Add a pre-emptive `protectLegendariesIn(dim, volume)` that the Cannon calls before it removes blocks. It pulls legendaries out of containers in the volume and re-drops them at a safe spot outside the blast, which keeps the "survive/drop" semantics.

It is recorded as a deviation (C-16).
