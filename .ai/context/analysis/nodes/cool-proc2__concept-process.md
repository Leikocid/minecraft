---
type: "concept-process"
node_id: "L0-cool-proc2"
source_channel: "rollout"
title: "Process: Actionbar Countdown Render Loop"
aliases: ["L0-cool-proc2"]
part_of: ["L0-cool"]
is_a: ["process"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 1612
tags: ["process","actionbar","L0-cool"]
level: 2
---

# Process: Actionbar Countdown Render Loop

The one recurring-tick component of the Web Sword feature (C-4's named exception), scoped strictly to players holding a tracked ability's item.

## Steps

1. A single scheduled interval runs at a fixed cadence (`L0-cool-asm2`: proposed 20 ticks / ≈1 real-time second — finer than a 30 s countdown needs).
2. For each **online player currently holding** an item whose type matches a registered `AbilityRegistration.itemTypeId` (main or off hand, `L0-cool-asm3`) — and *no one else* (R-cool-004) — do steps 3-5.
3. Read that player's `CooldownRecord` for the held item's `abilityKey`.
4. If absent or `readyAtTick <= currentTick`: clear the actionbar, or simply write nothing further this tick — the ability is ready; §8's *"когда cooldown закончился, способность снова доступна"* needs no persistent "ready" banner.
5. Else: compute `remainingSeconds = ceil((readyAtTick - currentTick) / 20)` and render it via `player.onScreenDisplay.setActionBar(...)` using the `.lang` key from `AbilityRegistration.readoutTranslateKey`, with `remainingSeconds` substituted (C-9, ADR-009, R-cool-005).

## Invariants enforced

- The loop never touches a player who is not holding a tracked item this tick (R-cool-004) — holding state is re-evaluated every cadence tick, not cached.
- The loop is read-only with respect to `CooldownRecord`; it never writes, extends, or resets a timer.

## Open questions feeding this process

Exact cadence (`L0-cool-asm2`) and "holding" scope, i.e. main-hand-only vs. either hand (`L0-cool-asm3`), are recorded as assumptions, not fixed by the spec.
