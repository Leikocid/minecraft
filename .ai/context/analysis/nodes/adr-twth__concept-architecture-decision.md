---
type: "concept-architecture-decision"
node_id: "L0-adr-twth"
source_channel: "rollout"
analysis_version: 10
level: 2
title: "ADR-L0-twth · How the trident is thrown and comes back"
aliases: ["L0-adr-twth"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 5024
tags: ["v9", "above-water-trident", "status:proposed", "amended-at-reduce"]
---
---
title: "ADR-L0-twth · Scripted throw, server-side custody ledger, steered return, enchantment scrub"
aliases: ["L0-adr-twth", "Trident throw decision"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-xcx30", "L0-xcx28", "L0-sclk", "L0-lgnd", "L0-adr-trlg", "L0-trdt-adcl", "L0-trdt-ecus", "L0-trdt-pthr", "L0-trdt-pfbk", "L0-trdt-cx02"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2", "L0-trdt-cons"]
governs_files: ["src/trident/", "packs/behavior/items/", "packs/behavior/entities/", "packs/resource/entity/"]
---
# ADR-L0-twth · How the trident is thrown and comes back

**Amended at the v9 reduce** (`L0-trdt-cx02` §1): §2 now uses a ledger-first order, and the record is keyed by a `throwId` (`L0-trdt-adcl`, `L0-trdt-ecus`). The earlier text said hand-first, which contradicted its own consequence line.

**Context.**
- The spec asks for:
  - a vanilla-like flight;
  - a return after an entity hit;
  - an immediate visible return at **10 b/s** after a miss or block hit;
  - no re-throw before the trident is back;
  - no duplicate, loss, or held + in-flight copy at once.
- Throw and dash share one gesture (`xcx28`), so the engine cannot decide what a release does. A data-only `minecraft:throwable` always throws on release.
- Stable 2.10.0 has no `projectileShoot` event. The `sclk` work established that an `entitySpawn` swap works, that snowball-runtime entities persist and reload, and that a `remove_on_hit` projectile reads invalid for about 2 ticks before its hit event.

**Decision.**
1. **The item charges but never throws by itself.** `andrew:above_water_trident` uses a use-duration/charge component with no `throwable`. `itemReleaseUse` is the single decision point: dash (`L0-adr-twrp`) or throw.
2. **A scripted throw, ledger first, in one sync block:**
   1. write the custody record `{throwId, mark, look, owner, state: flying, since}` as a world dynamic property;
   2. clear the hand slot;
   3. spawn `andrew:thrown_above_water_trident` (snowball runtime, trident geometry in RP, no `remove_on_hit`, carrying `throwId` as an entity property) and launch it with vanilla trident speed and gravity, measured by probe P7;
   4. store the `entityId` in the record.

   If the turn dies before step 2, the record exists while the copy is still in the hand. Fallback delivery then bumps the generation, so the held copy goes stale and is voided. Exactly one live copy remains, never a loss.
3. **Hit handling.**
   - On an entity hit: base damage, then `L0-adr-twlt`, then the state becomes `returning`.
   - On a block hit or miss (block hit, or a max flight time): the state becomes `returning`.
4. **Steered return.**
   - `andrew:returning_above_water_trident`, with no physics, moves 0.5 block/tick (10 b/s) toward the owner's chest, in a shared `runInterval` (not `runJob`). It passes through blocks, as Loyalty does.
   - On arrival within 1.5 blocks, one sync block removes the entity, re-inserts the scrubbed copy (selected slot if empty, then inventory, then a protected drop at the feet), and deletes the record. A mark that is not live at arrival is never inserted.
   - Re-throw is impossible until then, because the player has no copy to throw.
5. **Custody fallbacks** (`xcx30`, settled by `L0-adr-trlg`):
   - Owner offline or dead, owner in another dimension, entity unloaded or unresolvable, or a return longer than the cap (`xasm36`): call `lgnd`'s exported `deliverToLastHolder`. It grants to a reachable holder, otherwise it writes the owed ledger, which is redeemed on `playerSpawn`.
   - A custody entity on `entityLoad` whose `throwId` has no live record: remove it.
6. **Enchantment scrub.**
   - The item takes the vanilla trident's enchant slot.
   - On `playerInventoryItemChange` and on re-insert, the script removes Loyalty and Riptide. It keeps all other enchantments.
   - The anvil and table previews still show Loyalty/Riptide; this is reported as a limitation (C-37).

**Rejected alternatives.**
- **`minecraft:throwable` + `projectile`.** It cannot coexist with the dash on one gesture, and the engine drops the item stack into the projectile with no hook to block a re-throw from a second copy.
- **A vanilla `thrown_trident` with Loyalty forced.** That is a vanilla item, so it breaks the unique-mark contract, and Loyalty's return speed is not 10 b/s.
- **Keeping the copy in hand while a decoy flies.** A held copy and an in-flight copy coexisting violates C-33.
- **Clearing the hand before writing the record.** A failure between the two steps loses the copy with no record.
- **Keying the record by `Entity.id`.** Its stability across a restart is unverified (P9).

**Consequences.**
- `lgnd` is touched by one export (`L0-adr-trlg`).
- The probe plan (`L0-trdt-cons`) measures, among others:
  - vanilla launch speed and gravity (P7);
  - `itemReleaseUse` on iPad touch (P3);
  - the return speed: 20 blocks in 2.0 s ± 0.1 (P8);
  - `entityLoad` of a stale entity after a restart (P9).
