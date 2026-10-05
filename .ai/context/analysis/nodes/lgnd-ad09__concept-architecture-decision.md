---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad09"
source_channel: "rollout"
analysis_version: 7
title: "AD-lgnd-09: `resolveActivation(player, mode)` with a per-def `activations` list; attack reads the main hand only"
aliases: ["L0-lgnd-ad09"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 2578
tags: ["v3-delta", "status:proposed"]
level: 2
---
---
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-adr-orbc", "L0-lgnd-r015", "L0-lgnd-p009", "L0-lgnd-ac16", "L0-lgnd-ad07", "L0-lgnd-r004", "L0-xasm10", "L0-xq5"]
---
# AD-lgnd-09: `resolveActivation(player, mode)` with a per-def `activations` list; attack reads the main hand only

**Context.**
- The Orbital Cannon is the first legendary with two triggers, LMB (Attack/Hit Block) and RMB (Use), and both share one cooldown (Orbital §6).
- `hands.ts` answers one question today: which held legendary a **Use** press activates (main if ready and not busy, else off).
- `L0-adr-orbc` §3 asks for a `mode` argument.

**Decision.**
1. The signature becomes `resolveActivation(player, mode: "use" | "attack" = "use")`. Existing callers (`trap.ts`, `scythe/targeting.ts`) keep compiling and keep their behaviour.
2. **Candidates** are the held legendaries whose `def.activations` includes `mode`.
3. **`use`:** main, then off, each only if ready and not busy. This is unchanged. A ready main that refuses does not fall through (`ad04`).
4. **`attack`: main hand only.** Vanilla attacks with the main-hand item. A left click with a Web Sword in the main hand is a sword swing, and it must not fire an off-hand Cannon. If the main hand is not an attack-capable legendary, or it is not ready, the result is `undefined`.
5. **One activation per press, even across modes.** The Cannon calls `startCooldown` in the same synchronous turn as a successful activation. So a second event in the same tick resolves to `undefined` and needs no extra latch. This covers a touch gesture that raises both `entityHitBlock` and `itemUse` (`L0-xasm10`). A no-target press writes nothing, so a same-tick second event also finds no target and does nothing.
6. The resolver still does not run the ability or pick the target. The attack event subscription, the raycast and the Creative break cancel belong to `L0-orbc`.

**Rejected.**
- (a) **Attack falls through to the off hand like `use`.** A player swinging a sword would fire a 5×5 column delete from the other hand. That is surprising, and the spec says nothing that requires it.
- (b) **A separate `resolveAttack()`.** It would duplicate the ready/busy logic, and the priority rule would stop having one owner.
- (c) **A per-tick activation latch in the framework.** It is redundant with the synchronous cooldown write, and it is one more piece of state.

**Consequence.** The off-hand Cannon is reachable by Use only, and only through a main-hand legendary Use press (`as07`). The HUD shows it in either hand (Orbital §7).
