---
type: "concept-acceptance-criterion"
node_id: "L0-trdt-a003"
source_channel: "rollout"
analysis_version: 9
title: "AC-trdt-003 (bds) · Dash, fall grant, swim boost"
aliases: ["L0-trdt-a003"]
is_a: ["acceptance-criterion"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 920
tags: ["above-water-trident", "bds", "dash", "fall", "swim", "C-35", "C-36"]
level: 2
---
# AC-trdt-003 (bds) · Dash, fall grant, swim boost

**Links.** relates_to: L0-trdt-pmov, L0-adr-twrp, L0-xasm36, L0-xasm37.

- **Dash.** GIVEN a dry platform, clear weather, and a sneaking sim player releasing after 10 ticks of charge, THEN:
  - horizontal displacement is within ± 20 % of the P4 Riptide III value;
  - this holds in the Overworld, the Nether and the End;
  - a second dash right after also launches (no cooldown);
  - a release under 10 ticks moves nothing.
- **Fall.** WHEN the dash ends in a fall worth ≥ 5 HP, THEN the first landing deals 0. A following fall from the same height deals normal damage (drop − 3). An unused grant expires after 10 s.
- **Swim.** A sprint-swimming sim player:
  - holding the trident (main hand, then off hand) has horizontal speed 5.6 b/s ± 15 %;
  - without it, its speed equals the P6 baseline ± 10 %;
  - after a hotbar switch, the speed falls back within 2 ticks.
