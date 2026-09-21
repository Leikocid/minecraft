---
type: "concept-process"
node_id: "L0-cool-proc1"
source_channel: "rollout"
title: "Process: Activation Cooldown Gate"
aliases: ["L0-cool-proc1"]
part_of: ["L0-cool"]
is_a: ["process"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 1943
tags: ["process","cooldown","L0-cool"]
level: 2
---

# Process: Activation Cooldown Gate

The synchronous sequence this component participates in on every Web Sword use attempt, shared with `L0-trap` per ADR-006's forced ordering: **validate reach → check cooldown → place cells → start cooldown.**

## Steps

1. **(L0-trap)** Player uses the Web Sword; item-use event fires server-side.
2. **(L0-trap)** Reach-bounded raycast resolves a target, or fails. On failure, the sequence stops here — this component is never called.
3. **(L0-cool)** `L0-trap` calls `isReady(player, "andrew:web_sword")`. This component reads the player's `CooldownRecord`; returns `true` if absent or expired, `false` otherwise. **Read-only** — no state changes.
4. **(L0-trap)** If not ready, the sequence stops; nothing is placed, nothing is written by this component.
5. **(L0-trap)** If ready, the 3×3×3 safety-filtered cobweb placement proceeds (owned entirely by `L0-trap`).
6. **(L0-cool)** On confirmed placement completion, `L0-trap` calls `start(player, "andrew:web_sword")`. This component writes a fresh `CooldownRecord` with `readyAtTick = currentTick + durationTicks` (R-cool-001, R-cool-002, R-cool-003).
7. **(L0-cool)** The next actionbar render tick (`L0-cool-proc2`) picks up the new record automatically — no separate notification is needed.

## Invariants enforced

- Step 3 never mutates state (R-cool-002's failure-safety depends on this).
- Step 6 is reached **only** from a confirmed success; there is no other call site for `start()`.
- If step 2 or step 3 fails, no cooldown is started and any prior, still-active cooldown record is left untouched.

## Failure/edge handling

- Concurrent activations by different players are independent by construction — each record is keyed by `playerId` (C-5, §9).
- A player who logs out mid-cooldown keeps their record (player-scoped storage, `L0-cool-adr1`); rejoining re-reads the same record and `isReady` resumes correctly with no special-case code.
