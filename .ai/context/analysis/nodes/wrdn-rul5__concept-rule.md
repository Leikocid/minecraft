---
type: "concept-rule"
node_id: "L0-wrdn-rul5"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-wrdn-rul5"]
is_a: ["rule"]
part_of: ["L0-wrdn"]
relates_to: ["L0-wrdn"]
priority: 530
size_chars: 917
tags: ["is_a:rule", "sculk", "warden", "shrieker"]
level: 2
---
**Rule — Sculk Shriekers & Warden behavior**

- Exactly 2 Sculk Shriekers exist, at fixed positions: one near the central hall/monument, one in a far part of the city.
- Both must behave exactly like naturally-generated vanilla Sculk Shriekers and participate in the ordinary warning/Warden-summon mechanic, as closely as stable Bedrock APIs allow.
- **No Warden is pre-created** and none is a permanent guardian of the structure. A Warden can only appear through the normal Shrieker mechanic (i.e., a player triggering enough warnings near an active Shrieker).
- Sculk Sensors, Sculk Veins, and other suitable sculk elements are placed throughout the structure in the fixed template. Sensors may appear noticeably more often than the 2 Shriekers.

Rationale: the Warden threat must feel earned via normal vanilla mechanics rather than being a scripted ambush, and must not require any custom mob-AI or spawner code.
