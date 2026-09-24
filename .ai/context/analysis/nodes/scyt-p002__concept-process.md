---
type: "concept-process"
node_id: "L0-scyt-p002"
source_channel: "rollout"
analysis_version: 1
title: "P-scyt-002 — Volley end-to-end (contract view over `L0-sprj`)"
aliases: ["L0-scyt-p002"]
is_a: ["process"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 2059
tags: ["is_a:process", "volley", "contract"]
level: 2
---
# P-scyt-002 — Volley end-to-end (contract view over `L0-sprj`)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["process"]` · `relates_to: ["L0-sprj", "L0-sprj-r005", "L0-sprj-r006", "L0-sprj-r008", "L0-sprj-ad01", "L0-scyt-r004", "L0-scyt-r005", "L0-scyt-r006", "L0-scyt-r007"]` · source: Scythe §4, §5, §7.

This is a summary only. `L0-sprj` holds the detailed mechanics. It is restated here because the process nodes `L0-sprj-p00x` are missing from the live KV (`L0-scyt-cx01`).

1. **Launch.** Create 3 virtual projectiles at `launchPoint` + eye height, released with a small stagger. Mark busy. If the module's single `runInterval` is not running, start it (`L0-sprj-r006`).
2. **Each tick, per volley** (order from `L0-sprj-r008`):
   1. apply invalidation marks from events: target or owner death, leave, or dimension change;
   2. re-check that owner and target are valid through `world.getEntity(id)`;
   3. move each projectile by pure pursuit toward the target's body centre (`L0-sprj-ad02`). Blocks are never queried (`L0-scyt-r004`). Draw particles in the Shulker Bullet style;
   4. **hit test:** if the distance to the target centre is at most the hit radius, the hit counts once per projectile. Apply 3 HP true damage (`L0-scyt-r005`), then launch the target (`L0-scyt-r006`). On the first hit, commit the cooldown (`L0-sprj-ad01`);
   5. **leash test:** if `dist(target.location, launchPoint) > 20`, the outcome is `ESCAPED_BEFORE_HIT` or `ESCAPED_AFTER_HIT` (`L0-scyt-r007`);
   6. **completion:** all 3 projectiles are resolved (hit or expired). The outcome is `COMPLETED` with hits ≥ 1, or `EXPIRED` with hits = 0.
3. **Resolve** exactly once:
   - remove the projectiles and draw nothing more;
   - clear busy;
   - with `hits ≥ 1`, re-stamp the full 30 s cooldown; with `hits = 0`, write no cooldown (`L0-sprj-r005`);
   - if the volley map is empty, stop the loop.
4. **Airborne hits.** Remaining projectiles keep homing while the target is in the air (§4). Up to 9 HP in total (spec test 7). Fall damage is applied by vanilla afterwards.
