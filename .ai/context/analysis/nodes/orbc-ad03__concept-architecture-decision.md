---
type: "concept-architecture-decision"
node_id: "L0-orbc-ad03"
source_channel: "rollout"
analysis_version: 3
title: "ADR-orbc-03 · Attacks live in memory only; stale charge entities are swept, never resumed"
aliases: ["L0-orbc-ad03"]
is_a: ["architecture-decision"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1481
tags: ["is_a:architecture-decision", "status:proposed", "relates_to:L0-orbc-p003", "relates_to:L0-orbc-r011", "C-15"]
level: 2
---
# ADR-orbc-03 · Attacks live in memory only; stale charge entities are swept, never resumed

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-orbc-p003", "L0-orbc-r011", "L0-adr-ochg"]`

**Status:** proposed.

**Context.**
- §11 allows in-flight charges to be lost on unload or restart.
- C-15 rank 1 is no save corruption, and C-19 is no leftover temporaries.
- The engine saves the charge entities in chunk data, so they reappear on reload.

**Decision.**
- The attack and charge registry is a `Map` in memory, with no dynamic properties.
- On `entityLoad`, `entitySpawn` and startup, any `andrew:orbital_charge` whose attack tag is not in the map is `remove()`d (`p003`).
- An orphan is never resumed or detonated.

**Rejected.**
- *Persisting attacks (world dynamic property) and resuming after reload*: a late blast minutes after firing would surprise players, it adds write traffic for about 160 charges, and it is a crash-consistency risk. §11 explicitly does not require it.
- *A ticking area per attack*: this is forbidden in spirit by §11 ("no forced loading"), and it is capped at 10 areas.
- *A `minecraft:despawn` or `instant_despawn` component on the entity, driven by a script event*: that is still needed for the unloaded case, so it adds nothing over the tag sweep.

**Consequence.** A charge in an unloaded chunk stays in the save until that chunk is next loaded, and is then removed at once. This is invisible to players.
