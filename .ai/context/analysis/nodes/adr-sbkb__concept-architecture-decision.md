---
type: "concept-architecture-decision"
node_id: "L0-adr-sbkb"
source_channel: "rollout"
analysis_version: 8
title: "ADR-L0-sbkb · The beam's knockback comes from the hit, not from the strikes"
aliases: ["L0-adr-sbkb"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 620
size_chars: 1918
tags: ["v8", "storm-blade", "knockback", "status:accepted", "resolves:L0-strm-cxkb"]
level: 2
---
---
title: "ADR-L0-sbkb · The beam's knockback comes from the hit, not from the strikes (resolves CX-strm-kb)"
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-strm-cxkb", "L0-adr-sbdm", "L0-adr-sblt", "L0-strm-pprb", "L0-strm-rdmg", "L0-strm-rvis"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
---
# ADR-L0-sbkb · The beam's knockback comes from the hit, not from the strikes

## Context
`L0-strm-cxkb` sets two things against each other:
- the spec's "the strikes … do not knock back; the target gets only the 10 HP" (§02, §07);
- the native knockback of `applyDamage(…, { cause: entityAttack, damagingEntity })`.

`L0-adr-sbdm` A picks that attributed call on purpose, to keep armour and kill credit native. `L0-adr-sblt` A spawns no entity, so the strikes cannot push anything (C-30).

## Decision
**Reading (a).**
- The beam's 10 HP is a hit. Any knockback it carries is the hit's own, the same as a vanilla `entityAttack`.
- The spec bans *extra* knockback from the visual strikes, and `adr-sblt` A guarantees that by construction.
- No velocity zeroing and no re-teleport. Either would fight the melee's own knockback on the passive path, and it would add a write per hit.

## Conditions
- Probe **P7** (`L0-strm-pprb`) measures Δvelocity/Δposition after the call.
  - If it shows knockback, add a line to the deviations doc: "the beam hit knocks back like a sword hit; the strikes add none".
  - If it shows none, there is nothing to record.
- The GameTest from `adr-sblt` (no fire, no `lightning_bolt`, bystanders unchanged) also checks that a bystander next to the strike column does not move.
- If Andrey later reads the knockback as wrong on the iPad, that is a new client question. Reading (b) stays available as a local change in `src/storm/damage.ts`.

## Status
`L0-strm-cxkb` is **resolved** by this decision (severity low, non-blocking).
