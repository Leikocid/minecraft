---
type: "concept-rule"
node_id: "L0-orbc-r014"
source_channel: "rollout"
analysis_version: 5
title: "Rule · The charge contract published to `pntr` and `ring`"
aliases: ["L0-orbc-r014"]
is_a: ["rule"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1378
tags: ["is_a:rule", "relates_to:L0-pntr", "relates_to:L0-ring", "contract", "cross-component"]
level: 2
---
# Rule · The charge contract published to `pntr` and `ring`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-pntr", "L0-ring", "L0-orbc-p002", "L0-orbc-r007", "L0-orbc-r011"]`

`src/orbital/charge.ts` exports:
```ts
type Mode = "lmb" | "rmb";
interface Effect {
  /** Charge columns (x,z) for an attack locked on `target`. LMB: [target.xz]. */
  layout(target: Vector3): Array<{x: number; z: number}>;
  /** Called once per charge at its contact cell. Must be synchronous-safe; heavy work goes to its own bounded runJob. */
  onDetonate(dim: Dimension, point: Vector3, ownerId: string, mode: Mode, attackId: string): void;
  scale: 0 | 1;          // 1.2× TNT for LMB, 1.0× for RMB
}
registerEffect(mode: Mode, effect: Effect): void;
```

**Guarantees from `orbc`:**
- `point` is an integer block location of a contact block (`r008`) in a loaded chunk.
- `onDetonate` is called at most once per charge.
- It is never called for a voided or lost charge, or an orphan.
- The owner may be offline.
- There is no refund path.

**Duties of effects:**
- Never move or remove other charges.
- Tolerate multiple `onDetonate` calls for one `attackId` in one tick (RMB).
- Own all block, entity and drop rules.

Any effect that needs a different charge behaviour (speed, collision, height) raises an L0 contradiction; it does not fork the charge (L0 reduce plan).
