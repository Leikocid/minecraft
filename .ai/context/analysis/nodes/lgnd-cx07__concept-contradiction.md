---
type: "concept-contradiction"
node_id: "L0-lgnd-cx07"
source_channel: "rollout"
analysis_version: 5
title: "CX-lgnd-07 · The 0.3.0 Web Sword cooldown key is orphaned on upgrade"
aliases: ["L0-lgnd-cx07"]
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 530
size_chars: 1356
tags: ["is_a:contradiction","source-vs-code","migration","status:open","resolved"]
level: 2
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-lgnd-cx07
---

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad01", "L0-lgnd-ac01", "L0-lgnd-r006", "L0-lgnd-ent3"]
status: open
category: source-vs-code
---
# CX-lgnd-07 · The 0.3.0 Web Sword cooldown key is orphaned on upgrade

**Design.** `L0-lgnd-ad01`, `ent3` and `ac01` say the Web Sword keeps `andrew:ws_cooldown_until`, so a sword that is cooling at upgrade time is still cooling afterwards. `ac01` asserts: "P's HUD shows the Web Sword cooling with ≤ 20 s".

**Code.**
- 0.3.0 (`git show 392253d^:src/websword/state.ts`) wrote `DP_COOLDOWN_UNTIL = "andrew:ws_cooldown_until"`.
- The framework (`src/legendary/registry.ts` `cooldownKey`) reads and writes `andrew:cd_web_sword`.
- Nothing reads the old key (grep over `src/` finds no match).

**Effect.** After the upgrade, every Web Sword that is cooling becomes ready at once. The dead key stays on the player forever. The worst case is losing one cooldown of at most 30 s. There is no duplication and no loss of the craft flag, marks or pending, because those keys are unchanged (`andrew:ws_*` via `keysFor`).

**Resolution needed.** Choose one:
- (a) Accept, and rewrite `ac01` without the cooldown clause.
- (b) Have `remainingMs` fall back to `andrew:ws_cooldown_until` for `web_sword` (a one-line legacy read).

Autopilot default: (a). The impact is at most 30 s, once, per player.
