---
type: "concept-entity"
node_id: "L0-ench-ent1"
source_channel: "rollout"
analysis_version: 10
title: "Entity · RollRequest / EnchantRoll / ProbeVerdict"
aliases: ["L0-ench-ent1"]
is_a: ["entity"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 2009
tags: ["v10", "enchanting", "roller", "api"]
level: 2
---
# Entity · RollRequest / EnchantRoll / ProbeVerdict

**is_a:** entity · **part_of:** L0-ench · **relates_to:** L0-ench-roll, L0-ench-prob

## RollRequest (the input to `rollEnchantments`)
| Field | Type | Notes |
|---|---|---|
| itemId | string | A vanilla or `andrew:` id; looked up in `ELIGIBILITY`. |
| tier | 1 \| 2 \| 3 | The table tier / cost class. It caps levels (`r005`, `xasm39`). |
| rng | () => number | Uniform in [0, 1). Injected; `Math.random` in production. |

## EnchantRoll (the output)
| Field | Type | Notes |
|---|---|---|
| enchantments | `{id: string, level: number}[]` | The result. It holds no curse, no forbidden id and no conflicting pair. |
| eligible | boolean | False when the item has no eligible set. Not a generation. |
| rareStage | `'hit' \| 'miss' \| 'none'` | `none` means the item has no eligible rare enchantment, so it is excluded from the 20 % statistic. |
| trace | `TraceEntry[]` | Every draw: `{stage:'rare'\|'count'\|'pick'\|'level', id?, u, success?}`. For the level rule it holds all three level rolls. |

## Static data in `roll.ts`
- `ELIGIBILITY: Map<itemId, EnchantId[]>`, generated from 1.26.51.
- `MAX_LEVEL: Map<EnchantId, number>`.
- `TREASURE: Set<EnchantId>`. This is the formerly table-inaccessible set, finalised by the probe.
- `CURSES = {binding, vanishing}`.
- `CONFLICT_GROUPS: EnchantId[][]` (`r002`).
- `SPECIAL_LEVEL = {wind_burst, unbreaking}`.

## ProbeVerdict (a document section, not code)
| Field | Content |
|---|---|
| version | Bedrock 1.26.51, `@minecraft/server` 2.10.0 stable. |
| q1Observability | The signals table: present / absent / ambiguous, with evidence. |
| q2SimTable | yes/no, with the scenario name. |
| q3Reachable | For each slot, the treasure set already offered at the table; the Mace and Wind Burst; spear Lunge. |
| q4Signature | The source × signal matrix and its ambiguous rows. |
| options | The option table (a)/(b)/(c) with costs. |
| claim | The exact sentence used in the release notes / acceptance sheet. |
