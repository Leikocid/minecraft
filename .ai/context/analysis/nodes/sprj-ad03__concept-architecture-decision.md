---
type: "concept-architecture-decision"
node_id: "L0-sprj-ad03"
source_channel: "rollout"
analysis_version: 1
title: "ADR-sprj-03 — Split a pure volley core from the engine adapter"
aliases: ["L0-sprj-ad03"]
is_a: ["architecture-decision"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 1580
tags: ["is_a:architecture-decision", "testability", "status:proposed"]
level: 2
---
# ADR-sprj-03 — Split a pure volley core from the engine adapter

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-sqat", "L0-sprj-p002", "L0-sprj-p003"]` · status: proposed.

**Context.** §8 tests 5–10 need controlled target movement (escape before or after a hit, dodging until expiry) and exact HP readings. SimulatedPlayer can be moved, but its tick timing is coarse, and the v2 finding holds: SimulatedPlayer is invisible to non-beta packs in some paths (memory: BDS/GameTest limits). The FSM has 7 terminal outcomes, which are expensive to cover through the engine alone.

**Decision.**
- `volleyCore.ts` holds pure functions with no `@minecraft/server` import: `step(volley, {targetPos, ownerValid, targetValid, tick}) → {volley', events[]}`, where events are `hit`, `resolve(outcome)` and `commitCooldown`.
- `volley.ts` is the adapter. It resolves entities, calls `step`, and turns the events into health, knockback, particles, sounds and `cooldown.*` calls. It also owns the `runInterval` and the event subscriptions.
- `truedamage.ts` wraps ADR-022 behind `applyTrueDamage(target, 3, owner)`.

The core is unit-tested with synthetic positions under the project's existing test runner, and GameTest covers the adapter end-to-end (true damage against armour, blocks unchanged, cleanup).

**Rejected.** (a) Test everything through GameTest. Outcomes that depend on timing, such as the same-tick hit and escape (`L0-sprj-r008`), become flaky. (b) Put the FSM inline in the interval callback. It cannot be tested without the engine.
