---
type: "concept-process"
node_id: "L0-once-pcft"
source_channel: "rollout"
title: "Process — First successful survival craft"
aliases: ["L0-once-pcft"]
part_of: ["L0-once"]
is_a: ["process"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2826
tags: ["process","craft","first-craft","announcement","L0-once"]
---

# Process — First successful survival craft

**Links** — `part_of: ["L0-once"]` · `is_a: ["process"]` · `relates_to: ["L0-once-ecft", "L0-once-ebrd", "L0-once-r001", "L0-once-r004", "L0-once-r006", "L0-item"]` · `source: §3, §9`

**Trigger.** A player completes a crafting-table craft whose result is `andrew:web_sword`.

**Precondition.** The world craft flag (`L0-once-ecft`) is unset.

## Steps

1. **Confirm the craft actually completed.** The flag is claimed only for a craft that produced a real result item. Claiming earlier spends the world's budget on a craft that may not exist — the irreversible failure described in CTR-006.
2. **Read the crafting player's game mode.** If it is Creative, exit to `L0-once-pexm` (exemption path) — no flag write, no announcement. See R-003 and ASM-013 for non-survival modes other than Creative.
3. **Read the flag.** If already set, this is not the first craft — exit to `L0-once-pblk`.
4. **Claim the flag.** Write the record (`L0-once-ecft`) in the *same synchronous handler invocation* as the read in step 3. This read-check-write pair is the atomic claim; nothing may `await` or yield between them. This is what makes the §9 craft race safe under C-5 (R-004, ASM-015, ADR-011).
5. **Leave the sword with the crafter.** The result item is not touched. The crafter owns the world's one survival-crafted Web Sword.
6. **Broadcast the announcement** (`L0-once-ebrd`) to all players currently online, as rawtext with translate keys and the crafter's name substituted via `with` (R-006, ADR-009, C-9). Players who join later do not receive a replay (ASM-012).

## Ordering contract

**confirm craft → check mode → read flag → write flag → announce.**

Both adjacent orderings are wrong and fail in opposite directions:

- *Announce before write* — a throw between the two announces a craft that was never recorded, re-opening the budget. C-7 dup path.
- *Write before confirm* — spends the budget on a craft that did not produce an item. CTR-006, unrecoverable.

## Postconditions

- Flag set and durable across logout, world save and server restart (R-002, C-6).
- Exactly one survival-crafted Web Sword exists as a result of this process.
- All online players have seen a localized announcement naming the weapon and the crafter.

## Failure handling

If the flag write fails, the craft **must not** be announced and the gate must treat the budget as unspent — a silently-failed write followed by a silent success message is the worst outcome, because the player believes the craft is spent while the world believes otherwise. Surface the failure to the content log (`bds:check` greppable, C-11) rather than swallowing it.

## Verification

`L0-once-accp1` (craft succeeds + announced), `L0-once-accp5` (concurrent crafts), `L0-once-accp8` (RU/EN render). §13 test 3, first half.
