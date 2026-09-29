---
type: "concept-contradiction"
node_id: "L0-lgnd-cx08"
source_channel: "rollout"
analysis_version: 3
title: "CX-lgnd-08 · Hand priority is coded, but neither item can be held in the off hand"
aliases: ["L0-lgnd-cx08"]
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 530
size_chars: 1309
tags: ["is_a:contradiction","source-vs-code","hand-priority","status:open","resolved"]
level: 2
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-lgnd-cx08
---

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r004", "L0-lgnd-as07", "L0-lgnd-ac04", "L0-lgnd-ac05", "L0-lgnd-ac06", "L0-scyt-r009", "L0-sitm", "cool-ctr3"]
status: open
category: source-vs-code
---
# CX-lgnd-08 · Hand priority is coded, but neither item can be held in the off hand

**Decision/spec.**
- decision-legendary-hand-priority and decision-resolve-cool-ctr3 require hand priority to be implemented now.
- `L0-lgnd-r004` and `L0-scyt-r009` require `minecraft:allow_off_hand: true` on both items.

**Code.**
- `src/legendary/hands.ts` resolves main, then off hand.
- `hud.ts` renders both hands.
- `grep -rl allow_off_hand packs/` finds **no** item JSON. Without that component, Bedrock does not let a custom item be placed in the off-hand slot.

**Effect.**
- The off-hand branch of `resolveActivation` is dead in practice.
- `ac04` and `ac05` (two-hand press) and `ac06` (two-segment HUD) cannot be set up on a real client.
- A GameTest can still force the slot through `Equippable.setEquipment(Offhand)`, which would give a false pass.

**Resolution needed.** One of:
- `L0-sitm`/`L0-webs` add `minecraft:allow_off_hand: true` to both items, and `as07` is then measured on 1.26.50.
- Or the client confirms that off-hand is out of scope, and the two-hand ACs are dropped.
