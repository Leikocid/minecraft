---
type: "concept-contradiction"
node_id: "L0-ring-cx01"
source_channel: "rollout"
analysis_version: 5
title: "CX-ring-01 · The `L0-adr-ochg` §3 drop suppression deletes death drops and mob loot"
aliases: ["L0-ring-cx01"]
is_a: ["contradiction"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1338
tags: ["is_a:contradiction", "category:design-vs-spec", "severity:high", "status:resolved", "target:L0", "relates_to:L0-adr-ochg", "relates_to:L0-ring-ad01", "relates_to:L0-ring-r006", "relates_to:L0-xasm7", "relates_to:L0-lgnd-ad10", "resolved"]
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: L0-adr-odrp
level: 2
---
# CX-ring-01 · The `L0-adr-ochg` §3 drop suppression deletes death drops and mob loot

**Target:** `L0` (the ADR `L0-adr-ochg`). **Category:** design-vs-spec. **Severity:** high (C-15 rank 2 and C-19). **Status:** resolved by `L0-adr-odrp` (reduce, v3).

- **`L0-adr-ochg` §3:** before a blast, snapshot the item-entity ids in the blast AABB. After it, remove every *new* item entity that is not a legendary. `L0-lgnd-ad10` and `L0-xasm7` build on it.
- **Orbital §10:** only the *blocks* the explosion destroyed disappear without drops. Nothing asks to delete other items.
- **Conflict.** RMB deals TNT damage to players and mobs, including the owner (§10, AC-13). A player or mob killed by the blast drops its inventory, loot and XP in the same explosion call. The snapshot-diff cannot tell those items from block drops, so it deletes them. A player killed by a PvP RMB would lose their whole inventory permanently (without `keepInventory`). That is a gameplay-correctness defect the spec never asked for.
- The ADR also first creates, then deletes, thousands of item entities per attack, which works against C-19 and RG-3.

**Proposed resolution:** adopt `L0-ring-ad01`. Use a scoped `doTileDrops=false` around the synchronous `createExplosion` calls, plus a fallback limited to destroyed-container cells. Then amend `L0-adr-ochg` §3 and the wording of `L0-lgnd-ad10`.
