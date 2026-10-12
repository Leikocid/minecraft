---
type: "concept-acceptance-criterion"
node_id: "L0-pear-ac06"
source_channel: "rollout"
analysis_version: 11
title: "AC-pear-06 · Unbound fishing works; items and state survive a reload (§8 bullet 6)"
aliases: ["L0-pear-ac06"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 1197
tags: ["v11", "pearl-rod", "acceptance", "bds", "ipad", "spec-8.6", "persistence"]
level: 2
---
# AC-pear-06 · Unbound fishing works; items and state survive a reload (§8 bullet 6)

**Relates to:** L0-pear-ent1, L0-pear-ent2, L0-pear-ru04.

**`bds`:**
- **Fishing:** an unbound marked rod cast into water → a hook spawns and stays. After a bite window the reel yields a vanilla fishing loot item, the damage is 0, and no binding is written.
  - **Negative control:** the same with a plain rod → loot, damage > 0.
- **Restart:** a rod bound by A, in A's inventory, plus a second bound rod in a chest. Restart BDS (scenario pair before and after, as in the existing restart scenarios). Then:
  - both records are intact;
  - A's epoch is unchanged;
  - plate generations are unchanged;
  - A's use teleports;
  - no `andrew_pearl_*` area is left over.
  - Sim players do not survive a restart, so the after half re-spawns A with the same id or uses the registry stand-in. The method is fixed by the probe.
- **Persistence probes** (ac07): the properties survive a reel, a chest, a drop and an anvil rename. A rename that drops the mark is a reported limitation.

**`ipad`:** fishing with the Pearl Rod looks and feels like vanilla; after a world reload the name, lore and binding are unchanged.
