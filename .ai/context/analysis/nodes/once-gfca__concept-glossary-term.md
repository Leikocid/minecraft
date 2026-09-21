---
type: "concept-glossary-term"
node_id: "L0-once-gfca"
source_channel: "rollout"
aliases: ["L0-once-gfca"]
part_of: ["L0-once"]
is_a: ["glossary-term"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1006
tags: ["glossary-term","announcement","localization","L0-once"]
---

**First-Craft Announcement** (RU: объявление о первом крафте)

The one-time server-wide chat message emitted when the Web Sword's single survival craft succeeds. §3: *«При первом успешном крафте отправить всем игрокам локализованное сообщение с названием оружия и именем создателя.»*

Delivered as **rawtext with translate keys** (`andrew.web_sword.first_craft`) and a `with` substitution for the crafter's name, so each client renders it in its own language (R-006, ADR-009). Never a literal string.

**Audience:** all players online at craft time. No replay for players who join later (ASM-012).

**Significance beyond flavour.** It is the only in-game signal that the world's craft budget has been spent. A player who misses it has no way to learn the gate is closed and may waste a Diamond Sword discovering it — which is why the blocked-craft path carries its own per-player denial message (`andrew.web_sword.already_crafted`) as a second signal.

**Synonyms:** the reveal, the first-craft broadcast.
