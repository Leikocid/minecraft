---
type: "concept-acceptance-criterion"
node_id: "L0-pear-ac07"
source_channel: "rollout"
analysis_version: 11
title: "AC-pear-07 · Probe recorded before the build (checks 19136)"
aliases: ["L0-pear-ac07"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 1479
tags: ["v11", "pearl-rod", "acceptance", "bds", "ipad", "probe"]
level: 2
---
# AC-pear-07 · Probe recorded before the build (checks 19136)

**Relates to:** L0-pear, L0-pear-cx02, L0-pear-ad01, L0-xasm41, L0-xasm43.

A `probe_pearl_*` criterion set logs one line per question, and each answer is copied into the KV (engine facts) before stage 2. It must state, with measured values:
1. **Hook events:** `projectileHitBlock` on `minecraft:fishing_hook` — fires or not, and which block it reports on a plate.
2. **Resting height:** the hook's rest height per plate typeId, which calibrates the 0.25 threshold.
3. **Owner:** the hook's projectile owner — readable or undefined.
4. **Cancelled cast:** a cancelled `beforeEvents.itemUse` on a vanilla rod — a hook spawns, yes or no (`cx02`).
5. **Durability:** `durability.damage = 0` written after a reel holds on the next read.
6. **Dynamic properties** after a reel, a chest, a drop, an anvil rename and a restart.
7. **`/tickingarea` load** at 10 K / 100 K / 1 M blocks and in the Nether and the End: ticks to `isChunkLoaded`, plus the world cap observed (`probe_tickingarea_load`).
8. **Cross-dimension** `teleport({dimension})` of a sim player, with a read-back.
9. **Recipe:** the 3×3 pattern with blanks — a shifted layout crafts or not (crafter).

**`ipad`** (only the iPad can see these): whether `hook.remove()` resets the cast pose, and whether a cancelled cast flickers a line.

**Pass:** every line is present and the KV is updated. Any "no" re-routes to the fallback named in the owning artifact.
