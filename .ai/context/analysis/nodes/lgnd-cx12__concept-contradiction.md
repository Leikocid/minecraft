---
type: "concept-contradiction"
node_id: "L0-lgnd-cx12"
source_channel: "rollout"
analysis_version: 5
title: "CX-lgnd-12 · A legendary nested in a shulker box or bundle cannot be protected, returned or voided"
aliases: ["L0-lgnd-cx12"]
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 1554
tags: ["status:resolved", "category:source-vs-engine", "severity:medium", "target:L0-lgnd", "resolved"]
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: L0-adr-wpn3
level: 2
---
---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r012", "L0-lgnd-r013", "L0-lgnd-p008", "L0-xcx10"]
status: open
category: source-vs-engine
---
# CX-lgnd-12 · A legendary nested in a shulker box or bundle cannot be protected, returned or voided

**Spec.** Orbital §5 and DoD §15:
- a legendary is not destroyed by ordinary means;
- a destroyed container must not make it vanish;
- there is no duplication path through containers.

**Engine (stable 2.10.0).** A shulker box **item** (after it is broken and picked up) and a bundle carry their contents inside the stack. The stable Script API exposes no container or contents component on an `ItemStack`, so the framework cannot read those contents. Consequences:
- A shulker-box item entity holding the Scythe burns in lava. The Scythe is gone with no event, and it is never returned.
- A stale-generation copy inside a shulker box is not voided until it is taken out.
- `protectLegendariesIn` handles a *placed* shulker box (a block with an inventory), but not a shulker item lying on the ground inside the volume.

**Options.**
- (a) Accept and document it as a known limit (C-16). This is the interim position.
- (b) Forbid legendaries in shulker boxes and bundles. It has no stable hook: container-insert filtering needs beta `beforeEvents`.
- (c) Treat any shulker-box item entity in a `p008` volume as "may contain a legendary" and move it out as well. This is cheap, but only helps tier 1.

**Proposed:** (a) + (c). The client should know that nesting defeats the protection.

**Resolution (reduce, v3):** resolved by `L0-adr-wpn3`.
