---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad01"
source_channel: "rollout"
analysis_version: 6
title: "AD-lgnd-01: Per-weapon key prefix, with the Web Sword pinned to `ws`"
aliases: ["L0-lgnd-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 998
tags: ["architecture-decision", "migration", "storage"]
level: 2
---
---
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r006", "L0-lgnd-ent1"]
---
# AD-lgnd-01: Per-weapon key prefix, with the Web Sword pinned to `ws`

**Context.** ADR-021 requires that 0.3.0 worlds keep the Web Sword flag and marks. The framework needs namespaced keys for N weapons.

**Decision.** Keys are `andrew:<markPrefix>_<name>`. The Web Sword's prefix is `ws`, so the derived item/world/pending names are byte-identical to the shipped ones. The cooldown key is not (`andrew:cd_web_sword` replaced `andrew:ws_cooldown_until`, `cx07`/`wpn2`). Legacy *formats* (single-object pending, no gen or holder) are tolerated on read. There is no startup migration pass.

**Rejected.**
- (a) Generic keys (`andrew:legendary_<id>_*`) plus a one-time copy migration. A crash could leave it half-run, it needs a "migrated" flag, and a downgrade to 0.3.0 would lose state.
- (b) One JSON blob per world for all weapons. It concentrates writes and size-limit risk in one key, and it breaks the shipped keys.

**Consequence.** C-17 holds with zero data risk. The Scythe gets `sc` (`L0-lgnd-as02`).
