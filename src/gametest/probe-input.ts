// L0-xcx14 probes against BDS 1.26.51.1: which input events a player raises
// on a block at 2..12 blocks, in which order, and what the view ray returns
// from inside those events.
//
// Same contract as probe-place.ts: a test passes when its measurement
// completed; the engine's answer is the "[probe] INPUT …" lines. A
// SimulatedPlayer acts on the server, so these lines bound the server only —
// what the iPad client sends for a tap at a distance is not measured here.

import {
  Direction,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, Test, registerAsync } from "@minecraft/server-gametest";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 3, y: 2, z: 5 };

/** Eye level of a player standing at STAND: the target row the ray stays inside. */
const EYE_ROW = 3;

/** Blocks straight north of STAND; index d puts the block's centre d blocks from the eye. */
const DISTANCES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** Only the view ray is read this far; the actions above stop mattering past 12. */
const RAY_ONLY_DISTANCES = [16, 24, 32];

const HELD_ITEM = "andrew:test_item";
const NAME_PREFIX = "probe_in";
const ORBITAL_RANGE = 10;

const log = (msg: string): void => console.warn(`[probe] ${msg}`);

type Action = "air-use" | "interact" | "attack" | "use-on-block" | "break";
const ACTIONS: Action[] = ["air-use", "interact", "attack", "use-on-block", "break"];

const seen: string[] = [];
let recording = false;

function isProbePlayer(player: Player | undefined): player is Player {
  return player !== undefined && player.isValid && player.name.startsWith(NAME_PREFIX);
}

function fmt(v: Vector3): string {
  return `${v.x},${v.y},${v.z}`;
}

/** The view ray as an Orbital activation would cast it, with the eye-to-hit distance. */
function ray(player: Player, maxDistance?: number): string {
  const hit =
    maxDistance === undefined
      ? player.getBlockFromViewDirection()
      : player.getBlockFromViewDirection({ maxDistance, includeLiquidBlocks: false, includePassableBlocks: false });
  if (hit === undefined) return "none";
  const eye = player.getHeadLocation();
  const at = {
    x: hit.block.location.x + hit.faceLocation.x,
    y: hit.block.location.y + hit.faceLocation.y,
    z: hit.block.location.z + hit.faceLocation.z,
  };
  const dist = Math.hypot(at.x - eye.x, at.y - eye.y, at.z - eye.z);
  return `${hit.block.typeId}@${fmt(hit.block.location)}/${dist.toFixed(2)}`;
}

function note(name: string, player: Player, detail: string): void {
  if (!recording) return;
  seen.push(`${name}{${detail}; ray10=${ray(player, ORBITAL_RANGE)}}`);
}

// Logging only: nothing below mutates the world, so before-events are safe.
world.beforeEvents.itemUse.subscribe((e) => {
  if (isProbePlayer(e.source)) note("before.itemUse", e.source, `item=${e.itemStack.typeId}`);
});
world.beforeEvents.playerInteractWithBlock.subscribe((e) => {
  if (isProbePlayer(e.player)) note("before.interactWithBlock", e.player, `block=${fmt(e.block.location)} first=${e.isFirstEvent}`);
});
world.afterEvents.itemUse.subscribe((e) => {
  if (isProbePlayer(e.source)) note("itemUse", e.source, `item=${e.itemStack.typeId} rayDefault=${ray(e.source)}`);
});
world.afterEvents.itemStartUse.subscribe((e) => {
  if (isProbePlayer(e.source)) note("itemStartUse", e.source, `item=${e.itemStack.typeId}`);
});
world.afterEvents.itemStartUseOn.subscribe((e) => {
  if (isProbePlayer(e.source)) note("itemStartUseOn", e.source, `block=${fmt(e.block.location)}`);
});
world.afterEvents.playerInteractWithBlock.subscribe((e) => {
  if (isProbePlayer(e.player)) note("interactWithBlock", e.player, `block=${fmt(e.block.location)} first=${e.isFirstEvent}`);
});
world.afterEvents.entityHitBlock.subscribe((e) => {
  const player = e.damagingEntity as Player;
  if (e.damagingEntity.typeId === "minecraft:player" && isProbePlayer(player)) {
    note("entityHitBlock", player, `block=${fmt(e.hitBlock.location)}`);
  }
});
world.afterEvents.playerSwingStart.subscribe((e) => {
  if (isProbePlayer(e.player)) note("swingStart", e.player, `source=${e.swingSource} held=${e.heldItemStack?.typeId ?? "none"}`);
});
world.afterEvents.playerStartBreakingBlock.subscribe((e) => {
  if (isProbePlayer(e.player)) note("startBreaking", e.player, `block=${e.blockPermutation.type.id} face=${e.face}`);
});
world.afterEvents.playerBreakBlock.subscribe((e) => {
  if (isProbePlayer(e.player)) note("breakBlock", e.player, `block=${fmt(e.block.location)}`);
});

function act(player: SimulatedPlayer, action: Action, slot: number, target: Vector3): boolean {
  switch (action) {
    case "air-use":
      return player.useItemInSlot(slot);
    case "interact":
      return player.interact();
    case "attack":
      return player.attack();
    case "use-on-block":
      return player.useItemInSlotOnBlock(slot, target, Direction.South);
    case "break":
      return player.breakBlock(target, Direction.South);
  }
}

/**
 * Performs `action` and records what the engine raised within 3 ticks.
 *
 * SimulatedPlayer swallows every second useItemInSlot / attack /
 * useItemInSlotOnBlock call (returns false, raises nothing; measured on
 * 1.26.51.1), so a silent first call is repeated once and the line says which
 * attempt produced the events.
 */
