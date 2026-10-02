---
type: "concept-rule"
node_id: "L0-orbc-r011"
source_channel: "rollout"
analysis_version: 5
title: "Rule · On unload or restart, in-flight charges are lost"
aliases: ["L0-orbc-r011"]
is_a: ["rule"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 850
tags: ["is_a:rule", "relates_to:L0-orbc-p003", "relates_to:L0-orbc-ad03", "lifecycle"]
level: 2
---
# Rule · On unload or restart, in-flight charges are lost

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-p003", "L0-orbc-ad03", "L0-orbc-ac19"]`

- There is no ticking area, force-load or chunk pinning for charges (§11).
- A charge whose entity is invalidated, or whose next cell is in an unloaded chunk, is **lost**:
  - it is removed from the attack;
  - it gets no `onDetonate`;
  - no cooldown change is made.
- Charges that were in flight during a server shutdown are not saved or restored. On the next start, and on each later chunk load, stale charge entities are removed and **never detonate** (`p003`).
- What survives a restart: the cooldown (a `lgnd` dynamic property) and the craft flag (`lgnd`).
- A lost charge leaves no entity behind once its chunk is next loaded (C-19).

Source: Orbital §11 and AC-19.
