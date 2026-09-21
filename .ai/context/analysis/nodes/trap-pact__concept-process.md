---
type: "concept-process"
node_id: "L0-trap-pact"
source_channel: "rollout"
title: "Process — Ability Activation Pipeline"
aliases: ["L0-trap-pact"]
part_of: ["L0-trap"]
is_a: ["process"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 3246
tags: ["process","activation","ability","ordering","L0-trap"]
---

# Process — Ability Activation Pipeline

**Links** — `part_of: ["L0-trap"]` · `is_a: ["process"]` · `relates_to: ["L0-trap-ptgt", "L0-trap-pfil", "L0-cool", "L0-trap-r004"]` · `see_also: ["webswordspecv1ruen-part-1"]`

The end-to-end flow from Use to trap. **Step order is normative** (ADR-006): any reordering can consume the cooldown on a failed activation, which §5 and §12 both forbid.

## Trigger

Stable item-use event raised for a held `andrew:web_sword`. This is the **only** entry point (R-001). A melee attack with the same sword raises a different event and must fall through untouched (§7, ASM-006).

## Steps

1. **Filter the event.** Ignore the event unless the used item is `andrew:web_sword`. No other item may reach this handler.
2. **Resolve the target** — delegate to `L0-trap-ptgt`. Returns a `TargetResolution` or `none`.
3. **Gate on target validity.** If `none` (no valid target, or the only candidate lies beyond reach): **return immediately.** No block is written, no cooldown is touched, no message is sent. §5: *«способность не срабатывает и cooldown не запускается»* (R-004).
4. **Gate on cooldown.** Read readiness for `(player, web_sword_ability)` from `L0-cool`. If the ability is on cooldown: return without writing. The read is non-mutating — this component never starts, extends or clears a timer (CTR-007).
5. **Build the placement plan** — delegate to `L0-trap-pfil` step A. Produces 27 `CellVerdict`s. **No world write happens in this step.**
6. **Apply the plan** — `L0-trap-pfil` step B. Set every `permitted` cell to `minecraft:web`. Steps 5 and 6 run inside one synchronous handler invocation (ADR-015).
7. **Report the outcome.** Emit success to `L0-cool`, which starts the 30 s timer (§8). Success is defined by R-004 — and for the zero-permitted-cells case it is **undefined pending CTR-008**; do not guess in code without the owner's answer.

## Failure paths (all free — no cooldown consumed)

| Path | Spec | Behaviour |
|---|---|---|
| No target within reach | §5, §12 | Silent return |
| Ray blocked by a wall, resulting point still valid | §12 | **Not** a failure — the wall-side point *is* the target (R-003) |
| Ability on cooldown | §8 | Silent return; the actionbar already explains why (`L0-cool`) |
| Every cell skipped by the safety filter | §5 vs §6 | **Contested** — see CTR-008 |

## Post-conditions

- On success: between 1 and 27 new cobweb blocks exist; cooldown started; world state is identical for every observer (R-008).
- On failure: world state is bit-identical to before the activation, and the player may retry immediately.
- In all cases: the handler returns within one tick, having performed at most 27 block reads plus 27 block writes and one raycast. No timer, no queue, no deferred work is created here.

## Concurrency

Two players activating in the same tick produce two independent invocations (§9). Because the handler holds no state between calls and computes its plan from world reads it performs itself, interleaving is safe. The one ordering hazard is two overlapping cubes: whichever handler runs second observes the first's cobweb and classifies those cells as already-web (a no-op write, R-005). Both outcomes are deterministic and identical on every client.
