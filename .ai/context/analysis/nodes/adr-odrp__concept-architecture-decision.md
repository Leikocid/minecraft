---
type: "concept-architecture-decision"
node_id: "L0-adr-odrp"
source_channel: "rollout"
analysis_version: 3
title: "ADR-L0-odrp · RMB drops: a scoped `doTileDrops` toggle replaces the item snapshot-diff"
aliases: ["L0-adr-odrp"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-ring", "L0-lgnd", "L0-pntr", "L0-orbc", "L0-adr-ochg", "L0-ring-ad01", "L0-ring-cx01", "L0-lgnd-ad10", "L0-xasm7", "L0-xasm11"]
see_also: ["L0-ring-r006", "L0-ring-ent3", "L0-ring-as02"]
requires: ["L0-lgnd-p008", "L0-adr-oprt"]
priority: 540
size_chars: 3167
tags: ["status:accepted", "v3-reduce", "amends:L0-adr-ochg", "resolves:L0-ring-cx01", "relates_to:L0-ring", "relates_to:L0-lgnd", "relates_to:L0-pntr", "relates_to:L0-orbc", "relates_to:L0-adr-ochg", "relates_to:L0-ring-ad01", "relates_to:L0-ring-cx01", "relates_to:L0-lgnd-ad10", "relates_to:L0-xasm7", "requires:L0-lgnd-p008"]
level: 2
---
# ADR-L0-odrp · RMB drops: a scoped `doTileDrops` toggle replaces the item snapshot-diff

**Status:** accepted (reduce, v3). **Amends:** `L0-adr-ochg` §3. **Resolves:** `L0-ring-cx01`.

## Context
- `L0-adr-ochg` §3 was written at L0 before `ring` was analysed. It removes every *new* non-legendary item entity in a blast AABB.
- `ring` found that TNT damage also kills players and mobs in that same call (Orbital §10, AC-13). A snapshot-diff cannot tell their death drops and loot apart from block drops. It would delete a PvP victim's whole inventory, which the spec never asks for.
- `L0-lgnd-ad10` ("RMB drop suppression must skip legendaries") and `L0-xasm7` were written on top of §3. Their *intent* still holds, but the mechanism they name is withdrawn.

## Decision
1. **Mechanism = `L0-ring-ad01`.**
   - `ring` wraps each queue step's `createExplosion` calls in a synchronous `try/finally`.
   - It saves `doTileDrops`, sets it to `false`, runs the blasts, then restores the saved value.
   - The rule is never held across a tick, an `await` or a `system.run`.
2. **Scope of "no drops".** Only *block* drops are suppressed, plus container spill from destroyed containers (through `ring-ad01`'s container fallback if probe `L0-ring-as02` shows the gamerule does not cover spill). Player death drops, mob loot and XP stay vanilla.
3. **Legendaries are protected before the toggle, not by the suppression.** Tier 1 of `L0-lgnd-ad10` (`protectLegendariesIn`, per `L0-adr-oprt`) runs before the first blast of each step. The container fallback also skips anything `isLegendaryItemEntity` matches. `lgnd-ad10`'s sentence "RMB drop suppression deletes new item entities" is read as "RMB suppresses block drops (`L0-adr-odrp`)".
4. **LMB is unaffected.** `pntr` never calls `createExplosion` (`L0-adr-ochg` §4). `setType(air)` produces no drops, so `pntr` never touches the gamerule.
5. **One owner of the gamerule.** Only `src/orbital/ring.ts` writes `doTileDrops`. No other module (structures, `lgnd`, `pntr`) may toggle it. That way a nested toggle cannot restore the wrong value.

## Rejected
- Keeping §3 and excluding items "near a dead entity". It is a heuristic that races with the death event.
- `setType(air)` pre-clearing with `breaksBlocks:false`. `ring-ad01` rejected it because it re-implements TNT resistance.

## Consequences
- `L0-adr-ochg` §3 now points here. §1, §2, §4 and §5 stand.
- `L0-xasm7` keeps its meaning ("RMB leaves no block drops"), with the mechanism changed.
- The gamerule broadcast probe (`ring-ad01` consequences) and the container-spill probe (`ring-as02`) join the Stage-5 BDS probe set (`L0-xasm11`).
- Item frames destroyed by RMB lose their framed item under this toggle. `L0-adr-oprt` §3 handles that.
