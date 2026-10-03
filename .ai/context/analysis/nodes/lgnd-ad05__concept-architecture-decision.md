---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad05"
source_channel: "rollout"
analysis_version: 6
title: "AD-lgnd-05: Busy is memory-only; cooldown deadlines are durable"
aliases: ["L0-lgnd-ad05"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1357
tags: ["architecture-decision", "cooldown", "busy", "persistence"]
level: 2
---
---
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent3", "L0-lgnd-r009", "L0-sprj", "L0-sprj-cx01"]
---
# AD-lgnd-05: Busy is memory-only; cooldown deadlines are durable

**Context.** The Scythe volley spans many ticks (Scythe §4–5): while it flies, a second Use must do nothing, and a cooldown starts only if at least one projectile hit. The Web Sword cooldown must survive reconnect and restart (Web Sword §12, shipped behaviour).

**Decision.** Two separate stores:
- Cooldown deadline: player dynamic property `andrew:cd_<abilityKey>` (as built, `ad07` §3), epoch ms (`Date.now()`), durable.
- Busy: a durable `andrew:busy_<abilityKey>` deadline (`ad07` §2, `cooldown.ts:61-71`), cleared on resolution and on `playerLeave`.

**Rejected.**
- (a) Persist busy as a dynamic property. A crash or restart mid-volley would leave the ability stuck "active" until an operator cleared it, and the projectiles it refers to no longer exist.
- (b) Encode busy as a far-future cooldown deadline. Then a 0-hit volley (which must not start a cooldown) would need a rollback write, and the HUD could not tell "active" from "cooling".

**Consequence.** A restart during a volley makes the Scythe ready again with no cooldown, even if a hit already landed. That edge is the open `L0-sprj-cx01`; this decision accepts it rather than risk a stranded state.
