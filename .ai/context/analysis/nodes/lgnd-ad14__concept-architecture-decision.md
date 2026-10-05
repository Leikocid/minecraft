---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad14"
source_channel: "rollout"
analysis_version: 7
title: "AD-lgnd-14: The Dragon Katana is def #4: data only, no framework code"
aliases: ["L0-lgnd-ad14"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 600
size_chars: 3213
tags: ["v6", "katana"]
level: 2
---
---
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-katn", "L0-lgnd-ent1", "L0-lgnd-ad01", "L0-lgnd-ad08", "L0-lgnd-ad13", "L0-lgnd-as17", "L0-lgnd-ac23", "L0-xasm22", "L0-adr-oded"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-2"]
---
# AD-lgnd-14: The Dragon Katana is def #4: data only, no framework code

**Context.**
- Katana §3/§13 asks to "preserve all global legendary-item rules".
- `L0-xasm22` assumes the framework as built already does so.
- In code, every framework path is def-driven:
  - `retention.ts:97-124`, `recovery.ts:204` and `commands.ts:36` loop `LEGENDARIES`;
  - the gate resolves `defForToken`;
  - `isLegendaryStack` builds its set from `LEGENDARIES`;
  - `protectLegendariesIn` filters by block type (`HOLDER_TYPES`) and by `defForStack`;
  - the HUD iterates `heldLegendaries` and reads `def.nameKey` / `def.hudKeys` (`hud.ts:38-45`).

**Decision.**
1. Append one entry to `LEGENDARIES` in `registry.ts`:
```
DRAGON_KATANA = {
  itemId: "andrew:dragon_katana", keyPrefix: "dk", abilityKey: "dragon_katana",
  nameKey: "item.andrew:dragon_katana", cooldownTicks: 600, craftGate: true,
  craftTokenId: "andrew:dragon_katana_crafted",
  refund: [["minecraft:golden_apple", 2], ["minecraft:ender_pearl", 2], ["minecraft:diamond_sword", 1]],
  textPrefix: "andrew.katana", command: "andrew:katana",
  hudKeys: { ready: "andrew.katana.hud_ready", cooldown: "andrew.katana.hud_cooldown" },
}
```
2. **The uniqueness flag** is `keysFor(DRAGON_KATANA).crafted` = `andrew:dk_crafted`, with `andrew:dk_crafted_by`. The other keys follow the same pattern: `dk_origin|owner|id|owner_name|pending|gen|owed`. These names are frozen once a world ships (`r006`).
3. **The HUD uses `hudKeys`, not new code.** The shared keys render `%s: Ready` / `%s: N s`. Katana §10 asks for «Катана дракона — Готово» / "Dragon Katana — Ready". The Orbital Cannon already uses own keys for the same reason (`L0-adr-oded`), so `katn` adds the two lang lines per language.
4. **What `katn` supplies, outside `lgnd`:**
   - the item JSON with `allow_off_hand` and `fire_resistant`, and no durability;
   - the token item, with `menu_category: none`, the same icon and name, and `max_stack_size` 1;
   - the recipe, whose output is the token;
   - the lang keys `andrew.katana.{first_craft,craft_blocked,returned,admin_given,reset,hud_ready,hud_cooldown}`;
   - the ability module, which gates on `resolveActivation(player)?.def === DRAGON_KATANA`.
5. The `ac11` grep guard is unchanged: no `andrew:dk_` literal appears outside `src/legendary/`.

**Rejected.**
- (a) A `katana`-specific retention or HUD branch. It duplicates the shared logic, and the precedent `L0-plan` forbids it.
- (b) Prefix `kt` or `ka`. Both are free, but `dk` mirrors the two-letter initials of the full name (`ws`, `sc`, `oc`) (`as17`).
- (c) Shared HUD keys with a changed separator. That would change the other three weapons' strings, which are verified on the iPad.

**Consequence.**
- `magn` never pulls the Katana, with no edit.
- `/andrew:katana give|reset` comes from `commands.ts` for free.
- If `katn` needs any framework behaviour beyond this, that is an L0 contradiction (`L0-plan`).
