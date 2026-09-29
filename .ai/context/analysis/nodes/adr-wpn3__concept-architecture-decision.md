---
type: "concept-architecture-decision"
node_id: "L0-adr-wpn3"
source_channel: "rollout"
analysis_version: 3
title: "ADR-L0-wpn3 · v3 amendment of `L0-adr-wpn2`"
aliases: ["L0-adr-wpn3"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-adr-wpn2", "L0-lgnd", "L0-webs", "L0-scyt", "L0-orbc", "L0-pntr", "L0-ring", "L0-lgnd-ad08", "L0-lgnd-ad10", "L0-lgnd-ad11", "L0-lgnd-cx11", "L0-lgnd-cx12", "L0-xcx9", "L0-xcx10", "L0-xcx11", "L0-xq3", "L0-adr-hold"]
see_also: ["L0-adr-oprt", "L0-adr-odrp"]
requires: ["L0-adr-wpn2"]
priority: 540
size_chars: 3941
tags: ["status:accepted", "v3-reduce", "amends:L0-adr-wpn2", "resolves:L0-lgnd-cx11", "resolves:L0-lgnd-cx12", "closes-via:L0-xcx9", "closes-via:L0-xcx10", "closes-via:L0-xcx11", "answers:L0-xq3", "relates_to:L0-lgnd", "relates_to:L0-webs", "relates_to:L0-scyt", "relates_to:L0-orbc", "relates_to:L0-adr-wpn2"]
level: 2
---
# ADR-L0-wpn3 · v3 amendment of `L0-adr-wpn2`

**Status:** accepted (reduce, v3). **Amends:** `L0-adr-wpn2`. **Resolves:** `L0-lgnd-cx11`, `L0-lgnd-cx12`. **Closes through:** `L0-xcx9` → `L0-lgnd-ad08`, `L0-xcx10` → `L0-lgnd-ad10` (+ `L0-adr-oprt`), `L0-xcx11` → `L0-lgnd-ad11`.

## Context
The reduce plan requires `xcx9`–`xcx11` to close through `lgnd` ADRs that amend `wpn2`.
- The `lgnd` ADRs exist (`ad08`, `ad10`, `ad11`, all *proposed*).
- Only `ad11` mentions `wpn2`, and only as a prerequisite. None records which `wpn2` rows it changes.
- `lgnd-cx11` shows that the `wpn2` backlog did not ship before structures, and v3 now depends on it.

This ADR records the amendment once, so that `webs`/`scyt` (carried at v2) inherit it without a re-run.

## Amendments to `wpn2`
| `wpn2` row | v3 ruling | Owner ADR |
|---|---|---|
| `lgnd-cx09` (3), return target "as-built owner until `xq3`" | **Last holder.** The mark carries `holder`, and `owed` is keyed by holder. Orbital §5 gives this general rule, and it answers `L0-xq3` for all three weapons (realises `L0-adr-hold`). | `lgnd-ad11` → accepted |
| `lgnd-cx09` (1)(2), `gen` guard and `_owed` list | Unchanged in substance, but **now step 1 of the `lgnd` v3 task**, not a separate epic. `holder` return without `gen` would hand the new holder a live duplicate (C-7). | `wpn2` + `lgnd-ad11` §6 |
| `lgnd-cx08`/`cx10`, `allow_off_hand` + off-hand read | Also step 1 of the `lgnd` v3 task. The Cannon's HUD and `resolveActivation(…,"use")` read the off hand (`lgnd-ac16`). | `wpn2` |
| (new) craft gate | Any unmarked stack no longer claims the craft. Only a recipe-output **craft token** claims it. `/give` and Creative copies of all three weapons never set or refund the flag. | `lgnd-ad08` → accepted |
| (new) destruction | "Not destroyed" = prevent → spill → return. Tier 1 is mandatory for the Cannon's effects through `protectLegendariesIn` under the contract in `L0-adr-oprt`. | `lgnd-ad10` → accepted, with the wording fixed by `L0-adr-odrp` §3 |
| (new) nested containers (`lgnd-cx12`) | **Known limit (C-16)**: a legendary inside a shulker-box *item* or a bundle cannot be seen, protected or returned on stable 2.10.0. `p008` also moves any shulker-box item entity in its volume out (option c). This goes on the client deviation list; it is not asked. | this ADR |

## Sequencing (binding on task creation)
The `lgnd` v3 task runs in this order:
1. the `wpn2` backlog (`allow_off_hand` ×2, the off-hand read, `gen`, the `owed` list, the Scythe till check, and the AC rewrites `ac01`/`ac07`/`ac08`/`ac10`);
2. `holder`;
3. craft tokens (this also rewrites the Web Sword and Scythe recipes and their GameTest craft fixtures);
4. activation mode and the `ORBITAL_CANNON` def;
5. `protectLegendariesIn` per `L0-adr-oprt`.

After the merge, re-open every `ipad` criterion that the orchestrator auto-closed (`ac04`–`ac06`, `lgnd-ac15` iPad half), per memory "Orchestrator auto-verifies manual criteria". `orbc` does not start until this task's steps 4–5 are merged **and** `L0-xcx14`/`L0-xq5` are settled.

## Consequences
- `L0-xcx9`, `L0-xcx10` and `L0-xcx11` close when the `lgnd` v3 task merges with `lgnd-ac15`, `ac18`, `ac19` and `ac20` green on `bds`. They are **not** closed at analysis time.
- `webs` and `scyt` inherit last-holder return, the token gate and the destruction policy with no re-analysis. Their ACs affected by the rule change are already rewritten inside `lgnd` (`ac15`, `ac18`).
