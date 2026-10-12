---
type: "concept-entity"
node_id: "L0-pear-ent2"
source_channel: "rollout"
analysis_version: 11
title: "Owner life epoch and plate generation"
aliases: ["L0-pear-ent2"]
is_a: ["entity"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 2127
tags: ["v11", "pearl-rod", "entity", "life-epoch", "plate-generation"]
level: 2
---
# Owner life epoch and plate generation

**Is a:** entity. **Part of:** L0-pear. **Relates to:** L0-pear-ent1, L0-xcx34, L0-pear-ru03.

## Owner life epoch (C-45)
- **Where it lives:** player dynamic property `andrew:life_epoch` (number, default 0). It persists across logout and restart.
- **Bump:** `world.afterEvents.entityDie` where `deadEntity.typeId === "minecraft:player"`.
  - Death drops precede `entityDie` (engine fact), but a stranger cannot use the dropped rod anyway (owner mismatch). So the order is harmless.
  - The bump also aborts any pending teleport for that player.
  - The handler guards against an undefined or removed entity (engine fact: after-events can carry one).
- **Who reads it:**
  - binding writes the current epoch into the rod;
  - `beforeEvents.itemUse` compares the rod's `pr_epoch` with the user's current epoch.
- **Why it exists:** it voids every copy of the binding everywhere (chest, drop, an unloaded chunk, a stranger's hand) with no search.
- **Shared?** It is generic. Other "personal state" features may read it, but only Pearl Rod writes are in scope here.

## Plate generation (`xcx34`)
- **Where it lives:** world dynamic property `andrew:pg:<dim>:<x>:<y>:<z>` (number). A missing key means 0.
- **Bumped by the observed paths only** (rule `L0-pear-ru03`): a player breaks or places a block at the cell; an explosion destroys the cell or its support; a piston moves or breaks the support or the cell; the support cell under the plate is broken.
- **Lifetime:** an entry is written only for a cell that some rod is bound to. Bind time records the cell in a small world set `andrew:pg_watch`, and the generation listeners touch only watched cells. That keeps the dynamic-property budget bounded.
  - Entries are never deleted. Rods can sit forever in chests, so there is no safe deletion point.
  - The growth is one key per distinct bound plate, which is negligible against the measured budget (`probe_dynamic_property_budget`).
- **Comparison:** at teleport time, `world gen(cell) !== rod.pr_gen` means the plate was replaced. The binding is cleared and there is no teleport.
