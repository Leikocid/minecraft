---
type: "concept-architecture-decision"
node_id: "L0-adr-scyt"
source_channel: "rollout"
analysis_version: 1
level: 0
title: "ADR-L0-scyt · Scythe tuning, when its cooldown is committed, and Stage-2 ordering"
aliases: ["L0-adr-scyt"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 2407
tags: ["title:ADR-L0 Scythe tuning, cooldown commit and Stage-2 ordering", "reduce", "cross-component"]
---
---
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-scyt", "L0-sprj", "L0-lgnd", "L0-infr", "L0-sitm", "L0-scyt-cx02", "L0-sprj-ad02", "L0-sprj-ad01", "L0-sprj-cx01", "L0-lgnd-r009", "L0-lgnd-r003", "cool-asm5"]
requires: ["L0-lgnd", "L0-infr"]
status: accepted
---
# ADR-L0-scyt · Scythe tuning, when its cooldown is committed, and Stage-2 ordering

**1. Projectile tuning (`L0-scyt-cx02`).**
- Follow the live `L0-sprj-ad02`: **0.5 block/tick, pure pursuit, no turn limit**.
- Where `sprj` says nothing, adopt from the retired rollup design: a hit radius of 1.0, a 5-tick stagger and a 200-tick lifetime.
- Keep every value in one exported `SCYTHE_TUNING` constant, and have the GameTest timing windows read them from there.
- ASM-018 is kept. The rollup's ASM-029 (0.6 plus a turn limit) is retired together with `L0-scpr` (`L0-adr-scope` §4). This agrees with L0's `cool-asm5` (finite lifetime, staggered launch).

**2. Cooldown commit (`L0-sprj-cx01`).** Accept `L0-sprj-ad01` as an amendment to ADR-025: commit at the first hit and re-stamp at resolution. It is checked against the framework:
- `L0-lgnd-r003`: the ability owner calls `start`. ✔
- `L0-lgnd-r009`: busy wins over cooldown while the volley flies, and at resolution busy clears and `start` runs in one turn. ✔ The early write is invisible because busy hides it.
- `cooldown.start` must be an idempotent overwrite. `lgnd` guarantees that.

**3. Ordering, as the reduce invariant requires.** The Scythe **depends on the `lgnd` generalisation**. Today the framework is specific to the Web Sword: one cooldown slot per player, one pending mark, main hand only, `ws_*` ids hard-coded, and no busy or `hud.notify`. The Stage-2 Scythe plan is:
1. `lgnd` generalisation + Web Sword migration (`L0-lgnd-p006`, gate `L0-lgnd-ac11`), including `hud.notify` (`L0-adr-cast`) and the `as03` probe (`L0-adr-lgnd`).
2. `L0-sitm` item/recipe/assets, including the Scythe's `allow_off_hand`.
3. `L0-scyt` targeting (`p001`) on `isHiddenFromTargeting`.
4. The `L0-sprj` volley engine.
5. DEMO: GameTest on the `bds` channel through `L0-infr`, then the iPad pass.

C-11 is met: the Web Sword part of Stage 2 closed at `f22896a`. Steps 2–4 cannot be merged before step 1.

**Not resolved here:** `L0-sprj-cx02` (the lethal branch under Resistance V). It keeps its interim option (a) as a documented exception to C-15, and it does not block.
