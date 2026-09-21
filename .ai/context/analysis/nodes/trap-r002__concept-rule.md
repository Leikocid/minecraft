---
type: "concept-rule"
node_id: "L0-trap-r002"
source_channel: "rollout"
title: "R-002 — Targeting is bounded by ordinary survival reach; no artificial long ray"
aliases: ["L0-trap-r002"]
part_of: ["L0-trap"]
is_a: ["rule"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1635
tags: ["rule","reach","targeting","L0-trap"]
---

# R-002 — Targeting is bounded by ordinary survival reach; no artificial long ray

**Links** — `part_of: ["L0-trap"]` · `is_a: ["rule"]` · `relates_to: ["L0-trap-ptgt", "L0-trap-as17", "L0-trap-ac02"]`

**Rule.** The target must lie within normal survival interaction/melee reach of the activating player. A candidate beyond that distance is not a target — the activation fails. No extended, boosted or custom-range ray may be used to reach further.

**Source.** §5: *«Дальность: обычная survival interaction/melee reach — без искусственного дальнего луча.»* · §5: *«Если корректной цели нет или цель вне допустимой дистанции, способность не срабатывает.»* · §12: *«Цель за пределами reach: ничего не происходит, cooldown не тратится.»* The L0 boundary lists "artificial long-range targeting" as **excluded by decision**.

**Rationale.** Reach is the weapon's balance lever. An unbounded ray turns a close-quarters trap into a sniping tool and changes PvP entirely — which is why the spec states the prohibition twice and the boundary restates it a third time.

**Applies to.** The ray length passed to the raycast, and the final bound-check on the resolved point (`L0-trap-ptgt` steps 1 and 6). Both must use the same single named constant (ASM-017), so one owner answer retunes the whole component.

**Edge.** Creative mode reach differs from survival reach in vanilla. Which one applies to a Creative-mode holder is unspecified — recorded in ASM-017; defaulting to the survival value for all game modes is the conservative choice.

**Verified by.** `L0-trap-ac02` (§13: *«Use вне reach ничего не создаёт и не запускает cooldown»*).
