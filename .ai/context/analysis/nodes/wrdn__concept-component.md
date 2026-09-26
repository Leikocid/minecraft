---
type: "concept-component"
node_id: "L0-wrdn"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-wrdn"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 5652
tags: ["is_a:component", "relates_to:L0-bast", "relates_to:L0-wind", "relates_to:L0-airs", "relates_to:L0-strf", "relates_to:L0-xcx4", "relates_to:L0-xcx5", "mini-warden-city", "ancient-city", "sculk", "worldgen", "delta:2026-09-26"]
level: 1
---
## Mini Warden City

**Source:** `Four_Structures_Spec_RU_EN_copy.docx` §13 (normative addendum, overrides earlier drafts on conflict) + §15 (four-structure shared addendum).

### Responsibility
A fixed-template, script-placed Overworld structure that reads as a compact vanilla Ancient City (deepslate, Sculk, Sculk Sensors/Veins/Shriekers), not a shrunken block-for-block copy of the real one. It is one of four opportunistic world-content generators (Windmill, Airship, Mini Warden City, Mini Bastion) sharing the same chunk-candidate discovery mechanism, but it is the only one of the four that is almost entirely vanilla-mechanical once placed: no custom guards, no custom spawners, no custom loot system — it leans on real Sculk Shrieker/Warden mechanics and the real Ancient City loot table.

### Identity, size, theme
- Fixed single design, footprint ≈30×30, height ≈10–15 blocks, irregular outline permitted within the template.
- Random rotation 0°/90°/180°/270° per instance (same convention as the other three structures, §15).
- Almost entirely dark; only a small fixed count of Soul Lanterns/Torches near passages and the central zone — lighting must not break the oppressive mood.

### Generation
- Overworld only. 5% candidate chance per suitable chunk. A successful roll on an unsuitable site cancels outright — **no relocation** to a neighboring chunk (same rule as Windmill/Airship/Bastion).
- Never generates where the surface point above the structure is ocean/river/large water — the surface must be land.
- Structure top sits at a random Y in **−35…−45**, chosen per instance (so depth varies instance to instance, independent of the candidate roll).
- Cancels on physical intersection with any detected vanilla or custom structure (including a real Ancient City); existing structures are never damaged to make room.

### Surface marker
- An irregular ~5×5 Sculk/Sculk Vein patch is generated directly above the city's center, on the real surface.
- It is a locator only — not a pre-built shaft, ladder or tunnel.
- Template geometry (marker footprint vs. hall position) is co-designed so that a player digging straight down from the marker's center is guaranteed to break into the structure.
- The marker must sit on valid land and must never be used as an excuse to damage another generated structure.

### Central hall & monument
- A central hall visually echoes the real Ancient City's core.
- Holds a purely decorative Reinforced Deepslate monument/frame, ≈5 wide × 6–7 tall. It never activates, is not a portal, and never teleports the player.
- Exactly 3 of the 10 chests sit in the central zone; one of the two natural Shriekers sits near the hall/monument.

### Sculk & Warden
- Exactly 2 Sculk Shriekers, fixed positions, both meant to behave exactly like naturally-generated vanilla Shriekers (warning/Warden-summon mechanics), as closely as stable Bedrock allows. One is central, one is in a far part of the city.
- No Warden is pre-placed and none is a permanent guardian — it can only appear through the ordinary Shrieker mechanic.
- Sensors, Veins and other sculk dressing are placed throughout the fixed template; Sensors may noticeably outnumber the 2 Shriekers.

### Chests & loot
- Exactly 10 chests, fixed positions: 3 central + 7 spread through ruins/niches/side rooms/branches, requiring near-full exploration to find them all.
- All 10 use the **real vanilla Ancient City loot table**, unmodified — same categories/quantities/rarities, including Enchanted Golden Apple and Swift Sneak odds.
- The shared custom loot system (§3, used by Windmill/Airship) explicitly does **not** apply here (§15) — this is the sharpest divergence from its Overworld siblings.
- Each chest fills exactly once; never refills after opening, chunk unload, or restart.

### Persistence
- Post-generation blocks are ordinary, player-mutable world blocks under normal vanilla per-block rules.
- Destroyed/altered parts never regenerate.
- Initialization must be idempotent: a reload never creates a second set of chests, Shriekers, Sensors, or surface marker for the same instance.

### Relationship to siblings
- Shares the chunk-candidate-roll → suitability-check → fixed-template-fill → idempotent-registry mechanism with Windmill, Airship and Mini Bastion (§15). The cross-component contradiction `L0-xcx4` (whether a permanent throttled per-chunk discovery loop is compatible with C-5) and `L0-xcx5` (spec version/priority ambiguity) both apply to this component; neither is re-raised here — see relates_to.
- Diverges from Windmill/Airship on loot (vanilla table, not the shared weighted system) and diverges from all three siblings on guards (none — it relies on vanilla Shrieker/Warden instead of custom mobs/spawners).
- Closest sibling in shape is Mini Bastion (§14): same 5% chunk chance, same "cancel without relocation," same 10-chests-with-3-central split, same idempotent-persistence and cancel-on-intersection rules — but Bastion uses custom Piglin guards and two different vanilla loot tables (treasure + regular), while Mini Warden City uses one vanilla table and no custom mobs at all.

### Open items
- Two assumptions filed (`L0-wrdn-as01`, `as02`) on placement mechanism and absence of extra ambient mob spawning.
- Two architecture decisions filed (`L0-wrdn-ad01`, `ad02`) on loot-table sourcing and placement mechanism, both consistent with the project-wide "closest stable approximation" directive.
- No new contradiction filed for this component — the two that already target it (`L0-xcx4`, `L0-xcx5`) are cross-cutting and unresolved at the parent level; this deep-dive does not attempt to resolve them.
