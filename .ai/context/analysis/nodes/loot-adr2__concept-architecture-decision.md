---
type: "concept-architecture-decision"
node_id: "L0-loot-adr2"
source_channel: "rollout"
analysis_version: 2
title: "ADR-loot-2 · Windmill/Airship loot is script-authored ItemStacks, not a Bedrock loot_table JSON"
aliases: ["L0-loot-adr2"]
is_a: ["architecture-decision"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 1555
tags: ["is_a:architecture-decision", "relates_to:L0-loot-p001", "relates_to:L0-loot-p002", "relates_to:L0-adr-strc"]
level: 2
---
# ADR-loot-2 · Windmill/Airship loot is script-authored ItemStacks, not a Bedrock loot_table JSON

**Context:** Bedrock supports authoring a custom `loot_table` JSON (pools/entries/functions) invoked via `/loot insert`, which is the mechanism this deep-dive assumes for the *vanilla* path (`L0-loot-asm2`). The custom Windmill/Airship table could in principle be authored the same way.

**Decision:** the custom 13-category table is built by script (`L0-loot-p001`), constructing `ItemStack`s directly and writing them into the chest `Container`, rather than as a static `loot_table` JSON pulled via `/loot insert`.

**Rationale:** the cross-attempt state this table needs — "Golden Apple at most once across the whole chest" (`L0-loot-r003`) — doesn't map cleanly onto Bedrock's loot-table pool/rolls model, which evaluates pools independently with no "global once across the whole container" primitive. Script-side state (a per-chest-fill boolean) expresses this directly, and keeps the custom path symmetric with the vanilla path's chest-role dispatch — both driven from the same `strf` post-place hook (`L0-adr-strc` step 5).

**Rejected alternative:** author the 13 categories as a single custom `loot_table` JSON with weighted pools. Rejected because expressing "the Golden Apple pool disables itself after one success, everything else keeps rolling for up to 12 total draws" is not a native loot-table construct, and would need either duplicate tables or roll-count trickery that's harder to verify against the spec's plain-language attempts model.
