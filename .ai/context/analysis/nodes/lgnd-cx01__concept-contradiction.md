---
type: "concept-contradiction"
node_id: "L0-lgnd-cx01"
source_channel: "rollout"
analysis_version: 2
title: "CX-lgnd-01 · \\"Ready\\" on the Action Bar: shown once (Web Sword, shipped) vs shown while held (Scythe)"
aliases: ["L0-lgnd-cx01"]
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1285
tags: ["target:L0-lgnd","status:open","category:source-vs-source","severity:low","hud","resolved"]
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

**Source A** — `webswordspecv1ruen-part-1` §8 requires only the remaining time while holding the sword. Shipped `src/websword/cooldown.ts` `renderFor` (verified) writes `andrew.web_sword.ready` **once**, in the first HUD pass after the cooldown ends, and otherwise writes nothing — so the bar is free for vanilla/other messages.

**Source B** — `scytheofcalamityspecv1ruen-part-1` §6: *«При удержании … показывать состояние способности в Action Bar. Когда готова: Ready / «Готово». Во время кулдауна: оставшееся время.»* — i.e. a continuous state display while held, framed next to the "common legendary rule" on hands.

**Why it matters.** The HUD is a single framework module (`L0-lgnd-r007`). If the Scythe behaviour is a common rule, the Web Sword HUD changes from 0.3.0; if not, the framework needs a per-weapon `readyMode` (the current interim design in `L0-lgnd-p005`).

**Resolution needed.** Client: should both weapons show "Ready" continuously while held, or only the Scythe? Interim: per-weapon `readyMode` (`once` for Web Sword, `while-held` for Scythe).
