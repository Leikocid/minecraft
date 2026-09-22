import { type Player, world } from "@minecraft/server";
import { registerAutoSmelt } from "./autosmelt";
import { registerWebSwordCommand } from "./websword/commands";
import { registerCraftGate } from "./websword/craftgate";
import { registerRetention } from "./websword/retention";

registerAutoSmelt();
registerCraftGate();
registerRetention();
// Must run at script load: custom commands can only be registered during the
// engine's startup phase, which is over by the time the world exists.
registerWebSwordCommand();

world.afterEvents.worldLoad.subscribe(() => {
  console.warn("[andrew] script loaded");
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
