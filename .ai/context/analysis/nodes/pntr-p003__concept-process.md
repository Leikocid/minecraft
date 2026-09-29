---
type: "concept-process"
node_id: "L0-pntr-p003"
source_channel: "rollout"
analysis_version: 3
title: "P-pntr-3 · Sound and top-down particle wave"
aliases: ["L0-pntr-p003"]
is_a: ["process"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 1565
tags: ["title:Sound and top-down particle wave", "is_a:process", "relates_to:L0-pntr-ad03", "relates_to:L0-pntr-r009", "relates_to:L0-pntr-ac07"]
level: 2
---
# P-pntr-3 · Sound and top-down particle wave

**Sound (in the detonation tick, once).**
- Call `dim.playSound("random.explode", point, { volume: 4, pitch: 0.6–0.8 })`. The low pitch and high volume make it read as "powerful" (Orbital §9).
- There is exactly one call per attack. No sound is played by the removal job, the particle job or block removal: `setType` is silent.

**Particle wave (a separate bounded job, ~1 s).**
- Duration: 20 ticks, starting in the detonation tick.
- Each tick *t* covers the layers from `top − ceil(H·t/20)` to `top − ceil(H·(t+1)/20) + 1`, where `H = top − bottom + 1`. The wave reaches `bottom` on tick 19 no matter how deep the column is. That is the "~1 s top-down" requirement.
- Per covered layer:
  - one `minecraft:huge_explosion_emitter` at the column centre on every 4th layer;
  - one `minecraft:large_explosion` at a random rim cell of that layer's mask.
- Hard cap: **≤ 16 `spawnParticle` calls per tick per attack**. If a tick covers more layers than that (Overworld H≈384 gives ~19 layers/tick), sample evenly.
- The wave is independent of removal progress. Removal finishes first (P-pntr-2 targets ≤ 3–5 ticks), so particles never play over blocks that are still standing below the top few layers.
- `spawnParticle` into an unloaded chunk is skipped (it is a try/catch no-op).

**Visibility note.** Particles below the player's view (deep in the shaft) are culled by the client. That is fine. Whether the wave *reads* as a wave on iPad can only be judged on the `ipad` channel (C-9) and is covered by `L0-pntr-ac08`.
