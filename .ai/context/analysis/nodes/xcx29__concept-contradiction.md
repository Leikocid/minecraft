---
type: "concept-contradiction"
node_id: "L0-xcx29"
source_channel: "rollout"
analysis_version: 11
title: "CX-L0-29 · Real lightning vs \"spectacle never deals damage\""
aliases: ["L0-xcx29"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 1933
tags: ["v9","above-water-trident","status:open","constraint-conflict","resolved"]
level: 1
closed_at: 2026-10-12
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx29
---

---
title: "CX-L0-29 · 'Summon exactly one lightning strike' vs C-30 and the exact +2 HP"
aliases: ["L0-xcx29", "Trident lightning"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-adr-twlt", "L0-adr-sblt", "L0-xq10", "L0-strm"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2", "stormbladeelytratotemspecruen-part-1"]
---
# CX-L0-29 · Real lightning vs "spectacle never deals damage"

**Statement A (trident §02):**
- Every successful hit "summons exactly one lightning strike" and "deals +2 HP".
- "Prevent recursive lightning-triggered damage."

The wording is Channeling's: a real bolt.

**Statement B (C-30, written at v8 from the Storm Blade spec and phrased project-wide):** any weapon's lightning causes no damage, fire, knockback, mob conversion or block change. If vanilla `lightning_bolt` cannot meet that on stable, it is not spawned (`L0-adr-sblt`).

**Evidence that they collide on BDS 1.26.51.1** (measured during the Storm Blade work, project memory):
- A vanilla `lightning_bolt` converts pigs and villagers and places fire, **even with every lightning and fire hurt cancelled**.
- The bolt's own hit is a second damage event. Unless it is cancelled, the hit is no longer "base + 2".

So "one real lightning" and "exactly +2, no recursion" cannot both hold with the vanilla entity. The fire and conversions also break C-30 as written.

**Category:** a source-vs-constraint conflict. C-30 was generalised from one spec, so it is now amended to C-30′ (the client may opt in).

**Default, unless `xq10` says otherwise:** `L0-adr-twlt`.
- The strike is the Storm Blade's visual (`src/storm/visuals.ts`): particles plus thunder sound, one per hit.
- The +2 is delivered by script.
- Ship notes and the iPad sheet report that no `lightning_bolt` entity is spawned and why.

**Closes when:** Andrey answers `xq10`, or the default ships with the reported limitation.
