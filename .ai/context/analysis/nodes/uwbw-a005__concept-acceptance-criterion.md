---
type: "concept-acceptance-criterion"
node_id: "L0-uwbw-a005"
source_channel: "rollout"
analysis_version: 10
title: "AC-uwbw-005 (bds) · A miss keeps the charge; a hit starts 30 s"
aliases: ["L0-uwbw-a005"]
is_a: ["acceptance-criterion"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 791
tags: ["v10", "underwater-bow", "bds", "cooldown", "§5-3", "C-41"]
level: 2
---
# AC-uwbw-005 (bds) · A miss keeps the charge; a hit starts 30 s

**Links.** relates_to: L0-uwbw-r001, L0-uwbw-parm, L0-uwbw-earm. Spec §5 bullet 3.

- **Miss.** GIVEN an armed sim player, WHEN the armed arrow hits each of these in turn:
  - a block;
  - a raised front shield;
  - an armour stand;
  - and it then despawns,

  THEN `ub:armed` stays true, the cooldown reads 0, and the HUD reads armed.
- **Hit.** WHEN the next arrow hits a zombie, THEN:
  - `ub:armed` is false;
  - the cooldown reads 600 ± 1 ticks;
  - the HUD reads cooldown;
  - one strike witness is logged.
- **Cooldown.** Arming during the cooldown is refused; at expiry the HUD reads ready.
- **Order.** A shot fired *before* arming never spends the charge.
- **Negative control.** An unarmed hit starts no cooldown.
