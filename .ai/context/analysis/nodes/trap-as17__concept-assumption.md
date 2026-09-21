---
type: "concept-assumption"
node_id: "L0-trap-as17"
source_channel: "rollout"
title: "ASM-017 — Reach is the vanilla survival interaction distance, same in every game mode"
aliases: ["L0-trap-as17"]
part_of: ["L0-trap"]
is_a: ["assumption"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1823
tags: ["assumption","CAN_ASSUME","reach","L0-trap"]
---

# ASM-017 — Reach is the vanilla survival interaction distance, same in every game mode

**Status:** `CAN_ASSUME` · **Affects:** `L0-trap` · **Source:** §5's *«обычная survival interaction/melee reach»*

**Assumed.** The reach bound is the vanilla **survival** interaction/melee distance measured from the player's eye — conventionally ~5 blocks for entity interaction on Bedrock — expressed as one named constant and applied identically regardless of the activating player's game mode.

**Basis.** §5 names the value only by reference to vanilla behaviour and states the prohibition (*«без искусственного дальнего луча»*) rather than a number. §12 restates the boundary without quantifying it. No number appears anywhere in the spec or the KV.

**Why one value for all game modes.** Vanilla Creative reach is longer than survival reach. The spec ties the ability to *survival* reach without exempting Creative, and §3/§4 treat Creative purely as an admin/test channel. Using the survival value everywhere keeps the balance lever single-valued and keeps an admin's test result representative of survival play.

**Impact if wrong.** Low structurally, real in play. Too short and the ability misfires at ranges players expect to work, burning nothing but feeling broken. Too long and it edges toward the "artificial long ray" the spec excludes by decision — a balance regression, not a correctness bug. Because it is one constant used twice (ADR-014), correcting it is a one-line change. `L0-trap-ac02` pins it by asserting just-inside and just-outside the bound, so a wrong value is at least *visible* rather than silent.

**How to close.** Measure the vanilla interaction distance empirically on Bedrock 1.26.51 via a GameTest sweep, and confirm with the owner whether Creative holders should get the longer vanilla reach.
