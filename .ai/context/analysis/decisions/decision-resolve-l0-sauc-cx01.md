---
type: "decision"
node_id: "decision-resolve-l0-sauc-cx01"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-sauc-cx01: Hover = min(centre + 40, ceiling - 15);…"
aliases: ["decision-resolve-l0-sauc-cx01"]
is_a: ["decision"]
relates_to: ["L0-sauc-cx01"]
refs: ["L0-sauc-cx01"]
priority: 500
statement: "Hover = min(centre + 40, ceiling - 15); arrival/departure at hover + 10; a Cannon charge (at most heightRange.max - 1) always starts above the hull."
resolves_contradiction: "L0-sauc-cx01"
outcome: "changed"
evidence: "spec commit 2441fb5 (docs/UFO_Magnet_Spec_v1_RU_EN.docx §2/§5, AC-2/AC-10), re-imported into ufomagnetspecv1ruen-part-*"
decided_at: "2026-10-02"
tags: ["refine","resolution"]
size_chars: 148
---

Hover = min(centre + 40, ceiling - 15); arrival/departure at hover + 10; a Cannon charge (at most heightRange.max - 1) always starts above the hull.
