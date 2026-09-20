import { world } from "@minecraft/server";

world.afterEvents.worldLoad.subscribe(() => {
  console.warn("[andrew] script loaded");
});

world.afterEvents.playerSpawn.subscribe((event) => {
  if (!event.initialSpawn) {
    return;
  }

  event.player.sendMessage("§a[andrew] hello from the add-on");
});
