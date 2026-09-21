---
type: "concept-acceptance-criterion"
node_id: "L0-trap-ac07"
source_channel: "rollout"
title: "AC-07 — Placed cobweb survives the caster leaving, and is ordinary world state"
aliases: ["L0-trap-ac07"]
part_of: ["L0-trap"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1348
tags: ["acceptance-criterion","spec-12","persistence","L0-trap"]
---

# AC-07 — Placed cobweb survives the caster leaving, and is ordinary world state

**Source:** §12 — *«Игрок выходит сразу после активации: уже созданная паутина остаётся.»* · §5, §9 · **Owner after reduce:** `L0-qatg` · **Rule:** R-005

**GIVEN** a player who activates the ability successfully,
**WHEN** the player disconnects immediately afterwards, and later the world is saved and the server restarted,
**THEN** every placed cobweb block is still present and unchanged, **AND** it is `minecraft:web` — the vanilla block, carrying no custom state, marker or owner.

**Second half:** another player or a mob interacts with the cobweb by normal Minecraft rules (§9) — it slows movement, it breaks with shears or a sword, it drops string. No component logic mediates any of this.

**Negative assertion:** no despawn or expiry occurs. Cobweb cleanup is out of scope by decision (L0 boundary); if a future change introduces a timer, this criterion fails and that is the intended signal.

**Note on the cooldown half of §12's bullet.** The same spec line continues *«cooldown должен сохраняться настолько, насколько это требуется общей системой cooldown проекта»* — that clause belongs to `L0-cool` and is entangled with CTR-004 / Q-009. This criterion covers the **cobweb** half only.

**Surface:** GameTest for placement + Docker BDS restart check.
