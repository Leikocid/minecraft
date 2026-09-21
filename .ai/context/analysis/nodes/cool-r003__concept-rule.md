---
type: "concept-rule"
node_id: "L0-cool-r003"
source_channel: "rollout"
aliases: ["L0-cool-r003"]
part_of: ["L0-cool"]
is_a: ["rule"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 1236
tags: ["rule","invariant","cooldown","keying","L0-cool"]
level: 2
---

**R-cool-003 — Cooldown is keyed by player + ability, never by item instance.**

Source: ASM-009 (inherited), ADR-007 (inherited).

The cooldown record's key is `(playerId, abilityKey)`. A player holding two Web Swords (e.g. one crafted, one admin-given per §4) shares exactly one timer between them. The service's public API must not accept an item or item-stack identifier as part of the key, and must not derive the key from which physical sword instance triggered the activation.

**Consequences:**
- Swapping which Web Sword is in hand mid-cooldown has no effect on the timer.
- A future second ability (e.g. weapon #2) gets its own `abilityKey` and therefore its own independent record for the same player — the two do not share a cooldown unless explicitly designed to.

**Rationale.** Per-instance keying would let a player alternate two copies to bypass the 30 s limiter entirely, defeating the weapon's only balance mechanism (ASM-009's impact-if-wrong).

**Note on verification.** §13's twelve acceptance tests do not exercise the two-copies-in-inventory case directly; this rule is structurally enforced by the entity model (`L0-cool-ent1`) rather than caught by a specific test, similar to ASM-008's gap note for `L0-trap`.
