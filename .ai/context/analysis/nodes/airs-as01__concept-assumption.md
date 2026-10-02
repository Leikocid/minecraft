---
type: "concept-assumption"
node_id: "L0-airs-as01"
source_channel: "rollout"
analysis_version: 5
title: "Assumption (CAN_ASSUME) — the Airship's two doors sit on the short ends of the long axis"
aliases: ["L0-airs-as01"]
is_a: ["assumption"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 1041
tags: ["is_a:assumption", "can-assume", "template"]
level: 2
---
# Assumption (CAN_ASSUME) — the Airship's two doors sit on the short ends of the long axis

**Gap.** §5.2 says only "две обычные двери на противоположных сторонах" — opposite sides, without saying which axis (the 15-block long sides or the 7-block short ends).

**Assumption.** Doors sit on the two short ends (the 7-block-wide faces), i.e. at the bow and stern of the elongated-oval gondola, consistent with "вытянутый овальный объём" (an elongated oval reads lengthwise, so entry naturally sits at the ends, and this keeps both doors clear of the 4 rooms/corridor's long side walls where chest and lamp geometry is denser).

**Impact if wrong.** Purely a template-geometry choice for `infr`'s builder (`L0-adr-tmpl`). It does not change chest count, chest positions relative to rooms, the spawner position, or any generation/collision/altitude rule. If the client meant the long sides, only the door local points (and the `rotateLocal` inputs derived from them) need to move; no other artifact in this deep-dive depends on the axis chosen.
