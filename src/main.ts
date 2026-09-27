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
import { SPAWN_EVENT, SPAWN_STATE_EVENT, SpawnSearch, engineSpawnHost } from "./structures/spawn-search";
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
let spawnSearch: SpawnSearch | undefined;
registerStructureCommands(
  { system, Player, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus },
  {
    runtime: () => strf,
    log: (msg) => console.warn(msg),
    searchHost: (d) =>
      engineSpawnHost(world.getDimension(d === "n" ? "nether" : "overworld"), system, { BlockVolume, BlockTypes }, () => world.getDefaultSpawnLocation(), undefined, {
        prefix: "andrew_find_",
        pool: 5,
      }),
  }
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
  const store = new DynamicPropertyStore(world);
  strf = new StrfRuntime(
    store,
    engineStrf({ world, BlockVolume, BlockTypes, StructureRotation, ItemStack, EnchantmentType, system }),
    { log: strfLog }
  );
  console.warn(`[andrew] ${strf.registry.statsLine()}`);
  // Before the discovery loop starts: while the search runs, it holds the
  // chunks around spawn so nothing else can take the spot (L0-wind-r013).
  spawnSearch = new SpawnSearch(
    strf,
    store,
    engineSpawnHost(
      world.getDimension("overworld"),
      system,
      { BlockVolume, BlockTypes },
      () => world.getDefaultSpawnLocation(),
      (state) => system.sendScriptEvent(SPAWN_STATE_EVENT, JSON.stringify(state))
    ),
    { log: strfLog }
  );
  spawnSearch.run().catch((e: unknown) => strfLog(`spawn windmill: the search threw ${String(e)}`));
  const resumed = strf.resumeUnfinished();
  if (resumed > 0) strfLog(`strf runtime: ${resumed} unfinished instance(s) queued`);
  const runtime = strf;
  system.runInterval(() => {
    runtime.discover(playerPositions(), (job) => system.runJob(job));
    runtime.pumpPlacement();
  }, DISCOVER_INTERVAL_TICKS);
});

// "skip" stops a search that has not written a block yet (the GameTest world
// sends it: its tests run at spawn); "report" re-sends the state for the
// self-check pack, which cannot read this pack's dynamic properties.
system.afterEvents.scriptEventReceive.subscribe(
  (event) => {
    if (event.id !== SPAWN_EVENT || spawnSearch === undefined) return;
    if (event.message === "skip") {
      const ok = spawnSearch.requestSkip("scriptevent");
      strfLog(`spawn windmill: skip request ${ok ? "accepted" : "ignored: no search is waiting to start"}`);
    } else if (event.message === "report") {
      spawnSearch.announce();
    }
  },
  { namespaces: ["andrew"] }
);

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
