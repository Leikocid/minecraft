---
type: "concept-component"
node_id: "L0-bast"
source_channel: "rollout"
analysis_version: 2
title: "Mini Bastion — Nether custom structure (20×20×10-12, lava treasure room, one-time Piglin garrison)"
aliases: ["L0-bast"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 3498
tags: ["is_a:component", "relates_to:L0-wind", "relates_to:L0-airs", "relates_to:L0-wrdn", "relates_to:L0-strf", "relates_to:L0-loot", "relates_to:L0-adr-body", "mini-bastion", "nether", "structure-generation", "delta:2026-09-26"]
level: 1
---
# Mini Bastion — Nether custom structure (20×20×10-12, lava treasure room, one-time Piglin garrison)

**Responsibility:** Generate a compact, self-contained custom Nether structure that reads visually as a small Bastion Remnant, on a fixed ~20×20×10-12 template with 2-3 levels, a central lower lava treasure room, and a one-time-only garrison of Piglins/Piglin Brutes. Belongs to the "four custom structures" family defined in `docs/Four_Structures_Spec_RU_EN_copy.docx` §14 (normative) and §15/§16 (shared addendum), alongside sibling components Windmill (`L0-wind`), Airship (`L0-airs`) and Mini Warden City (`L0-wrdn`).

**Inputs:**
- Nether chunks that the player-position discovery pass `L0-strf-p001` puts in the queue (`L0-adr-strc`: the stable API has no chunk-generated event).
- Physical placement context: local terrain/support at the candidate site, and the set of already-known generated structures (vanilla + custom) for overlap testing.
- Stable `@minecraft/server` Script API only — no Experiments (per §15 shared rule, inherited across all four structures).

**Outputs:**
- A placed structure instance: fixed template, footprint ~20×20, height ~10-12, 2-3 internal levels, random rotation 0/90/180/270.
- 10 fixed chests populated once (3 treasure + 7 regular), 2-4 random Gold Blocks in the treasure room.
- A persistent one-time garrison: 7-10 Piglins + exactly 2 Piglin Brutes.
- World-state edits (blocks, lava, mob spawns) that behave as ordinary mutable world state from that point on — no regeneration, ever.

**Scope boundary:** Mini Bastion is Nether-only and independent of the Overworld pair (Windmill/Airship). It shares only the family-wide invariants in §15 (random rotation, no-Experiments implementation preference, structure-overlap cancellation, universal persistence-after-restart) and does **not** use the Windmill/Airship custom weighted loot system (§3) — it consumes real vanilla Bastion Remnant loot tables instead, the same choice Mini Warden City makes for the vanilla Ancient City table. This component has no functional dependency on the Scythe of Calamity / legendary-weapons tree already present in this KV (`L0-scyt`, `L0-sprj`, `L0-sitm`) — that is a different feature area of the same add-on.

**Key characteristics (see child rules/entities for detail):**
- 5% candidate chance per suitable Nether chunk; no relocation on a failed site-suitability check (`L0-strf-r002`).
- Rejects lava-ocean sites and sites lacking solid support (profile `netherFloor`, `L0-xasm4` §3).
- Rejects candidates that physically intersect any other detected structure, custom or vanilla (including a real Bastion Remnant) — existing structures are never damaged to make room (`L0-strf-r006`).
- Central/lower treasure room surrounded by ordinary (non-special) lava, reachable either by building a safe path through the lava area or by descending/falling from the upper level.
- Guard roster is spawned exactly once per bastion instance, is fully persistent (no despawn by distance, chunk unload, or restart) until killed, and is never replenished (`L0-strf-r009`).
- Initialization is idempotent: re-loading the chunk must not create a second set of chests, gold blocks, or mobs (`L0-strf-r008`).

**Relates to:** `L0-wind` (Windmill), `L0-airs` (Airship), `L0-wrdn` (Mini Warden City) — siblings in the same four-structure family; overlap-cancellation and the §15 shared addendum are the concrete coupling points. All four ship in v1.2.0.

Probe dependencies (`L0-strf-p006`): 1, 2, 4, 5 (+8, 9 through `strf`); PASS (5 partial), `docs/structures/probe-results.md:13-17`.

**Sources:** `fourstructuresspecruencopy-part-9/10/11` (§14 Mini Bastion, §15 shared addendum, §16 English addendum).
