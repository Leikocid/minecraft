---
type: "concept-process"
node_id: "L0-ring-p003"
source_channel: "rollout"
analysis_version: 5
title: "Process · Detonation queue and load shaping"
aliases: ["L0-ring-p003"]
is_a: ["process"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1791
tags: ["is_a:process", "performance", "relates_to:L0-ring-ad02", "relates_to:L0-ring-cons", "relates_to:L0-orbc-ad02"]
level: 2
---
# Process · Detonation queue and load shaping

**Links:** `part_of: ["L0-ring"]` · `is_a: ["process"]` · `relates_to: ["L0-ring-ad02", "L0-ring-cons", "L0-orbc-ad02", "L0-ring-p002"]`

**Why a queue is needed.** On flat ground every charge of an attack spawns at the same `spawnY` and falls at the same `FALL_SPEED`. The 201 contacts therefore land in the **same tick**. With 3 players firing, up to 603 explosions (63 at power 4, 120 at 2, 420 at 1) could fall due in one tick.

1. **`onDetonate(dim, point, ownerId, "rmb", attackId)`** appends a Queued Blast (`ent2`) and returns at once. That makes it synchronous-safe per `L0-orbc-r014`.
   - If the queue loop is not running, it starts one `system.runInterval(drain, 1)`.
   - The first drain happens **in the same tick** through an immediate `drain()` call. A lone charge therefore explodes with no added delay.
2. **`drain()`:**
   - Take up to `RING_MAX_BLASTS_PER_TICK` (default 48, `as05`) from the head, FIFO across all attacks.
   - Run `p002` on that batch.
   - If the queue is empty, clear the interval. No idle loop (C-5a′).
3. **Latency bound.**
   - One attack: ⌈201/48⌉ = 5 ticks (0.25 s), measured 48/48/48/48/9.
   - Three attacks: 13 ticks (0.65 s), measured.
   - §10 already allows "the actual time of individual explosions may differ slightly".
4. **Adaptive cap (optional, behind a constant).** If the previous drain took > 25 ms, halve the cap for the next tick, down to a floor of 16. Restore it by +8 per fast tick.
5. **Safety.**
   - A blast older than 200 ticks in the queue is dropped and logged. This should never happen; it guards against a stuck interval.
   - `drain` catches errors per batch and always restores the gamerule (`p002` step 7).
6. **Restart.** The queue is in memory. Queued blasts are lost on shutdown, like in-flight charges (AC-19 via `orbc`).
