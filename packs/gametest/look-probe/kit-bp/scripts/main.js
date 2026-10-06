// Crossbow-look probe kit (docs/feedback/probe-crossbow-look.md, Q4): the two dyeable probe
// shooters wear their `dyed` icon while loaded. Same rule as probe_look_dye on BDS: dye on the
// tick the charge completes, clear on the press that fires it.
import { system, world } from "@minecraft/server";

const DYEABLE = new Set(["andrew:probe_look_shooter", "andrew:probe_look_plain"]);
const WHITE = { red: 1, green: 1, blue: 1 };

function setHeldDye(player, color) {
  const inv = player.getComponent("minecraft:inventory")?.container;
  if (inv === undefined) return;
  const slot = player.selectedSlotIndex;
  const item = inv.getItem(slot);
  if (item === undefined || !DYEABLE.has(item.typeId)) return;
  const dye = item.getComponent("minecraft:dyeable");
  if (dye === undefined) return;
  dye.color = color;
  inv.setItem(slot, item);
}

world.afterEvents.itemCompleteUse.subscribe((e) => {
  if (DYEABLE.has(e.itemStack.typeId)) system.run(() => setHeldDye(e.source, WHITE));
});

world.afterEvents.itemStartUse.subscribe((e) => {
  if (!DYEABLE.has(e.itemStack.typeId)) return;
  if (e.itemStack.getComponent("minecraft:dyeable")?.color === undefined) return;
  system.run(() => setHeldDye(e.source, undefined));
});
