---
type: "concept-contradiction"
node_id: "L0-lgnd-cx01"
source_channel: "rollout"
analysis_version: 7
title: "CX-lgnd-01 · \\"Ready\\" on the Action Bar: shown once (Web Sword, shipped) vs shown while held (Scythe)"
aliases: ["L0-lgnd-cx01"]
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1285
tags: ["target:L0-lgnd","status:resolved","category:source-vs-source","severity:low","hud","resolved"]
level: 2
closed_at: 2026-09-24
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-lgnd-cx01
---

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p005", "L0-lgnd-r007", "L0-lgnd-ent1"]
---
# CX-lgnd-01 · "Ready" on the Action Bar: shown once (Web Sword, shipped) vs shown while held (Scythe)

**Source A** — `webswordspecv1ruen-part-1` §8 requires only the remaining time while holding the sword. 0.3.x (`37a0403:src/websword/cooldown.ts:155-156`) wrote it once; since `392253d` `src/legendary/hud.ts` shows it continuously.

**Source B** — `scytheofcalamityspecv1ruen-part-1` §6: *«При удержании … показывать состояние способности в Action Bar. Когда готова: Ready / «Готово». Во время кулдауна: оставшееся время.»* — i.e. a continuous state display while held, framed next to the "common legendary rule" on hands.

**Why it matters.** The HUD is a single framework module (`L0-lgnd-r007`). Resolved by decision-resolve-l0-lgnd-cx01: continuous for both; `readyMode` not built.

**Resolution needed.** Resolved by decision-resolve-l0-lgnd-cx01: continuous for both; `readyMode` not built.
