---
type: "concept-process"
node_id: "L0-once-pblk"
source_channel: "rollout"
title: "Process — Blocked second survival craft"
aliases: ["L0-once-pblk"]
part_of: ["L0-once"]
is_a: ["process"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2739
tags: ["process","craft","blocked","refund","CTR-003","L0-once"]
---

# Process — Blocked second survival craft

**Links** — `part_of: ["L0-once"]` · `is_a: ["process"]` · `relates_to: ["L0-once-ecft", "L0-once-r001", "L0-once-r005", "L0-once-contradiction"]` · `source: §3, §13`

**Trigger.** A player in Survival completes a crafting-table craft whose result is `andrew:web_sword`, and the world craft flag (`L0-once-ecft`) is already set.

**Governing requirement.** §3: *«После первого успешного крафта повторный survival-крафт должен быть заблокирован без потери ингредиентов, насколько это позволяет стабильный API.»* The escape clause is the whole difficulty — see CTR-003 (inherited, open).

## Steps

1. **Detect.** Read the flag; it is set. The craft is denied.
2. **Remove the crafted result** so the player does not obtain a second survival Web Sword. This step is unconditional and is what §13 test 3 (second half) and §14's "no craft dup path" actually test.
3. **Restore the ingredients** — 4× Cobweb and 1× Diamond Sword — to the player's inventory, or drop them at the player's feet if the inventory is full. This step is **conditional on the stable API supporting it** (ASM-011).
4. **Notify the player** with a localized rawtext message explaining that the world's Web Sword has already been forged, ideally naming the original crafter (readable from the flag record, ADR-012). Never a literal string (C-9, ADR-009).

## The degradation ladder (ranked, pending owner decision — CTR-003)

| Rank | Behaviour | Satisfies |
|---|---|---|
| 1 | **Pre-craft veto** — the craft never completes | §3 fully. Preferred if the stable surface offers it (ASM-011 "good direction") |
| 2 | **Detect-and-refund** — craft completes, result removed, ingredients returned | §3's intent; the assumed default |
| 3 | **Blocked-and-consumed** — result removed, ingredients lost | §13 and §14 only. **Requires** the step-4 message, otherwise the player is silently taxed a Diamond Sword per attempt |

The implementation must record which rung it landed on, because rungs 2 and 3 are behaviourally different to a player and only rung 2 satisfies §3's stated requirement. Do not silently ship rung 3 as if it were rung 2.

## Postconditions

- The player has **no** additional `andrew:web_sword`.
- The flag is **unchanged** — a blocked craft neither re-claims nor clears it (R-001).
- No announcement is broadcast. Only the first craft announces (§3).

## Non-goals

- No cooldown, no rate limit, no penalty. Blocking is permanent and stateless beyond the flag.
- No attempt to remove swords the player already holds.

## Verification

`L0-once-accp2` (second craft blocked), `L0-once-accp3` (still blocked after restart), `L0-once-accp7` (ingredient outcome — conditional). §13 test 3 second half, §13 test 4.
