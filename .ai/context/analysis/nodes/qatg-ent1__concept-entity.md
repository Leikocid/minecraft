---
type: "concept-entity"
node_id: "L0-qatg-ent1"
source_channel: "rollout"
title: "Entity — Acceptance Test (AT)"
aliases: ["L0-qatg-ent1"]
part_of: ["L0-qatg"]
is_a: ["entity"]
relates_to: ["L0-qatg-ent2", "L0-qatg-p001"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2594
tags: ["entity","acceptance-test","L0-qatg"]
---

# Entity — Acceptance Test (AT)

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["entity"]` · `relates_to: ["L0-qatg-ent2", "L0-qatg-p001"]` · `spec: ["§13"]`

One row of the twelve-item list in §13. The unit the Acceptance Matrix is built from.

## Attributes

| Attribute | Type | Meaning |
|---|---|---|
| `id` | `AT-1`..`AT-12` | Stable id, assigned in §13 bullet order (this analysis's numbering, not present in the spec text) |
| `spec_text` | RU quote | The literal §13 bullet |
| `owner_component` | `L0-item` \| `L0-once` \| `L0-keep` \| `L0-trap` \| `L0-cool` \| `L0-trap`+`L0-once` (AT-12 only) | The L1 component whose `concept-acceptance-criterion` artifact executes this test |
| `harness_mechanism` | one or more of: `npm test`, `bds:check`, `bds:gametest`, `iPad visual pass`, `2-client BDS LAN` | Where the evidence comes from (see `L0-qatg` component doc, harness table) |
| `environment` | `single-player` \| `multiplayer` \| `both` | Per §14's conjunction |
| `status` | `unclaimed` \| `claimed-no-artifact` \| `specified` \| `green` \| `red` | Current state as of this analysis |

## The twelve, as currently known

| AT | Spec fragment | Owner | Status at this analysis |
|---|---|---|---|
| AT-1 | Visible in Creative Equipment, catalogue/search, `/give` | `L0-item` | specified (`L0-item-ac*`) |
| AT-2 | Recipe = 4 Cobweb + Diamond Sword | `L0-item` | specified |
| AT-3 | First craft succeeds + announced; second blocked | `L0-once` | specified (`L0-once-accp*`) |
| AT-4 | Second craft still blocked after world restart | `L0-once` | specified |
| AT-5 | No durability loss after prolonged use | `L0-item` | specified |
| AT-6 | Normal melee = Diamond Sword, no cobweb | `L0-item` | specified |
| AT-7 | Use on valid target creates ~full 3×3×3 cobweb | `L0-trap` | claimed-no-artifact |
| AT-8 | Use out of reach: nothing, no cooldown spent | `L0-trap` | claimed-no-artifact |
| AT-9 | Reuse blocked 30s after success | `L0-cool` | claimed-no-artifact (component not yet deep-dived) |
| AT-10 | Protected block inside volume survives; valid cells still fill | `L0-trap` | claimed-no-artifact |
| AT-11 | No ground drop on death, no dup on return | `L0-keep` | specified (`L0-keep-ac01`, `ac02`) |
| AT-12 | Two clients see identical cobweb + world state | `L0-trap` + `L0-once` | claimed-no-artifact |

**Reading this table.** "claimed-no-artifact" means the decomposition plan already assigns an owner (§5/§6/§8 → `L0-trap`/`L0-cool`); it is a sequencing gap, not an ownership gap. `L0-qatg-p001` re-checks this table each time a sibling publishes.
