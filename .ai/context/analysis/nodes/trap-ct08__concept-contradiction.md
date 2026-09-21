---
type: "concept-contradiction"
node_id: "L0-trap-ct08"
source_channel: "rollout"
title: "CTR-008 — §5 and §6 disagree about an activation that places zero cells"
aliases: ["L0-trap-ct08"]
part_of: ["L0-trap"]
is_a: ["contradiction"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2867
tags: ["contradiction","open","source-internal","target:L0-trap","L0-trap","resolved"]
closed_at: 2026-09-21
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-trap-ct08
---

# CTR-008 — §5 and §6 disagree about an activation that places zero cells

- **Status:** `open` · **Category:** source-internal · **Target node:** `L0-trap` · **Severity:** Medium

## The disagreement

| Where | Statement |
|---|---|
| §5 | *«Если корректной цели нет или цель вне допустимой дистанции, способность не срабатывает и cooldown не запускается.»* — failure is free |
| §8 | *«Cooldown способности: ровно 30 секунд после успешного **создания ловушки**.»* — the cooldown is priced against a trap actually existing |
| §6 | *«Если часть куба защищена, пропустить только эти клетки; остальные допустимые клетки всё равно заполнить паутиной.»* — skipping is normal and does not fail the activation |
| L0 boundary | *"A partially-blocked cube is a success, not a failure — it still consumes the cooldown."* |

Between them sits a case neither settles: a target that is **valid and in reach**, but whose entire 27-cell volume is skipped. Every cell is bedrock, or inside a wall of chests, or outside the loaded area. §6's logic says this is just the extreme of partial skipping — a success, cooldown consumed. §5 and §8 say the cooldown is the price of *creating a trap*, and no trap was created.

## Why this is a real conflict, not a gap

It is reachable in ordinary play, not a contrived case: standing on the Nether bedrock floor and aiming down, activating at the world's build ceiling, or aiming into a storage room wall. And the two readings differ in exactly the way players notice — one costs 30 seconds of disarmament for nothing, the other lets a player re-click freely while probing.

Both readings are defensible from the text, and the component **cannot pick one** without deciding a balance question the spec reserves to its author. No §13 test covers it, so whichever is implemented will ship unexamined.

## Consequence either way

- *Zero cells = success.* Simple, uniform with §6, and punishing: a player pinned against bedrock is disarmed for 30 s per attempt. It is also the implementation you get by accident, since "did the plan complete?" is the easy predicate.
- *Zero cells = failure.* Matches §8's wording most literally and is kinder, but introduces a free-probe: a player can click repeatedly at no cost to discover whether a volume is protected, which leaks information about hidden storage.

## Suggested resolution

Ask the owner to rule directly, and add the answer to §13 as a test. Recommendation: **zero cells = failure, cooldown not consumed** — it follows §8's *«после успешного создания ловушки»* most closely, and the information-leak objection is weak given the volume is visible anyway. But record it as the owner's call, and note that the third option (*zero cells = success with a localized "no valid space" message*) needs a translate key from `L0-item` and so must be decided before `L0-item` closes its catalogue.
