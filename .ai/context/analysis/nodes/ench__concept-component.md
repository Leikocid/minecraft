---
type: "concept-component"
node_id: "L0-ench"
source_channel: "rollout"
analysis_version: 10
title: "L0-ench · The enchanting table (§4): feasibility first"
aliases: ["L0-ench"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 640
size_chars: 4078
tags: ["v10", "enchanting", "feasibility", "gated:xq11", "blocking:ench-build"]
level: 1
---
# L0-ench · The enchanting table (§4): feasibility first

**is_a:** component · **part_of:** L0 · **relates_to:** L0-adr-enrl, L0-xcx32, L0-xq11, L0-xasm39, L0-trdt, L0-sclk, L0-uwbw, L0-lgnd

**Source:** spec v2 §4 and §5 bullets 4–6 (`underwaterbowmacefireworksenchantingspecv2ruen-part-1/2/3`). **Constraints:** C-2, C-16, C-37, C-38, C-39, C-20⁶.

## Responsibility
The spec asks that the vanilla table offer every item-compatible vanilla enchantment, treasure ones included, with these rules:
- curses: never;
- the 20 % rare stage;
- the 70/40/20 level rule for Wind Burst and Unbreaking;
- vanilla maximum levels and conflicts.

Stable 2.10.0 has no table hook (`xcx32`). So this component owns three things, and only the first two are always built:
1. **The feasibility probe and its written verdict** (C-38). It runs on checks (19136), plus one iPad observation, and answers four questions:
   - Can anything observe the offers or the applied result?
   - Can a SimulatedPlayer operate a table?
   - Which treasure enchantments can 1.26.51 already reach at the table (the Mace and Wind Burst, spear Lunge)?
   - Can a table result be told apart from an anvil, command or loot result?

   The verdict feeds `L0-xq11` together with the option table from `L0-adr-enrl`.
2. **The pure roller `src/enchanting/roll.ts`.** It has no `@minecraft/server` import and takes an injectable RNG. It holds:
   - the eligibility table (vanilla data, minus curses, minus each def's forbidden list);
   - the conflict groups;
   - the rare stage;
   - the level rule.

   Its proof is statistical, through unit tests (C-39). Those are `in_process`, so they close only the unit criteria.
3. **The engine adapter, only if Andrey approves it in `xq11`.** It is (a) a post-hoc re-roll or (b) a custom station; (c) means no adapter. It is proven on `bds` where a SimulatedPlayer can reach it and on `ipad` otherwise. The C-37 scrubs (`src/legendary/enchant.ts`, `src/sculk/enchant.ts`) keep running after it.

## Inputs
- **Vanilla 1.26.51 enchantment data:** slot → enchantments, max levels, treasure flags and conflicts. It is checked against the engine's own `enchantable` answers on BDS.
- **Per-def forbidden lists:**
  - `FORBIDDEN_ENCHANTMENTS` in `src/legendary/enchant.ts:10` (trident: loyalty, riptide);
  - `PIERCING` for `SCULK_CROSSBOW` in `src/sculk/enchant.ts:7`.
- **A roll request:** `{itemId, tier 1|2|3, rng}`.
- **The answer to `xq11`.**

## Outputs
- A feasibility verdict document (the `src/enchanting/README.md` "Verdict" section), with evidence for each question.
- `rollEnchantments()` → an `EnchantRoll` with a trace (`L0-ench-ent1`).
- A unit suite: statistics, plus the conflict and curse fuzz.
- One of two endings:
  - an approved adapter with its deviation note;
  - no adapter, with a limitation report: §5 bullets 4–6 are marked "not deliverable on stable Bedrock" in the acceptance sheet and the release notes (C-38).

## Not in scope
- Anvils, books, villager trades and loot tables stay vanilla.
- Lunge stays unchanged if it is already offered.
- No Experiments, beta APIs or Molang UI overrides (C-2).
- The bow's own enchantability belongs to `uwbw` (`minecraft:enchantable` slot `bow`).

## Seams
| With | What |
|---|---|
| `trdt` / `lgnd` | `FORBIDDEN_ENCHANTMENTS` is read, never copied (`L0-ench-r003`). |
| `sclk` | Piercing is excluded for the Sculk Crossbow. Today it is a separate constant, so the roller reads both sources. |
| `uwbw` | Def #8 is a custom item with slot `bow`. It is eligible through the slot data, and nothing extra is needed. |

## Children
- **Processes:** `prob` (the probe), `roll` (the roller).
- **Rules:** `r001`–`r005`.
- **Entity:** `ent1`.
- **ACs:** `ac01`–`ac06`.
- **ADR:** `adr1`.
- **Assumption:** `asm1`.
- **Contradiction:** `cx01`.
- **Glossary:** `gl01`–`gl03`.

## Closing paths (from the plan)
- **(a)/(b) approved:** the hook is built and the preview deviation is documented.
- **(c) or no answer:** the roller stays dormant and tested, and the limitation is reported. `xcx32` closes on Andrey's answer.
