import {
  BlockTypes,
  BlockVolume,
  CommandPermissionLevel,
  CustomCommandParamType,
  CustomCommandStatus,
  EnchantmentType,
  ItemStack,
  Player,
  StructureRotation,
  system,
  world,
} from "@minecraft/server";
import { registerAutoSmelt } from "./autosmelt";
import { registerLegendaryCommands } from "./legendary/commands";
import { registerCraftGate } from "./legendary/craftgate";
import { registerHideCommand } from "./legendary/hidden";
import { registerLegendaryHud } from "./legendary/hud";
import { registerRecovery } from "./legendary/recovery";
import { registerRetention } from "./legendary/retention";
import { registerScytheVolley } from "./scythe/volley";
import { registerStructureCommands } from "./structures/commands";
import { DISCOVER_INTERVAL_TICKS } from "./structures/config";
import type { PlayerPos } from "./structures/discovery";
import { StrfRuntime, engineStrf } from "./structures/runtime";
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

const strfLog = (msg: string): void => console.warn(`[andrew] ${msg}`);
let strf: StrfRuntime | undefined;
registerStructureCommands(
  { system, Player, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus },
  { runtime: () => strf, log: (msg) => console.warn(msg) }
);

/** SimulatedPlayers reach this pack as unreadable entries (see playerSpawn below); they are skipped. */
function* playerPositions(): Generator<PlayerPos> {
  for (const p of world.getAllPlayers()) {
    if (p?.isValid !== true) continue;
    yield { dimensionId: p.dimension.id, x: p.location.x, z: p.location.z };
  }
}

world.afterEvents.worldLoad.subscribe(() => {
  console.warn("[andrew] script loaded");
  strf = new StrfRuntime(
    new DynamicPropertyStore(world),
    engineStrf({ world, BlockVolume, BlockTypes, StructureRotation, ItemStack, EnchantmentType }),
    { log: strfLog }
  );
  console.warn(`[andrew] ${strf.registry.statsLine()}`);
  const resumed = strf.resumeUnfinished();
  if (resumed > 0) strfLog(`strf runtime: ${resumed} unfinished instance(s) queued`);
  const runtime = strf;
  system.runInterval(() => {
    runtime.discover(playerPositions(), (job) => system.runJob(job));
    runtime.pumpPlacement();
  }, DISCOVER_INTERVAL_TICKS);
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
