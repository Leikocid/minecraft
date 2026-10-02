---
type: "concept-contradiction"
node_id: "L0-ufoc-cx01"
source_channel: "rollout"
analysis_version: 5
title: "CX-ufoc-1 · `L0-adr-ufom` §4 needs a \"transient\" `andrew:ufo_active` flag to survive a restart, while §2 and C-23 allow only two durable properties"
aliases: ["L0-ufoc-cx01"]
is_a: ["contradiction"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1415
tags: ["is_a:contradiction", "status:resolved", "category:source-vs-source", "relates_to:L0-adr-ufom", "relates_to:L0-ufoc-ad03", "C-23"]
level: 2
---
# CX-ufoc-1 · `L0-adr-ufom` §4 needs a "transient" `andrew:ufo_active` flag to survive a restart, while §2 and C-23 allow only two durable properties

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["contradiction"]` · `relates_to: ["L0-adr-ufom", "L0-ufoc-ad03", "L0-ufoc-p003"]` · **target:** `L0-adr-ufom` · **status:** resolved (reduce v5, `L0-adr-ufrs`) · **category:** source-vs-source

- **`L0-adr-ufom` §2:** durable state is *only* `andrew:ufo_next_ms` and `andrew:ufo_enabled`.
- **C-23:** "Only the schedule and the enable flag are durable."
- **`L0-adr-ufom` §4:** at world load, `next_ms` is set to now + 15 min "if an event had been running, recorded by a transient `andrew:ufo_active` flag".

  Anything read at load must have been written before the restart. So the flag is either durable, which contradicts §2 and C-23, or it is in memory, in which case it is always false at load and the UFO §10 "+15 min after a restart" never applies.

**Options.**
- (a) Encode the in-flight state as `next_ms = 0` (`L0-ufoc-ad03`). This keeps two properties, and C-23 holds literally.
- (b) Accept a third durable property `andrew:ufo_active`, and amend `adr-ufom` §2 and C-23 to "schedule, enable flag and an in-flight marker".
- (c) Drop the rule, and keep whatever `next_ms` held before the restart. That breaks UFO §10.

**Autopilot default used by this node:** (a). It is not self-resolved: the fix amends an L0 ADR, so the reducer decides.

**Resolved at reduce v5** by `L0-adr-ufrs`: option (a). The in-flight marker is `andrew:ufo_next_ms = 0`. `L0-adr-ufom` §4 is amended to read it that way, and C-23 holds literally.
