// L0-xcx8 probe against BDS 1.26.51.1: does a stable event fire for an attack
// that hits nothing, and can the Orbital's 10-block view ray be cast from it?
//
// Not part of the shipped gametest pack: diagnose-CNTR-XCX8-AA.repro.sh copies
// this file to src/gametest/ for one run and restores the tree. A
// SimulatedPlayer acts on the server, so the lines bound the server only —
// what a touch client sends for a far tap is left to the iPad protocol.

import { EntitySwingSource, GameMode, HeldItemOption, ItemStack, type Player, type Vector3, world } from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 3, y: 2, z: 5 };
const EYE_ROW = 3;
const NAME = "probe_xcx8";
const HELD_ITEM = "andrew:test_item";
const ORBITAL_RANGE = 10;

const log = (msg: string): void => console.warn(`[probe] XCX8 ${msg}`);

interface Tally {
  attackSwing: number;
  otherSwings: string[];
  itemUse: number;
  hitBlock: number;
  ray: string;
}

const fresh = (): Tally => ({ attackSwing: 0, otherSwings: [], itemUse: 0, hitBlock: 0, ray: "-" });
let tally = fresh();
let counting = false;

const isProbe = (player: Player | undefined): player is Player =>
  player !== undefined && player.isValid && player.name === NAME;

function ray(player: Player): string {
  const hit = player.getBlockFromViewDirection({
    maxDistance: ORBITAL_RANGE,
    includeLiquidBlocks: false,
    includePassableBlocks: false,
  });
  if (hit === undefined) return "none";
  const eye = player.getHeadLocation();
  const c = { x: hit.block.location.x + 0.5, y: hit.block.location.y + 0.5, z: hit.block.location.z + 0.5 };
  return `${hit.block.typeId}@${Math.hypot(c.x - eye.x, c.y - eye.y, c.z - eye.z).toFixed(1)}`;
}

// The subscription an Orbital LMB handler would use: Attack swings only.
world.afterEvents.playerSwingStart.subscribe(
  (e) => {
    if (!counting || !isProbe(e.player)) return;
    tally.attackSwing++;
    tally.ray = ray(e.player);
  },
  { swingSource: EntitySwingSource.Attack, heldItemOption: HeldItemOption.AnyItem }
);
world.afterEvents.playerSwingStart.subscribe((e) => {
  if (counting && isProbe(e.player) && e.swingSource !== EntitySwingSource.Attack) tally.otherSwings.push(e.swingSource);
});
world.afterEvents.itemUse.subscribe((e) => {
  if (counting && isProbe(e.source)) tally.itemUse++;
});
world.afterEvents.entityHitBlock.subscribe((e) => {
  if (counting && e.damagingEntity.typeId === "minecraft:player" && isProbe(e.damagingEntity as Player)) tally.hitBlock++;
});

type Action = "attack" | "use";

/**
 * SimulatedPlayer swallows every second attack/useItemInSlot call (returns
 * false, raises nothing; measured on 1.26.51.1 by CNTR-XCX14-AA), so a silent
 * first call is repeated once.
 */
async function fire(test: Test, player: SimulatedPlayer, action: Action): Promise<Tally & { attempt: number }> {
  for (let attempt = 1; ; attempt++) {
    tally = fresh();
    counting = true;
    if (action === "attack") player.attack();
    else player.useItemInSlot(player.selectedSlotIndex);
    await test.idle(3);
    counting = false;
    const silent = tally.attackSwing + tally.otherSwings.length + tally.itemUse + tally.hitBlock === 0;
    if (!silent || attempt === 2) return { ...tally, attempt };
    await test.idle(2);
  }
}

async function run(test: Test, player: SimulatedPlayer, label: string, action: Action, d?: number): Promise<Tally> {
  const dimension = test.getDimension();
  const rel: Vector3 = { x: STAND.x, y: EYE_ROW, z: STAND.z - (d ?? 0) };
  if (d === undefined) {
    player.lookAtLocation({ x: STAND.x + 0.5, y: STAND.y + 40, z: STAND.z + 0.5 });
  } else {
    dimension.setBlockType(test.worldBlockLocation(rel), "minecraft:stone");
    player.lookAtBlock(rel);
  }
  await test.idle(4);
  const t = await fire(test, player, action);
  log(
    `${label} action=${action} attempt=${t.attempt} attackSwing=${t.attackSwing} ` +
      `otherSwings=[${t.otherSwings.join(",")}] itemUse=${t.itemUse} entityHitBlock=${t.hitBlock} ray10=${t.ray}`
  );
  if (d !== undefined) dimension.setBlockType(test.worldBlockLocation(rel), "minecraft:air");
  await test.idle(2);
  return t;
}

registerAsync("andrew", "probe_xcx8_swing", async (test: Test): Promise<void> => {
  const player = test.spawnSimulatedPlayer(STAND, NAME, GameMode.Survival);
  await test.idle(4);
  player.getComponent("minecraft:inventory")?.container?.setItem(player.selectedSlotIndex, new ItemStack(HELD_ITEM, 1));
  await test.idle(4);
  log(`setup mode=Survival held=${HELD_ITEM} input=${player.inputInfo.lastInputModeUsed}`);

  const sky = await run(test, player, "sky", "attack");
  const near = await run(test, player, "d3", "attack", 3);
  const far = await run(test, player, "d8", "attack", 8);
  const beyond = await run(test, player, "d12", "attack", 12);
  const use = await run(test, player, "use-d8", "use", 8);

  const fires =
    sky.attackSwing === 1 && sky.ray === "none" &&
    far.attackSwing === 1 && far.ray.startsWith("minecraft:stone") &&
    beyond.attackSwing === 1 && beyond.ray === "none" &&
    use.attackSwing === 0 && use.itemUse === 1;
  log(
    `RESULT sky=${sky.attackSwing}/${sky.ray} d3=${near.attackSwing}/${near.ray} d8=${far.attackSwing}/${far.ray} ` +
      `d12=${beyond.attackSwing}/${beyond.ray} use-d8=attackSwing:${use.attackSwing},itemUse:${use.itemUse} ` +
      `entityHitBlockOnAttack=${sky.hitBlock + near.hitBlock + far.hitBlock + beyond.hitBlock} ` +
      `verdict=${fires ? "attack-swing-fires-without-a-hit" : "no-attack-event-without-a-hit"}`
  );
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");
