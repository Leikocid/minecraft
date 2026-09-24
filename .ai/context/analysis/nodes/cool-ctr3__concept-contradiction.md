---
type: "concept-contradiction"
node_id: "cool-ctr3"
source_channel: "rollout"
analysis_version: 1
title: "CTR-3 · Main/off-hand priority was deferred for Web Sword, but the Scythe spec requires off-hand display now"
aliases: ["cool-ctr3"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 970
tags: ["target:L0-lgnd","status:open","category:source-vs-decision","title:Off-hand priority deferred vs required","resolved"]
closed_at: 2026-09-24
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-cool-ctr3
---

# CTR-3 · Main/off-hand priority was deferred for Web Sword, but the Scythe spec requires off-hand display now

**Decision** — `decision-q-010-main-hand-off-hand-priority-otlozheno`: main-hand/off-hand priority deferred (Web Sword spec §8 phrases it as "если в будущем…").

**Source** — `scytheofcalamityspecv1ruen-part-1` §6: show ability state in the Action Bar when the Scythe is held «в основной **или второй** руке», and apply the main-hand-first / off-hand-fallback rule as a **common legendary rule** (no "in future" wording).

Once a second legendary exists, a player can hold Web Sword in the main hand and Scythe in the off hand, so the deferred case becomes reachable in Stage 2. (Vanilla Bedrock allows only some items in the off hand; custom items need `allow_off_hand`.)

**Resolution needed.** Re-open q-010: implement hand priority and off-hand Action Bar in the `lgnd` framework as part of the Scythe work, or explicitly keep the Scythe main-hand-only.
