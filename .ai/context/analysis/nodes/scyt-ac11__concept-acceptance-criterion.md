---
type: "concept-acceptance-criterion"
node_id: "L0-scyt-ac11"
source_channel: "rollout"
analysis_version: 2
title: "AC-scyt-11 — One Survival craft per world, kept across restart (§8 test 11)"
aliases: ["L0-scyt-ac11"]
is_a: ["acceptance-criterion"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 805
tags: ["is_a:acceptance-criterion", "spec-test:11", "one-per-world", "channel:bds"]
level: 2
---
# AC-scyt-11 — One Survival craft per world, kept across restart (§8 test 11)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-p004", "L0-scyt-r009", "L0-lgnd"]`

**GIVEN** a Survival world where no Scythe has been crafted, and the Web Sword may or may not have been crafted,
**WHEN** player A crafts the recipe (2 golden apples, 2 obsidian, 1 diamond hoe),
**THEN** A receives 1× `andrew:scythe_of_calamity`, and every player sees the localized announcement naming the Scythe and A.

**AND WHEN** player B crafts it again, before or after a BDS restart,
**THEN** the craft is blocked, the ingredients are refunded, and no second Scythe appears.

**AND** the Web Sword's flag is unaffected in either direction. `/give` and Creative copies never set the flag.