async function fire(test: Test, player: SimulatedPlayer, action: Action, slot: number, target: Vector3): Promise<string> {
  let result = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    seen.length = 0;
    recording = true;
    const tick = system.currentTick;
    let returned: string;
    try {
      returned = String(act(player, action, slot, target));
    } catch (err) {
      returned = `threw ${err instanceof Error ? err.message : String(err)}`;
    }
    await test.idle(3);
    if (action === "break") player.stopBreakingBlock();
    recording = false;
    result = `attempt=${attempt} tick=${tick} returned=${returned} events=[${seen.join(" ")}]`;
    if (returned !== "false" || seen.length > 0) break;
    await test.idle(2);
  }
  return result;
}

/** Blocks that answer interact(): stone does not, at any distance. */
function targetFor(action: Action): string {
  return action === "interact" ? "minecraft:noteblock" : "minecraft:stone";
}

/** One placement, one aim, one action; prints what the engine raised for it. */
async function step(test: Test, player: SimulatedPlayer, action: Action, slot: number, d: number): Promise<void> {
  const rel: Vector3 = { x: STAND.x, y: EYE_ROW, z: STAND.z - d };
  const abs = test.worldBlockLocation(rel);
  const dimension = test.getDimension();
  const blockId = targetFor(action);
  try {
    dimension.setBlockType(abs, blockId);
  } catch (err) {
    log(`INPUT ${action} d=${d} SKIP could not place: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }
  player.lookAtBlock(rel);
  await test.idle(4);

  const eye = player.getHeadLocation();
  const face = Math.hypot(abs.x + 0.5 - eye.x, abs.y + 0.5 - eye.y, abs.z + 1 - eye.z);
  const outcome = await fire(test, player, action, slot, rel);
  const still = dimension.getBlock(abs)?.typeId ?? "unloaded";
  log(`INPUT ${player.name} ${action} d=${d} face=${face.toFixed(2)} target=${blockId} after=${still} ${outcome}`);
  dimension.setBlockType(abs, "minecraft:air");
  await test.idle(2);
}

async function measure(test: Test, mode: GameMode, name: string): Promise<void> {
  const player = test.spawnSimulatedPlayer(STAND, name, mode);
  await test.idle(4);
  const slot = player.selectedSlotIndex;
  player.getComponent("minecraft:inventory")?.container?.setItem(slot, new ItemStack(HELD_ITEM, 1));
  await test.idle(4);
  log(
    `INPUT ${name} mode=${mode} held=${HELD_ITEM} input=${player.inputInfo.lastInputModeUsed} ` +
      `touchOnlyAffectsHotbar=${player.inputInfo.touchOnlyAffectsHotbar}`
  );

  for (const action of ACTIONS) {
    for (const d of DISTANCES) {
      await step(test, player, action, slot, d);
    }
  }
  for (const d of RAY_ONLY_DISTANCES) {
    await step(test, player, "air-use", slot, d);
  }

  // Nothing within any range: straight up into open sky.
  player.lookAtLocation({ x: STAND.x + 0.5, y: STAND.y + 40, z: STAND.z + 0.5 });
  await test.idle(4);
  for (const action of ["air-use", "attack", "interact"] as const) {
    log(`INPUT ${name} ${action} sky ${await fire(test, player, action, slot, STAND)}`);
    await test.idle(2);
  }
  log(`INPUT ${name} RESULT done`);
}

registerAsync("andrew", "probe_input_survival", async (test: Test): Promise<void> => {
  await measure(test, GameMode.Survival, `${NAME_PREFIX}_surv`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2000)
  .tag("andrew");

registerAsync("andrew", "probe_input_creative", async (test: Test): Promise<void> => {
  await measure(test, GameMode.Creative, `${NAME_PREFIX}_crea`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2000)
  .tag("andrew");

/** Raw BlockRaycastHit for a horizontal aim in each direction, 4 blocks out. */
registerAsync("andrew", "probe_input_face_location", async (test: Test): Promise<void> => {
  const player = test.spawnSimulatedPlayer(STAND, `${NAME_PREFIX}_face`, GameMode.Survival);
  await test.idle(4);
  const dimension = test.getDimension();
  const aims: Array<[string, Vector3]> = [
    ["north", { x: STAND.x, y: EYE_ROW, z: STAND.z - 4 }],
    ["south", { x: STAND.x, y: EYE_ROW, z: STAND.z + 4 }],
    ["west", { x: STAND.x - 4, y: EYE_ROW, z: STAND.z }],
    ["east", { x: STAND.x + 4, y: EYE_ROW, z: STAND.z }],
  ];
  for (const [label, rel] of aims) {
    const abs = test.worldBlockLocation(rel);
    dimension.setBlockType(abs, "minecraft:stone");
    player.lookAtBlock(rel);
    await test.idle(4);
    const eye = player.getHeadLocation();
    for (const opts of [{ maxDistance: ORBITAL_RANGE }, undefined]) {
      const hit = opts === undefined ? player.getBlockFromViewDirection() : player.getBlockFromViewDirection(opts);
      log(
        `INPUT FACE ${label} opts=${opts === undefined ? "none" : "max10"} eye=${eye.x.toFixed(2)},${eye.y.toFixed(2)},${eye.z.toFixed(2)} ` +
          `block=${hit === undefined ? "none" : fmt(hit.block.location)} face=${hit?.face ?? "-"} ` +
          `faceLocation=${hit === undefined ? "-" : `${hit.faceLocation.x.toFixed(3)},${hit.faceLocation.y.toFixed(3)},${hit.faceLocation.z.toFixed(3)}`}`
      );
    }
    dimension.setBlockType(abs, "minecraft:air");
    await test.idle(2);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");
