// The UFO Magnet event (UFO spec; L0-ufoc, L0-adr-ufom). Engine objects come
// in as arguments, so GameTest and the self-check wire their own cores the
// same way the product does.

import type {
  Dimension,
  EntityLoadAfterEvent,
  PlayerSpawnAfterEvent,
  WorldLoadAfterEvent,
} from "@minecraft/server";
import { type UfoCommandApi, registerUfoCommand } from "./commands";
import { type EnvWorld, productEnv } from "./env";
import { type IntervalHost, UfoCore, runCore } from "./event";
import { NEXT_MS } from "./schedule";
import { createStubSaucer } from "./stub-saucer";

export { UfoCore } from "./event";

/** The release pack's scope; the GameTest pack uses "gt", the self-check "st". */
export const DEFAULT_SCOPE = "ufo";

export const DIMENSIONS = ["overworld", "nether", "the_end"] as const;

interface Subscribable<E> {
  subscribe(callback: (event: E) => void): (event: E) => void;
  unsubscribe(callback: (event: E) => void): void;
}

export interface UfoWorld extends EnvWorld {
  getDimension(id: string): Dimension;
  afterEvents: {
    playerSpawn: Subscribable<PlayerSpawnAfterEvent>;
    entityLoad: Subscribable<EntityLoadAfterEvent>;
    worldLoad: Subscribable<WorldLoadAfterEvent>;
  };
}

/**
 * The world events and the one interval of a core. Must run at or after
 * worldLoad: the sweep and the marker read the world. Returns the undo.
 */
export function startUfo(core: UfoCore, world: Pick<UfoWorld, "getDimension" | "afterEvents">, host: IntervalHost): () => void {
  core.sweep(DIMENSIONS.map((d) => world.getDimension(d)));
  core.worldLoaded();
  const onSpawn = world.afterEvents.playerSpawn.subscribe((event) => {
    if (event.initialSpawn) core.firstJoin();
  });
  const onLoad = world.afterEvents.entityLoad.subscribe((event) => core.entityLoaded(event.entity));
  const stop = runCore(core, host);
  return () => {
    stop();
    world.afterEvents.playerSpawn.unsubscribe(onSpawn);
    world.afterEvents.entityLoad.unsubscribe(onLoad);
  };
}

export function registerUfo(engine: UfoCommandApi & { world: UfoWorld; system: IntervalHost }, scope: string = DEFAULT_SCOPE): UfoCore {
  const { world, system } = engine;
  const log = (msg: string): void => console.warn(`[andrew] ${msg}`);
  const env = productEnv(world, log);
  const saucer = createStubSaucer({
    overworld: () => world.getDimension("overworld"),
    random: env.random,
    durations: env.durations,
    ceiling: env.ceiling,
  });
  const core = new UfoCore(env, { scope, saucer });
  registerUfoCommand(engine, { core: () => core, log });
  world.afterEvents.worldLoad.subscribe(() => {
    startUfo(core, world, system);
    const next = world.getDynamicProperty(NEXT_MS);
    log(`ufo ${scope}: loaded, enabled=${core.schedule.enabled()}, next arrival ${next === undefined ? "absent" : String(next)}`);
  });
  return core;
}
