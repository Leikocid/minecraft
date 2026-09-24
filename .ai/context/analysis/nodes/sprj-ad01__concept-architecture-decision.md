---
type: "concept-architecture-decision"
node_id: "L0-sprj-ad01"
source_channel: "rollout"
analysis_version: 1
title: "ADR-sprj-01 — Commit the cooldown at the first hit, re-stamp at resolution"
aliases: ["L0-sprj-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 2183
tags: ["is_a:architecture-decision", "cooldown", "status:proposed", "refines:ADR-025"]
level: 2
---
# ADR-sprj-01 — Commit the cooldown at the first hit, re-stamp at resolution

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-sprj-cx01", "L0-sprj-r005", "L0-lgnd", "ADR-025", "ASM-017", "ASM-023"]` · status: proposed. It refines ADR-025 and does not replace it. L0 numbers it if accepted.

**Context.** ADR-025 writes `cooldown.start` only at resolution, inside the tick. Two paths lose that write:
- The **owner logs out** after a hit. By the next tick the owner's `Player` is invalid, and a player dynamic property cannot be written for an offline player. ASM-023 still requires the cooldown.
- The **server restarts or crashes** mid-volley after a hit. The volley vanishes by design (ADR-023), so it never resolves. The owner rejoins with the ability ready, which breaks §5's "a hit ⇒ full 30 s".

**Decision.**
1. At the **first hit**, call `cooldown.start(owner, "scythe")` while the owner is known to be valid. That makes the cooldown durable at once.
2. At resolution, if the owner is still valid, call `cooldown.start` **again**. That re-stamps `now + 30 s`, so the full 30 s counts from the end of the volley (ASM-017).
3. With `hits = 0`, nothing is ever written. This matches §5, where cancelling costs nothing.

The busy flag hides the early cooldown from the HUD and dispatch while the volley flies: busy wins over cooldown, and the HUD shows "active". The player therefore sees no change from ADR-025's intended behaviour.

**Rejected.**
- (a) Keep end-only writes and write the cooldown in `beforeEvents.playerLeave`. That handler is read-only in stable 2.x (no `setDynamicProperty`), and it does not help with restarts at all.
- (b) Persist volleys to dynamic properties and replay them on load. That contradicts ADR-023 and C-14, and re-creates orphaned state.
- (c) Start the cooldown at activation. That contradicts §5: an escape with no hit must cost nothing.

**Consequences.** `cooldown.start` must be idempotent, as a plain overwrite of `cooldown_until` (it is, per `L0-lgnd`). A restart mid-volley leaves a cooldown that ends ≤ 30 s after the first hit, which is slightly shorter than a clean end. That is accepted.
