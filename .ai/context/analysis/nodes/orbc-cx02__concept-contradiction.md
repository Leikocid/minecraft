---
type: "concept-contradiction"
node_id: "L0-orbc-cx02"
source_channel: "rollout"
analysis_version: 5
title: "CX-orbc-02 · On touch, the view-direction target is not the highlighted block"
aliases: ["L0-orbc-cx02"]
is_a: ["contradiction"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1465
tags: ["is_a:contradiction","category:source-vs-engine","severity:medium","status:open","target:L0-orbc","relates_to:L0-adr-orbc","relates_to:L0-orbc-ad01","relates_to:L0-xcx8","relates_to:L0-xq5","touch","escalated_to:L0-xcx14","resolved"]
level: 2
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-orbc-cx02
---

# CX-orbc-02 · On touch, the view-direction target is not the highlighted block

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["contradiction"]` · `relates_to: ["L0-adr-orbc", "L0-orbc-ad01", "L0-xcx8", "L0-xq5"]`

**Target:** `L0-orbc`. **Category:** source vs engine and ADR. **Severity:** medium. **Status:** open.

- **Spec §6.** The player aims at a block. The *ordinary vanilla highlight* is the only marker. Mobile uses "the closest stable equivalent".
- **`L0-adr-orbc` §2.** Both modes resolve the target through `getBlockFromViewDirection` and ignore the event's block.
- **Engine, iPad default "tap to interact" scheme.**
  - The highlighted block and the block that `itemUseOn`, `playerInteractWithBlock` and `entityHitBlock` report is the one under the **finger**.
  - `getViewDirection` points at the screen centre.
  - So `L0-adr-orbc` would fire at a block other than the highlighted one whenever the finger is off-centre.
  - Touch also reports no tap at a block beyond reach, so on default touch **RMB 6–10 is not reachable either**. This extends `L0-xcx8` from LMB to both modes.
- This is not verified on the device. It comes from the documented touch interaction model, and must be confirmed on the `ipad` channel before `ad01` is accepted.

**Proposed:** `L0-orbc-ad01`, which prefers the event block, with the view ray as the fallback. Also add to `L0-xq5`: "Is 10-block range on iPad acceptable only with the crosshair (split) control layout?"
