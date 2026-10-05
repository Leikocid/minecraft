---
type: "concept-contradiction"
node_id: "L0-xcx24"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "CX-L0-24 · A legendary with no ability"
aliases: ["L0-xcx24"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 1772
tags: ["v7","sculk-crossbow","category:plan-vs-code","severity:medium","status:resolved","target:L0-lgnd","resolved_by:L0-lgnd-ad15","resolved"]
closed_at: 2026-10-05
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx24
---

---
title: "CX-L0-24 · The framework assumes every legendary has an ability, a cooldown and a HUD line; the Sculk Crossbow has none"
aliases: ["L0-xcx24", "No-ability legendary vs framework"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-sclk", "L0-adr-scbs"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-2"]
governs_files: ["src/legendary/registry.ts", "src/legendary/hud.ts", "src/legendary/cooldown.ts", "src/legendary/hands.ts"]
---
# CX-L0-24 · A legendary with no ability

**Source.** Crossbow §1: no active ability and no cooldown. §9: no separate 30 s cooldown. §10: a permanent Action Bar readiness indicator is not needed.

**Code (1.6.1).**
- `LegendaryDef` requires `abilityKey` and `cooldownTicks` (`registry.ts:12-15`).
- `hudMessage` emits a "Ready / N s" line for **every** held legendary (`hud.ts:35-58`). With the crossbow in hand, players would see "Sculk Crossbow — Ready" forever.
- `cooldown.ts:48` falls back to the default 600 ticks for an unknown ability key.
- `resolveActivation` is the Use arbiter between held legendaries; a passive def must never claim a Use there, or it would mask a Katana or Cannon in the other hand.

**Disagreement.** Under the v6 reduce invariant ("any framework change a weapon needs is an L0 contradiction"), def #5 cannot be added as data only.

**Proposed resolution (autopilot default).** `lgnd` v7 makes the ability optional: an `ability?: { key, cooldownTicks, hudKeys? }` block, or optional fields. A def without one has no cooldown key, never appears in the HUD and is skipped by `resolveActivation`. Defs #1–#4 keep byte-identical keys and behaviour, which the existing legendary GameTests prove. This is the only framework change the crossbow may ask for.

**Resolved at reduce (v7):** `L0-lgnd-ad15` (optional ability block, `hasAbility`; gate `lgnd-ac26`).
