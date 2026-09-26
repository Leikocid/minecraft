import { type Player, world } from "@minecraft/server";
import { registerAutoSmelt } from "./autosmelt";
import { registerLegendaryCommands } from "./legendary/commands";
import { registerCraftGate } from "./legendary/craftgate";
import { registerHideCommand } from "./legendary/hidden";
import { registerLegendaryHud } from "./legendary/hud";
import { registerRecovery } from "./legendary/recovery";
import { registerRetention } from "./legendary/retention";
import { registerScytheVolley } from "./scythe/volley";
import { Registry } from "./structures/registry";
import { DynamicPropertyStore } from "./structures/store";
import { registerTrap } from "./websword/trap";

registerAutoSmelt();
registerCraftGate();
registerRetention();
registerRecovery();
registerLegendaryHud();
registerTrap();
registerScytheVolley();
// Must run at script load: custom commands can only be registered during the
// engine's startup phase, which is over by the time the world exists.
registerLegendaryCommands();
registerHideCommand();

world.afterEvents.worldLoad.subscribe(() => {
  console.warn("[andrew] script loaded");
  console.warn(`[andrew] ${new Registry(new DynamicPropertyStore(world)).statsLine()}`);
});

world.afterEvents.playerSpawn.subscribe((event) => {
  if (!event.initialSpawn) {
    return;
  }

  // Typed non-nullable, and for a real player it is. The engine passes nothing
  // for a SimulatedPlayer, because that class lives in the beta gametest module
  // this pack deliberately does not load — without the guard every simulated
  // spawn throws a TypeError into the server log. [src: concept-constraint C-2]
  const player: Player | undefined = event.player;
  player?.sendMessage("§a[andrew] hello from the add-on");
});
