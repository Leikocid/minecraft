---
type: "concept-assumption"
node_id: "L0-wrdn-as02"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-wrdn-as02"]
is_a: ["assumption"]
part_of: ["L0-wrdn"]
relates_to: ["L0-wrdn"]
priority: 530
size_chars: 986
tags: ["CAN_ASSUME", "is_a:assumption", "mobs"]
level: 2
---
**ASM-wrdn-02 · No mobs beyond the 2 Shriekers (and Warden via their mechanic) are placed**

§13 never mentions spawners or one-time guard mobs for Mini Warden City, unlike Windmill (3 vanilla-like spawners + 10 persistent Zombie Villagers) and Mini Bastion (7–10 Piglins + 2 Piglin Brutes, explicitly "спавнеры не требуются, охрана — одноразовый набор").

**Assumption:** Mini Warden City deliberately ships with zero placed/spawned mobs of its own — the only hostile presence is the vanilla Shrieker→Warden chain, and ordinary ambient mob spawning in its dark interior (if any occurs under vanilla rules) is not a concern the spec addresses and is not something the add-on suppresses or augments.

**Impact if wrong:** if a guard mob or spawner was intended but dropped from the doc, difficulty/balance testing (and the acceptance-test sampling in `L0-wrdn-ac07`) would miss it. Medium-low risk — worth a one-line confirmation if the client is asked about the structure's difficulty.
