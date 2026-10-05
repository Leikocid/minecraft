---
type: "concept-rule"
node_id: "L0-sclk-r001"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-r001"]
is_a: ["rule"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 906
tags: ["rule", "C-26", "multishot", "once"]
level: 2
---
**R-sclk-001 · One arrow → one bolt → at most one outcome (C-26, §8, §11)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-sclk-p002", "L0-sclk-p004", "L0-sclk-p005", "L0-sclk-ent3"]`

- Each substituted arrow gives **exactly one** bolt. Emulated Multishot gives exactly two more. Each bolt has its own `BoltRecord`.
- A record resolves **at most once**, to exactly one of: `entity` (p004), `block` (p005) or `expired` (p003). The handler deletes the record **before** acting, so a duplicate event (hit-entity then hit-block) is a no-op.
- Three Multishot bolts are three records. They are never merged into one hit, one damage call or one carve job.
- No other path damages an entity: not the trail, not the crater and not the patch.

Source: §8 ("each processed independently"), §11 ("cannot merge three arrows into one hit event"), §14.
