---
type: "concept-architecture-decision"
node_id: "L0-adr-twrp"
source_channel: "rollout"
analysis_version: 9
title: "ADR-L0-twrp · Movement: dash, landing, swimming"
aliases: ["L0-adr-twrp"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 2800
tags: ["v9", "above-water-trident", "status:proposed"]
level: 2
---
---
title: "ADR-L0-twrp · Dash as a scripted impulse; fall cancel; underwater speed"
aliases: ["L0-adr-twrp", "Trident dash decision"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-xcx28", "L0-xq9", "L0-katn", "L0-xasm36"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2"]
governs_files: ["src/trident/", "src/katana/fall.ts"]
---
# ADR-L0-twrp · Movement: dash, landing, swimming

**Context.**
- The spec asks for Riptide-III-like propulsion anywhere, with no button and no cooldown. It also asks for a one-shot fall cancel after a dash.
- Underwater, the holder should swim at about land-run speed, with the boost removed when the trident is not held.
- What stable 2.10.0 offers, from project measurements:
  - `applyKnockback` moves players (0.59/tick hold), and a launch does not build up fall distance.
  - The `entityHurt` before-event can cancel or rewrite damage.
  - A self-teleport resets the stored fall.
  - **Bedrock has no Dolphin's Grace effect.**
  - No API plays the Riptide spin pose.

**Decision.**
1. **Dash.**
   - Trigger: `itemReleaseUse` with a charge ≥ 10 ticks (vanilla's minimum) **and the player sneaking** (the default for `xcx28`/`xq9`).
   - Effect: `applyKnockback` along the view vector, sized to vanilla Riptide III's launch, measured by probe against a vanilla Riptide III trident in water.
   - Riptide's own sound plays. No cooldown, and no world, water or weather check.
2. **Fall cancel.**
   - Each dash sets a one-shot grant on the player.
   - The first fall-cause hurt after it is cancelled in the before-event, and the grant is consumed.
   - If the player lands without damage, the first ground contact clears the grant.
   - An unused grant expires after 10 s (the katana's `FALL_FLAG_MS`, `xasm36`).
   - The katana's teleport method (`src/katana/fall.ts`) is the fallback if the before-event path fails the probe.
3. **Underwater speed.**
   - A shared per-tick interval.
   - For a player who is in water, swimming or moving, and holding the trident in the main or off hand (`allow_off_hand`), add a forward impulse that brings horizontal speed to the land-sprint target (≈ 5.6 b/s, `xasm37`), capped.
   - Nothing is applied otherwise (C-36).

**Rejected alternatives.**
- **The vanilla `minecraft:trident` with Riptide.** It needs water or rain, and it cannot also throw.
- **A dash by teleport.** It is not a dash: no momentum, and teleporting zeroes velocity.
- **Speed or Swiftness effects for swimming.** On Bedrock they barely affect swim speed, and they also speed up walking (C-36).
- **Depth Strider on the holder's boots.** It mutates another item.

**Reported limitations (C-16):** no spin animation, and the swim boost is impulse-driven. The iPad sheet judges the feel.
