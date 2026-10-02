---
type: "concept-rule"
node_id: "L0-loot-r004"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-loot-r004"]
is_a: ["rule"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 513
tags: ["is_a:rule", "relates_to:L0-loot-p001", "relates_to:L0-loot-e003"]
level: 2
---
**Rule:** For every armor/sword/axe category (enchanted or not), material rolls 80% iron / 20% diamond independently per attempt. Armor additionally rolls one random slot (helmet/chestplate/leggings/boots) independently per attempt — duplicate pieces across a chest (e.g. two diamond helmets) are explicitly allowed.

**Rationale:** spec §3.2 rules column ("Железо 80% / алмаз 20%; случайный слот брони"), §3.3 first two bullets ("Каждая попытка независима; дубликаты разрешены").

**Scope:** `L0-loot-p001` only.
