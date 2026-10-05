---
type: "raw-fragment"
node_id: "sculkcrossbowspecv1ruen-part-4"
source_channel: "raw-import"
level: null
aliases: ["sculkcrossbowspecv1ruen-part-4", "sculkcrossbowspecv1ruen"]
is_a: ["raw-fragment"]
priority: 610
size_chars: 1129
tags: ["requirements", "api"]
source: "docs/Sculk_Crossbow_Spec_v1_RU_EN.docx"
embed_lines: "233-250"
embed_slice: "3-20"
---
- The Sonic Boom-like trail is visual only. A custom look-alike effect is acceptable if exact vanilla rendering is unavailable through stable Bedrock APIs.

- Preserve all global legendary rules: one legal Survival craft per world, persistent uniqueness, infinite durability, death retention, ordinary-hazard immunity, Void return, Creative/testing copies and first-craft announcement.

- Prefer stable Bedrock APIs and no Experiments. If an exact visual or damage-bypass behavior cannot be reproduced with stable APIs, implement the closest stable server-authoritative version without changing the core gameplay and document the deviation.

# 14. Implementation priorities

- Correct server-authoritative suppression/replacement of vanilla projectile damage.

- Reliable fixed Sonic Boom-equivalent damage that does not accidentally stack normal arrow damage.

- Independent Multishot projectile tracking.

- Controlled terrain edits with strict \~5×5 / 2--3 depth bounds.

- Persistent Sculk placement and efficient short-lived visual particles.

- Legendary uniqueness, durability immunity, death retention and Void recovery.
