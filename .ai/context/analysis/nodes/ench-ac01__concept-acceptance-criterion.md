---
type: "concept-acceptance-criterion"
node_id: "L0-ench-ac01"
source_channel: "rollout"
analysis_version: 10
title: "AC-ench-01 · The probe verdict exists, with evidence, and is attached to xq11"
aliases: ["L0-ench-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 1056
tags: ["v10", "enchanting", "probe", "C-38", "channel:bds", "channel:ipad"]
level: 2
---
# AC-ench-01 · The probe verdict exists, with evidence, and is attached to xq11

**is_a:** acceptance-criterion · **part_of:** L0-ench · **relates_to:** L0-ench-prob, L0-xq11

**GIVEN** BDS 1.26.51 on checks (19136), with `@minecraft/server` 2.10.0 stable and no Experiments,
**WHEN** the `enchanting-probe` scenarios run and iPad observations O1 (when the level drop happens vs when the item returns) and O2 (what the table offers for the Mace, the spear, boots, a bow and a trident) are recorded,
**THEN** `src/enchanting/README.md` § Verdict:
- answers Q1–Q4, each with a scenario name or an observation id;
- includes the option table (a)/(b)/(c) from `L0-adr-enrl`;
- states, in plain words, whether the vanilla table's offers can be changed.

**AND** the verdict is attached to the `xq11` message sent to Andrey.

**Channels:**
- `bds` for Q1.1, Q1.2, Q1.4, Q2 (a SimulatedPlayer `interactWithBlock` on a table → no change in 40 ticks, with `/enchant` as a positive control) and Q4's scriptable rows;
- `ipad` for O1/O2 and Q4's table and anvil rows.
