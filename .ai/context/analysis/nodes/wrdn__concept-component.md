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
tags: ["is_a:component", "relates_to:L0-bast", "relates_to:L0-wind", "relates_to:L0-airs", "relates_to:L0-strf", "relates_to:L0-loot", "relates_to:L0-adr-body", "relates_to:L0-xcx4", "relates_to:L0-xcx5", "mini-warden-city", "ancient-city", "sculk", "worldgen", "delta:2026-09-26"]
level: 1
---
## Mini Warden City

**Source:** `Four_Structures_Spec_RU_EN_copy.docx` §13 (normative addendum, overrides earlier drafts on conflict; its footprint and contents are superseded by `decision-gorod-hranitelya-rastet-vchetvero-po-ploschadi-i`, as built `[63, 20, 63]`, 40 chests, 8 shriekers) + §15 (four-structure shared addendum).

### Responsibility
A fixed-template, script-placed Overworld structure that reads as a compact vanilla Ancient City (deepslate, Sculk, Sculk Sensors/Veins/Shriekers), not a shrunken block-for-block copy of the real one. It is one of four opportunistic world-content generators (Windmill, Airship, Mini Warden City, Mini Bastion) sharing the same chunk-candidate discovery mechanism, but it is the only one of the four that is almost entirely vanilla-mechanical once placed: no custom guards, no custom spawners, no custom loot system — it leans on real Sculk Shrieker/Warden mechanics and the real Ancient City loot table.

### Identity, size, theme
- Fixed single design, footprint 63×63, height 20 (`WARDEN_CITY_SIZE` `[63, 20, 63]`; §13.1's ≈30×30×10–15 is superseded by decision), irregular outline permitted within the template.
- Random rotation 0°/90°/180°/270° per instance (same convention as the other three structures, §15).
- Almost entirely dark; only a small fixed count of Soul Lanterns/Torches near passages and the central zone — lighting must not break the oppressive mood.

### Generation
- Governed by `L0-strf-r001`, `L0-strf-r002` (with `pending` §2), `L0-strf-p001`, `L0-strf-p002` (`dryLand` + `depth`), `L0-strf-r006`. Body: Overworld, 0.05, top Y ∈ [−45, −35].

### Surface marker
- An irregular ~5×5 Sculk/Sculk Vein patch is generated directly above the city's center, on the real surface.
- It is a locator only — not a pre-built shaft, ladder or tunnel.
- Template geometry (marker footprint vs. hall position) is co-designed so that a player digging straight down from the marker's center is guaranteed to break into the structure.
- The marker must sit on valid land and must never be used as an excuse to damage another generated structure.

### Central hall & monument
- A central hall visually echoes the real Ancient City's core.
- Holds a purely decorative Reinforced Deepslate monument/frame, ≈5 wide × 6–7 tall. It never activates, is not a portal, and never teleports the player.
- Exactly 12 of the 40 chests sit in the central zone; 2 of the 8 Shriekers sit near the hall/monument.

### Sculk & Warden
- Exactly 8 Sculk Shriekers, fixed positions, all meant to behave exactly like naturally-generated vanilla Shriekers (warning/Warden-summon mechanics), as closely as stable Bedrock allows. 2 are central, 6 are in far parts of the city.
- No Warden is pre-placed and none is a permanent guardian — it can only appear through the ordinary Shrieker mechanic.
- Sensors, Veins and other sculk dressing are placed throughout the fixed template; Sensors may noticeably outnumber the 8 Shriekers.

### Chests & loot
- Exactly 40 chests, fixed positions: 12 central + 28 spread through ruins/niches/side rooms/branches, requiring near-full exploration to find them all.
- All 40 use the **real vanilla Ancient City loot table**, unmodified — same categories/quantities/rarities, including Enchanted Golden Apple and Swift Sneak odds.
- The shared custom loot system (§3, used by Windmill/Airship) explicitly does **not** apply here (§15) — this is the sharpest divergence from its Overworld siblings.
- `L0-loot-r006`, `L0-loot-r007`.

### Persistence
- `L0-strf-r008`, `L0-strf-p004`, `L0-adr-strs`.

### Relationship to siblings
- Shares the chunk-candidate-roll → suitability-check → fixed-template-fill → idempotent-registry mechanism with Windmill, Airship and Mini Bastion (§15). `L0-xcx4` is resolved (`L0-strf-p005`, `L0-adr-spwn`); `L0-xcx5` (spec version/priority ambiguity) applies to this component and is not re-raised here — see relates_to.
- Diverges from Windmill/Airship on loot (vanilla table, not the shared weighted system) and diverges from all three siblings on guards (none — it relies on vanilla Shrieker/Warden instead of custom mobs/spawners).
- Closest sibling in shape is Mini Bastion (§14): same 5% chunk chance, same "cancel without relocation," same 10-chests-with-3-central split (Warden City itself now ships 40 chests, 12 central), same idempotent-persistence and cancel-on-intersection rules — but Bastion uses custom Piglin guards and two different vanilla loot tables (treasure + regular), while Mini Warden City uses one vanilla table and no custom mobs at all.

### Open items
- Two assumptions filed (`L0-wrdn-as01`, `as02`) on placement mechanism and absence of extra ambient mob spawning.
- Two architecture decisions filed (`L0-wrdn-ad01`, `ad02`) on loot-table sourcing; `ad02` is superseded by `L0-adr-strc`, consistent with the project-wide "closest stable approximation" directive.
- No new contradiction filed for this component — `L0-xcx5` is open; `L0-xcx6` targets this component (`L0-adr-body`).
- Probe dependencies (`L0-strf-p006`): 1, 2, 3, 4 (+8, 9 through `strf`); all PASS, `docs/structures/probe-results.md:13-16`.
