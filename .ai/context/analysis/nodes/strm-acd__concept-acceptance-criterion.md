---
type: "concept-acceptance-criterion"
node_id: "L0-strm-acd"
source_channel: "rollout"
analysis_version: 8
title: "AC strm-acd (bds)"
aliases: ["L0-strm-acd"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 1583
tags: ["v8", "storm-blade", "channel:bds", "damage", "C-29", "C-32"]
level: 2
---
---
title: "AC strm-acd · Exact pre-armour 10 / +6, in-window proof, passive rate (bds)"
is_a: ["acceptance-criterion"]
part_of: ["L0-strm"]
relates_to: ["L0-strm-rdmg", "L0-xcx26", "L0-strm-asm1"]
---
# AC strm-acd (bds)

1. **Active, out of window.**
   - GIVEN an armoured SimulatedPlayer A and a twin B, WHEN A is hit by the beam and B by `applyDamage(10, entityAttack)` from a control source, THEN Δhealth(A) = Δhealth(B), and both are > 0 and < 10.
   - The same holds against a zombie with armour.
2. **Passive, in window, with the RNG forced to proc.**
   - Δhealth(target) after a blade melee + bonus = Δhealth(twin, vanilla diamond sword) + Δhealth(twin2, a native `applyDamage(6)` out of window).
   - **Negative control (red proof) in the same test:** a plain `applyDamage(6)` inside the window takes 0 while returning true.
3. **Active inside a melee window** (meleed ≤ 10 ticks before) nets the full armoured 10, not 10 − L.
4. **No double count.** A forced passive with no active, and an active with no passive, each change health by exactly one event's amount.
5. **Lethal path.** At low health a target holding a totem pops it. A target without one dies, the death message names the wielder, and XP and kill credit go to the wielder.
6. **Bystanders.** A second mob ≤ 2 blocks from the target has Δhealth = 0 for both events.
7. **Rate.**
   - Seeded: N = 10 000, rate in [0.29, 0.31], and both stub branches are covered.
   - Live: N ≥ 600 real hits, rate in [0.25, 0.35].
   - A forced proc while the active is on cooldown leaves the cooldown remaining unchanged.
