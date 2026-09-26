---
type: "concept-architecture-decision"
node_id: "L0-strf-d004"
source_channel: "rollout"
analysis_version: 2
title: "ADR-strf-04 — Collision is a 3D AABB test with a 2-block margin, not a 2D footprint test"
aliases: ["L0-strf-d004"]
is_a: ["architecture-decision"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1111
tags: ["is_a:architecture-decision", "status:proposed", "collision", "relates_to:L0-strf-r006", "relates_to:L0-airs"]
level: 2
---
# ADR-strf-04 — Collision is a 3D AABB test with a 2-block margin, not a 2D footprint test

**Context.** §2/§5.5 forbid "физическое пересечение" and structures that "разрезать друг друга". The Airship floats 40–70 blocks up, and Warden City lies at Y −35…−45. A 2D test would forbid any Airship above any structure and any Warden City under a Windmill.

**Decision.** Use a 3D rotated AABB, expanded by 2 blocks on all sides, against registry AABBs and probed blocks. Only the linked Airship's rule "не должен висеть прямо над Мельницей" (§5.6) adds a 2D exclusion. That exclusion is `airs`-specific and is applied in its ring search, not in `strf`'s generic check.

**Rejected.** *2D footprint overlap.* It over-cancels vertically separated structures and lowers Airship and Warden City rates without any spec basis. *No margin.* Structures could touch wall-to-wall, fusing doors and walls, which reads as "cut".

**Consequences.** An independent Airship may hover above a Windmill's fields. This is allowed, because only the *linked* Airship is barred from that. It is documented for the reviewers of test 33.
