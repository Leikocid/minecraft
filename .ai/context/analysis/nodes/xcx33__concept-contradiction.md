---
type: "concept-contradiction"
node_id: "L0-xcx33"
source_channel: "rollout"
analysis_version: 11
title: "CX-L0-33 · How is the bow's charge armed?"
aliases: ["L0-xcx33"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 640
size_chars: 2064
tags: ["v10","underwater-bow","status:open","input-conflict","has-default","resolved"]
level: 1
closed_at: 2026-10-25
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx33
---

---
title: "CX-L0-33 · The bow's ability is \"switched on\", but Use already draws the bow"
aliases: ["L0-xcx33", "Bow arming gesture"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-uwbw", "L0-lgnd", "L0-xasm38", "L0-adr-ubfl", "L0-xcx28"]
see_also: ["underwaterbowmacefireworksenchantingspecv2ruen-part-1"]
governs_files: ["src/legendary/hands.ts", "src/legendary/cooldown.ts"]
---
# CX-L0-33 · How is the bow's charge armed?

**Side A: spec v2 §1.** "Активное умение … включение заряжает следующий УСПЕШНЫЙ выстрел" ("an active ability … switching it on charges the next SUCCESSFUL shot"). It has a 30 s cooldown and a UI status. The spec names **no input** for switching it on.

**Side B: the framework contract.**
- An active legendary claims **Use** (`resolveActivation`, `src/legendary/hands.ts:37`). Its cooldown starts when activation succeeds (`src/legendary/cooldown.ts:5`).
- On a bow, Use *is* the draw and shot. Taking Use for the ability would make the bow unable to shoot, and leaving Use alone leaves the ability unreachable.
- The cooldown here starts on a **later hit**, not at activation, so the framework's ordering does not fit either.

**Precedent.** The trident had the same "one input, two behaviours" clash (`xcx28` / `xq9`). Its default was sneak = the alternate behaviour.

**Default (CAN_ASSUME, `xasm38`).**
- **Sneak + start of Use arms the charge** while the bow is ready. The draw continues normally, so arming and shooting can be one gesture.
- Use while not sneaking is a plain shot, and a plain shot never arms.
- Arming while already armed does nothing.
- Arming during the cooldown is refused, with the HUD showing the seconds left.

The `lgnd` seam has two parts: the cooldown start is deferred until the hit, and the HUD gets a third "armed" state. Reduce records these as a widening, or schedules `lgnd` (see the plan).

**Closes when** Andrey confirms or replaces the gesture. This can ride along with `xq11` as a non-blocking sub-question. Otherwise it ships as the default with a note on the acceptance sheet.
