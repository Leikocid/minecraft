---
type: "concept-rule"
node_id: "L0-loot-r006"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-loot-r006"]
is_a: ["rule"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 798
tags: ["is_a:rule", "relates_to:L0-loot-p001", "relates_to:L0-loot-p002", "relates_to:L0-strf"]
level: 2
---
**Rule:** A chest's contents (custom or vanilla path) are determined exactly once, at structure init, and never regenerate — not on reopen, not on chunk unload/reload, not on server restart. If the chest block itself is broken, its already-rolled contents drop per normal vanilla block-break rules (this component does not special-case that).

**Rationale:** spec §2 (shared structure rules), §3 preamble ("Содержимое каждого сундука определяется один раз при создании/первой инициализации"), §13.6/§13.7, §15 shared addendum.

**Scope:** both `L0-loot-p001` and `L0-loot-p002` — the one rule shared across both mechanisms. The "exactly once" guarantee is enforced by `strf`'s instance registry (`L0-adr-strs`), not by this component; this component's obligation is simply to not re-trigger itself.
