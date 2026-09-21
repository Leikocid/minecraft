---
type: "concept-assumption"
node_id: "L0-qatg-asm3"
source_channel: "rollout"
title: "ASM-Q3 — The iPad visual pass is a mandatory, not optional, part of the gate"
aliases: ["L0-qatg-asm3"]
part_of: ["L0-qatg"]
is_a: ["assumption"]
relates_to: ["L0-qatg-gl05"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1555
tags: ["assumption","ipad","verification","L0-qatg"]
---

# ASM-Q3 — The iPad visual pass is a mandatory, not optional, part of the gate

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["assumption"]` · `relates_to: ["L0-qatg-gl05"]` · `governed_by: ["C-11"]`

**Assumed.** Although §14's five bullets never mention "iPad" or a visual check by name, AT-1 (Creative Equipment/catalogue visibility) and part of AT-9 (actionbar readout) are claims about client-side rendering that no BDS-side mechanism can evidence (C-11). This analysis treats the iPad visual pass as mandatory for those specific rows, not as an optional nice-to-have layered on top of an otherwise-complete BDS-only gate.

**Basis.** C-11: *"iPad answers 'does it look right?' (Creative visibility, icon, RU/EN rendering, actionbar). Neither can substitute for the other."* — stated as a structural limit of the environment, inherited unchanged by this component.

**Impact if wrong.** If a future stable-API surface lets `bds:check` assert on Creative-menu placement or actionbar text server-side, the iPad pass could be demoted to corroboration-only for those rows, simplifying `L0-qatg-p002`. Until then, skipping the iPad pass leaves AT-1's and part of AT-9's claims with zero evidence, not partial evidence — the DoD cannot honestly report green.

**How to falsify cheaply.** Check whether `@minecraft/server` 2.10.0 exposes any inspectable Creative-catalogue or actionbar-rendering API — if `L0-item`'s or `L0-cool`'s deep-dive already answered this for their own ASM/Q items, reuse that finding rather than re-deriving it here.
