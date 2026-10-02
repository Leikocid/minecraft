---
type: "concept-process"
node_id: "L0-magn-phld"
source_channel: "rollout"
analysis_version: 5
title: "Per-tick hold step (inside the single UFO interval, after the saucer step)"
aliases: ["L0-magn-phld"]
is_a: ["process"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 1634
tags: ["is_a:process", "per-tick", "relates_to:L0-magn-rply", "relates_to:L0-magn-rrng", "relates_to:L0-xasm16"]
level: 2
---
# Per-tick hold step (inside the single UFO interval, after the saucer step)

Input: `S = saucerPosition()`.

## Players
For each player from `world.getPlayers({dimension overworld})`, filtering `undefined` (C-22):
1. Skip anyone outside the zone cylinder, in Creative or in Spectator, or dead.
2. `iron = isIron(mainhand) || isIron(offhand)`, read through `minecraft:equippable` (U10). A legendary is never iron.
3. If `iron` is false, do nothing that tick: the player falls under vanilla physics.
4. Otherwise let `T = S − (0, 6, 0)` and `d = T − p.location`, and step `v = d̂ · min(0.6, |d|)`. Apply it as `applyKnockback({x: v.x, z: v.z}, v.y)` (U1). At the target this degenerates to zero and holds the player within ~0.03 blocks.
5. Pulling resumes automatically on a later tick when iron is back in hand (`L0-magn-rply`).

## Elements
For each element (`L0-magn-eelm`):
1. If `entity.isValid` is false, drop it from the set.
2. The slot position is `P = S + (5·cos θ, −3, 5·sin θ)`, where θ = 2π·slot/n + ω·t. It is pushed away from players per `L0-magn-rrng`.
3. If the element has not arrived, move it by at most the flight speed toward `P` (`L0-magn-asfl`). Once arrived, move it straight to `P`.
4. Move it with `teleport(next)` followed by `clearVelocity()`. It goes through blocks (U3) and does not fall.
5. If `next` or the current position lies in an unloaded chunk, skip that element this tick (C-12′).

## New drops
The exemption subscription (`L0-magn-rexm`) appends `X` elements during the tick.

## Budget
Mean ≤ 2 ms and p99 ≤ 5 ms for the whole step (`L0-xasm16`), measured with ≥ 2 players and 10 + 2 elements.
