// The Orbital Cannon core on a real engine (L0-orbc-p001): input, target,
// gate, lock, spawn height and the inside-solid rule, with the stub effect.
//
// Every "nothing happened" is paired with a witness that the input did
// arrive: the raw events below are counted per player, and a press that
// raised none is retried, then fails the test. SimulatedPlayer swallows
// every second useItemInSlot / attack / useItemInSlotOnBlock (CNTR-XCX14).

import {
  type Block,
  BlockPermutation,
  BlockVolume,
  type Dimension,
  Direction,
  EntityComponentTypes,
  EntitySwingSource,
  EquipmentSlot,
  GameMode,
  ItemStack,
  Player,
  type RawMessage,
  ScreenDisplay,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import * as cooldown from "../legendary/cooldown";
import { hudMessage } from "../legendary/hud";
import { ORBITAL_CANNON, cooldownKey } from "../legendary/registry";
import { type Attack, activate, activeAttacks, endAttack, observeAttacks } from "../orbital/activation";
import { CHARGE_ENTITY_ID, CHARGE_TAG, type Effect, type Mode, PASS_THROUGH, attackTag, effectFor, isContact, registerEffect } from "../orbital/charge";
import { spawnY } from "../orbital/spawn";
import { distanceToBlock } from "../orbital/target";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const NAME = "orbc";
const STAND: Vector3 = { x: 3, y: 2, z: 5 };
const STAND_P: Vector3 = { x: 2, y: 2, z: 5 };
const STAND_Q: Vector3 = { x: 4, y: 2, z: 5 };
const CANNON_SLOT = 0;
const EMPTY_SLOT = 1;
const KEY = ORBITAL_CANNON.abilityKey;

const log = (msg: string): void => console.warn(`[gametest] orbital-core ${msg}`);
const fmt = (v: Vector3): string => `${v.x},${v.y},${v.z}`;
const same = (a: Vector3, b: Vector3): boolean => a.x === b.x && a.y === b.y && a.z === b.z;
const near = (a: Vector3, b: Vector3): boolean => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6 && Math.abs(a.z - b.z) < 1e-6;

// ---------------------------------------------------------------- raw input witness

type Input = "itemUse" | "itemStartUseOn" | "entityHitBlock" | "swingAttack";
const inputs = new Map<string, Array<{ kind: Input; tick: number }>>();

function witness(player: Player | undefined, kind: Input): void {
  if (player === undefined || !player.isValid || !player.name.startsWith(NAME)) return;
  const list = inputs.get(player.name) ?? [];
  list.push({ kind, tick: system.currentTick });
  inputs.set(player.name, list);
}

world.afterEvents.itemUse.subscribe((e) => witness(e.source, "itemUse"));
world.afterEvents.itemStartUseOn.subscribe((e) => witness(e.source, "itemStartUseOn"));
world.afterEvents.entityHitBlock.subscribe((e) => {
  if (e.damagingEntity instanceof Player) witness(e.damagingEntity, "entityHitBlock");
});
world.afterEvents.playerSwingStart.subscribe((e) => {
  if (e.swingSource === EntitySwingSource.Attack) witness(e.player, "swingAttack");
});

const inputsOf = (player: Player): Array<{ kind: Input; tick: number }> => inputs.get(player.name) ?? [];

type Press =
  | { kind: "use" }
  | { kind: "useOn"; block: Vector3; face: Direction }
  | { kind: "attack" }
  | { kind: "break"; block: Vector3; face: Direction };

const EXPECTED: Record<Press["kind"], Input> = { use: "itemUse", useOn: "itemStartUseOn", attack: "swingAttack", break: "entityHitBlock" };

function fire(player: SimulatedPlayer, p: Press): boolean {
  switch (p.kind) {
    case "use":
      return player.useItemInSlot(player.selectedSlotIndex);
    case "useOn":
      return player.useItemInSlotOnBlock(player.selectedSlotIndex, p.block, p.face);
    case "attack":
      return player.attack();
    case "break":
      return player.breakBlock(p.block, p.face);
  }
}

/** Performs `p` until its input event is seen; returns what the engine raised for it. A `break` keeps holding. */
async function press(test: Test, player: SimulatedPlayer, p: Press): Promise<Input[]> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const from = inputsOf(player).length;
    fire(player, p);
    for (let t = 0; t < 4; t++) {
      await test.idle(1);
      const raised = inputsOf(player).slice(from).map((e) => e.kind);
      if (raised.includes(EXPECTED[p.kind])) return raised;
    }
    if (p.kind === "break") player.stopBreakingBlock();
    await test.idle(1);
  }
  throw new Error(`${player.name} ${p.kind}: no ${EXPECTED[p.kind]} after 3 attempts — the press never reached the handlers`);
}

// ---------------------------------------------------------------- shots, charges, blocks

interface Shot {
  attack: Attack;
  tick: number;
  /** Charge positions read in the spawn tick. */
  at: Vector3[];
  remainingTicks: number | undefined;
}

function watchShots(players: Player[]): { shots: Shot[]; stop: () => void; clear: () => void } {
  const shots: Shot[] = [];
  const stop = observeAttacks((attack) => {
    const owner = players.find((p) => p.id === attack.ownerId);
    shots.push({
      attack,
      tick: system.currentTick,
      at: attack.charges.map((c) => ({ ...c.entity.location })),
      remainingTicks: owner === undefined ? undefined : cooldown.remainingTicks(owner, KEY),
    });
  });
  const clear = (): void => {
    for (const shot of shots) endAttack(shot.attack.attackId);
  };
  return { shots, stop, clear };
}

const shotsOf = (shots: Shot[], player: Player): Shot[] => shots.filter((s) => s.attack.ownerId === player.id);

function chargesIn(dim: Dimension): number {
  return dim.getEntities({ type: CHARGE_ENTITY_ID }).length;
}

function chargesOfAttack(dim: Dimension, attackId: string): number {
  return dim.getEntities({ type: CHARGE_ENTITY_ID, tags: [attackTag(attackId)] }).length;
}

function sweepCharges(): void {
  for (const id of ["overworld", "nether", "the_end"]) {
    for (const e of world.getDimension(id).getEntities({ type: CHARGE_ENTITY_ID, tags: [CHARGE_TAG] })) e.remove();
  }
}

/** Blocks set by a scenario, each put back to what it was. */
class Blocks {
  private readonly placed: Array<{ dim: Dimension; at: Vector3; was: BlockPermutation | undefined }> = [];
  constructor(private readonly test: Test) {}

  setWorld(dim: Dimension, at: Vector3, type: string | BlockPermutation): void {
    this.placed.push({ dim, at, was: dim.getBlock(at)?.permutation });
    if (typeof type === "string") dim.setBlockType(at, type);
    else dim.setBlockPermutation(at, type);
  }

  set(rel: Vector3, type: string | BlockPermutation): Vector3 {
    const at = this.test.worldBlockLocation(rel);
    this.setWorld(this.test.getDimension(), at, type);
    return at;
  }

  restore(): void {
    for (const { dim, at, was } of this.placed.reverse()) {
      try {
        if (was === undefined) dim.setBlockType(at, "minecraft:air");
        else dim.setBlockPermutation(at, was);
      } catch (err) {
        log(`restore ${fmt(at)} threw ${String(err)}`);
      }
    }
    this.placed.length = 0;
  }
}

function arm(player: Player, slot: number = CANNON_SLOT): void {
  const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
  if (container === undefined) throw new Error(`${player.name} has no inventory`);
  container.setItem(slot, new ItemStack(ORBITAL_CANNON.itemId, 1));
  player.selectedSlotIndex = slot;
}

async function untilTick(test: Test, tick: number): Promise<void> {
  while (system.currentTick < tick) await test.idle(1);
}

/** Chat and title calls on any player while it runs; the Action Bar is the HUD's and is not counted. */
function watchMessages(): { count: () => number; restore: () => void } {
  let n = 0;
  const send = Player.prototype.sendMessage;
  const title = ScreenDisplay.prototype.setTitle;
  const subtitle = ScreenDisplay.prototype.updateSubtitle;
  Player.prototype.sendMessage = function (this: Player, message: Parameters<Player["sendMessage"]>[0]): void {
    n++;
    send.call(this, message);
  };
  ScreenDisplay.prototype.setTitle = function (this: ScreenDisplay, ...args: Parameters<ScreenDisplay["setTitle"]>): void {
    n++;
    title.apply(this, args);
  };
  ScreenDisplay.prototype.updateSubtitle = function (this: ScreenDisplay, ...args: Parameters<ScreenDisplay["updateSubtitle"]>): void {
    n++;
    subtitle.apply(this, args);
  };
  return {
    count: () => n,
    restore: () => {
      Player.prototype.sendMessage = send;
      ScreenDisplay.prototype.setTitle = title;
      ScreenDisplay.prototype.updateSubtitle = subtitle;
    },
  };
}

// ---------------------------------------------------------------- AC#1: no block within 10

const WATER: Vector3 = { x: 3, y: 3, z: 1 };
const GRASS_SUPPORT: Vector3 = { x: 3, y: 2, z: 2 };
const GRASS_LOWER: Vector3 = { x: 3, y: 3, z: 2 };
const GRASS_UPPER: Vector3 = { x: 3, y: 4, z: 2 };
/** Eye at z 5.5: the near face of z=-5 is 9.5 away, of z=-6 is 10.5. */
const AT_9_5: Vector3 = { x: 3, y: 3, z: -5 };
const AT_10_5: Vector3 = { x: 3, y: 3, z: -6 };

function tallGrass(blocks: Blocks): void {
  blocks.set(GRASS_SUPPORT, "minecraft:grass_block");
  blocks.set(GRASS_LOWER, BlockPermutation.resolve("minecraft:tall_grass", { upper_block_bit: false }));
  blocks.set(GRASS_UPPER, BlockPermutation.resolve("minecraft:tall_grass", { upper_block_bit: true }));
}

function drainWater(test: Test): void {
  const a = test.worldBlockLocation({ x: -5, y: 1, z: -7 });
  const b = test.worldBlockLocation({ x: 11, y: 4, z: 9 });
  test.getDimension().fillBlocks(new BlockVolume(a, b), "minecraft:air", {
    blockFilter: { includeTypes: ["minecraft:water", "minecraft:flowing_water"] },
  });
}

registerAsync("andrew", "orbital_no_target_silent", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const blocks = new Blocks(test);
  const messages = watchMessages();
  const player = test.spawnSimulatedPlayer(STAND, `${NAME}_silent`, GameMode.Survival);
  const watch = watchShots([player]);
  try {
    await test.idle(4);
    arm(player);
    await test.idle(2);
    player.sendMessage("§7[gametest] orbital-core: message witness control");
    test.assert(messages.count() === 1, `control: a sendMessage to the player counted ${messages.count()} — the witness sees nothing`);
    const baseMessages = messages.count();
    const baseCharges = chargesIn(dim);

    const quiet = async (label: string, presses: Press[]): Promise<void> => {
      const raised: string[] = [];
      for (const p of presses) raised.push(`${p.kind}->[${(await press(test, player, p)).join(",")}]`);
      await test.idle(2);
      const cd = player.getDynamicProperty(cooldownKey(KEY));
      log(`silent RESULT ${label}: ${raised.join(" ")}; attacks ${watch.shots.length}, charges ${chargesIn(dim) - baseCharges}, ${cooldownKey(KEY)}=${String(cd)}, messages ${messages.count() - baseMessages}`);
      test.assert(watch.shots.length === 0, `${label}: ${watch.shots.length} attack(s) fired`);
      test.assert(chargesIn(dim) === baseCharges, `${label}: ${chargesIn(dim) - baseCharges} charge(s) appeared`);
      test.assert(cd === undefined, `${label}: ${cooldownKey(KEY)} was written (${String(cd)})`);
      test.assert(messages.count() === baseMessages, `${label}: ${messages.count() - baseMessages} message(s) sent`);
    };

    player.lookAtLocation({ x: 3.5, y: 45, z: 3.5 });
    await test.idle(4);
    await quiet("open sky", [{ kind: "attack" }, { kind: "use" }]);

    blocks.set(AT_10_5, "minecraft:stone");
    player.lookAtBlock(AT_10_5);
    await test.idle(4);
    await quiet("stone at face 10.5", [{ kind: "attack" }, { kind: "use" }]);
    blocks.restore();

    // Placed after the aim and fired at once: water flows 5 ticks after it is set.
    player.lookAtBlock(WATER);
    await test.idle(4);
    blocks.set(WATER, "minecraft:water");
    try {
      await quiet("water only", [{ kind: "attack" }, { kind: "use" }]);
    } finally {
      blocks.restore();
      drainWater(test);
    }

    tallGrass(blocks);
    player.lookAtBlock(GRASS_LOWER);
    await test.idle(4);
    await quiet("tall grass, air behind", [{ kind: "attack" }, { kind: "use" }, { kind: "break", block: GRASS_LOWER, face: Direction.South }]);
    player.stopBreakingBlock();
    const grass = test.getBlock(GRASS_LOWER).typeId;
    test.assert(grass === "minecraft:tall_grass", `the held Cannon broke the tall grass (now ${grass})`);
    blocks.restore();

    const stone = blocks.set(AT_9_5, "minecraft:stone");
    player.lookAtBlock(AT_9_5);
    await test.idle(4);
    await press(test, player, { kind: "attack" });
    await test.idle(2);
    const shot = watch.shots[0];
    const remaining = cooldown.remainingTicks(player, KEY);
    log(
      `silent RESULT retry at face 9.5: attacks ${watch.shots.length}, target ${shot === undefined ? "-" : fmt(shot.attack.target)} (stone ${fmt(stone)}), ` +
        `charges ${shot === undefined ? 0 : chargesOfAttack(dim, shot.attack.attackId)}, remaining ${remaining}, messages ${messages.count() - baseMessages}`
    );
    test.assert(watch.shots.length === 1, `retry at face 9.5: ${watch.shots.length} attacks, not 1`);
    test.assert(shot.attack.mode === "lmb" && same(shot.attack.target, stone), `retry locked ${fmt(shot.attack.target)} in ${shot.attack.mode}, not the stone at ${fmt(stone)}`);
    test.assert(chargesOfAttack(dim, shot.attack.attackId) === 1, `retry: ${chargesOfAttack(dim, shot.attack.attackId)} charges, not 1`);
    test.assert(player.getDynamicProperty(cooldownKey(KEY)) !== undefined && remaining > 590, `retry: cooldown not set (${remaining} ticks left)`);
    test.assert(messages.count() === baseMessages, `retry: ${messages.count() - baseMessages} message(s) sent`);
    test.succeed();
  } finally {
    messages.restore();
    watch.stop();
    watch.clear();
    blocks.restore();
    sweepCharges();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ---------------------------------------------------------------- AC#3: spawn position per dimension

interface Site {
  dim: Dimension;
  /** World block the player's feet stand in. */
  stand: Vector3;
  target: Vector3;
  shell: string;
}

/** A closed room around `stand` with a floor, air up to the spawn cell and a target 4 blocks north at eye level. */
function buildRoom(dim: Dimension, x0: number, floorY: number, z0: number, topY: number, shell: string): Site {
  dim.fillBlocks(new BlockVolume({ x: x0 - 1, y: floorY - 1, z: z0 - 1 }, { x: x0 + 7, y: topY + 1, z: z0 + 7 }), shell);
  dim.fillBlocks(new BlockVolume({ x: x0, y: floorY + 1, z: z0 }, { x: x0 + 6, y: topY, z: z0 + 6 }), "minecraft:air");
  const target = { x: x0 + 3, y: floorY + 2, z: z0 + 1 };
  dim.setBlockType(target, "minecraft:stone");
  return { dim, stand: { x: x0 + 3, y: floorY + 1, z: z0 + 5 }, target, shell };
}

async function goTo(test: Test, player: SimulatedPlayer, dim: Dimension, stand: Vector3): Promise<void> {
  player.teleport({ x: stand.x + 0.5, y: stand.y, z: stand.z + 0.5 }, { dimension: dim, forceProvidedPositionOnDimensionChange: true });
  for (let t = 0; t < 200; t++) {
    await test.idle(1);
    if (player.dimension.id === dim.id && Math.abs(player.location.y - stand.y) < 0.01) return;
  }
  throw new Error(`${player.name} did not arrive in ${dim.id} at ${fmt(stand)} (at ${fmt(player.location)} in ${player.dimension.id})`);
}

registerAsync("andrew", "orbital_spawn_dimensions", async (test: Test): Promise<void> => {
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const overworld = test.getDimension();
  const nether = world.getDimension("nether");
  const end = world.getDimension("the_end");
  const blocks = new Blocks(test);
  const unloads: Array<() => void> = [];
  const player = test.spawnSimulatedPlayer(STAND, `${NAME}_dims`, GameMode.Survival);
  const watch = watchShots([player]);
  try {
    await test.idle(4);
    arm(player);

    // The Nether at y 40: above its lava sea. The End 400 blocks out: void, far from the dragon's island.
    const netherBox = { min: [origin.x - 1, 36, origin.z - 1] as [number, number, number], max: [origin.x + 7, 54, origin.z + 7] as [number, number, number] };
    unloads.push(await loadBox(test, nether, "andrew_gt_orbc_n", netherBox));
    const endX = origin.x + 400;
    const endBox = { min: [endX - 1, 56, origin.z - 1] as [number, number, number], max: [endX + 7, 94, origin.z + 7] as [number, number, number] };
    unloads.push(await loadBox(test, end, "andrew_gt_orbc_e", endBox));

    const sites: Site[] = [
      { dim: overworld, stand: test.worldBlockLocation(STAND), target: blocks.set({ x: 3, y: 3, z: 1 }, "minecraft:stone"), shell: "-" },
      buildRoom(nether, origin.x, 38, origin.z, 53, "minecraft:netherrack"),
      buildRoom(end, endX, 58, origin.z, 93, "minecraft:end_stone"),
    ];

    const results: string[] = [];
    for (const site of sites) {
      await goTo(test, player, site.dim, site.stand);
      cooldown.clearCooldown(player, KEY);
      player.lookAtBlock(test.relativeBlockLocation(site.target));
      await test.idle(4);
      const before = watch.shots.length;
      await press(test, player, { kind: "attack" });
      await test.idle(1);
      test.assert(watch.shots.length === before + 1, `${site.dim.id}: ${watch.shots.length - before} attacks, not 1`);
      const shot = watch.shots[before];
      const expectedY = spawnY(site.dim.id, site.target.y, site.dim.heightRange);
      const expected = { x: site.target.x + 0.5, y: expectedY, z: site.target.z + 0.5 };
      const seen = shot.at[0];
      results.push(`${site.dim.id} target ${fmt(site.target)} spawnY ${shot.attack.spawnY} (pure ${expectedY}) charge ${seen === undefined ? "none" : fmt(seen)}`);
      log(`dims RESULT ${results[results.length - 1]}`);
      test.assert(same(shot.attack.target, site.target), `${site.dim.id}: locked ${fmt(shot.attack.target)}, not ${fmt(site.target)}`);
      test.assert(shot.attack.dimensionId === site.dim.id, `${site.dim.id}: the attack is in ${shot.attack.dimensionId}`);
      test.assert(shot.attack.spawnY === expectedY, `${site.dim.id}: spawnY ${shot.attack.spawnY}, the pure function says ${expectedY}`);
      test.assert(shot.at.length === 1 && near(seen, expected), `${site.dim.id}: the charge was at ${seen === undefined ? "nowhere" : fmt(seen)} in its spawn tick, not ${fmt(expected)}`);
      test.assert(expectedY === site.target.y + (site.dim.id === "minecraft:nether" ? 10 : 30), `${site.dim.id}: the site is clamped (${expectedY}) — it proves no offset`);
    }
    await goTo(test, player, overworld, test.worldBlockLocation(STAND));
    test.succeed();
  } finally {
    watch.stop();
    watch.clear();
    blocks.restore();
    for (const unload of unloads) unload();
    sweepCharges();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

// ---------------------------------------------------------------- AC#4: one per tick, lock, faces, passable

const SIDE_T: Vector3 = { x: 3, y: 3, z: 1 };

registerAsync("andrew", "orbital_dedup_lock_faces", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const blocks = new Blocks(test);
  const player = test.spawnSimulatedPlayer(STAND, `${NAME}_lock`, GameMode.Survival);
  const watch = watchShots([player]);
  try {
    await test.idle(4);
    arm(player);
    const side = blocks.set(SIDE_T, "minecraft:stone");
    player.lookAtBlock(SIDE_T);
    await test.idle(4);

    // 1. Three synthetic inputs in one tick: itemStartUseOn, itemUse, entityHitBlock.
    const sideBlock = dim.getBlock(side) as Block;
    const tick = system.currentTick;
    const a1 = activate(player, "rmb", sideBlock, Direction.South);
    const a2 = activate(player, "rmb");
    const a3 = activate(player, "lmb", sideBlock, Direction.South);
    const sameTick = system.currentTick === tick;
    log(`dedup RESULT three inputs in tick ${tick} (same tick ${sameTick}): attacks ${watch.shots.length} modes [${watch.shots.map((s) => s.attack.mode).join(",")}] returns ${[a1, a2, a3].map((a) => (a === undefined ? "-" : a.mode)).join(",")}`);
    test.assert(sameTick, "the three calls straddled a tick");
    test.assert(watch.shots.length === 1 && watch.shots[0].attack.mode === "rmb", `three same-tick inputs made ${watch.shots.length} attack(s) [${watch.shots.map((s) => s.attack.mode).join(",")}], not one rmb`);

    // The tick guard alone, with the cooldown cleared between the calls; the next tick it lets go.
    cooldown.clearCooldown(player, KEY);
    const guarded = activate(player, "lmb", sideBlock, Direction.South);
    await test.idle(1);
    const nextTick = activate(player, "lmb", sideBlock, Direction.South);
    log(`dedup RESULT tick guard: same tick after a cleared cooldown ${guarded === undefined ? "refused" : "FIRED"}, next tick ${nextTick === undefined ? "refused" : "fired"}`);
    test.assert(guarded === undefined, "a second activation in the same tick fired once the cooldown was cleared — no tick guard");
    test.assert(nextTick !== undefined, "control: the next tick did not fire either — the guard proves nothing");
    watch.clear();
    watch.shots.length = 0;

    // 2. Lock: fire north, then next tick step 5 blocks (3 east, 4 north) and face south, where another block waits.
    const decoy = blocks.set({ x: 6, y: 3, z: 4 }, "minecraft:gold_block");
    cooldown.clearCooldown(player, KEY);
    await test.idle(1);
    await press(test, player, { kind: "attack" });
    test.assert(watch.shots.length === 1, `lock: ${watch.shots.length} attacks, not 1`);
    const locked = watch.shots[0].attack;
    const charge = locked.charges[0].entity;
    const firedAt = { ...charge.location };
    player.teleport(test.worldLocation({ x: 6.5, y: 2, z: 1.5 }));
    player.lookAtLocation({ x: 6.5, y: 3.5, z: 9 });
    await test.idle(4);
    const view = player.getBlockFromViewDirection({ maxDistance: 10 });
    const live = activeAttacks().get(locked.attackId);
    log(
      `lock RESULT fired at ${fmt(side)}; moved to ${fmt(player.location)}, view ${fmt(player.getViewDirection())}, now sees ${view === undefined ? "nothing" : fmt(view.block.location)}; ` +
        `attack target ${fmt(locked.target)}, charge ${fmt(firedAt)} -> ${charge.isValid ? fmt(charge.location) : "gone"}`
    );
    test.assert(view !== undefined && same(view.block.location, decoy), "lock: after the turn the player does not see the other block — a re-read would go unnoticed");
    test.assert(live !== undefined && same(live.target, side), `lock: the attack's target moved to ${live === undefined ? "nothing" : fmt(live.target)}`);
    test.assert(charge.isValid && near(charge.location, firedAt) && near(firedAt, { x: side.x + 0.5, y: locked.spawnY, z: side.z + 0.5 }), `lock: the charge column is ${charge.isValid ? fmt(charge.location) : "gone"}, not the target's`);
    watch.clear();
    watch.shots.length = 0;
    player.teleport(test.worldLocation({ x: 3.5, y: 2, z: 5.5 }));
    await test.idle(4);

    // 3. Faces: bottom from below, side from 4 blocks, top from above. Ray (swing) and event (use on block).
    blocks.restore();
    const faces: Array<{ face: Direction; rel: Vector3; stand: Vector3 }> = [
      { face: Direction.Down, rel: { x: 3, y: 6, z: 3 }, stand: { x: 3.5, y: 2, z: 5.5 } },
      { face: Direction.South, rel: SIDE_T, stand: { x: 3.5, y: 2, z: 5.5 } },
      { face: Direction.Up, rel: { x: 3, y: 1, z: 3 }, stand: { x: 3.5, y: 2, z: 4.5 } },
    ];
    for (const { face, rel, stand } of faces) {
      const t = blocks.set(rel, "minecraft:gold_block");
      player.teleport(test.worldLocation(stand));
      player.lookAtBlock(rel);
      await test.idle(4);
      for (const p of [{ kind: "attack" }, { kind: "useOn", block: rel, face }] as Press[]) {
        cooldown.clearCooldown(player, KEY);
        await test.idle(1);
        const before = watch.shots.length;
        await press(test, player, p);
        const shot = watch.shots[before];
        log(`faces RESULT ${face} via ${p.kind}: locked ${shot === undefined ? "nothing" : `${fmt(shot.attack.target)} face ${shot.attack.face}`}, block ${fmt(t)}`);
        test.assert(shot !== undefined && same(shot.attack.target, t), `${face} face via ${p.kind}: locked ${shot === undefined ? "nothing" : fmt(shot.attack.target)}, not the block at ${fmt(t)}`);
      }
      blocks.restore();
      watch.clear();
    }
    watch.shots.length = 0;

    // 4. Passable: tall grass in front of stone at 6 blocks.
    player.teleport(test.worldLocation({ x: 3.5, y: 2, z: 5.5 }));
    tallGrass(blocks);
    const stone = blocks.set({ x: 3, y: 3, z: -1 }, "minecraft:stone");
    player.lookAtBlock(GRASS_LOWER);
    await test.idle(4);
    for (const p of [{ kind: "attack" }, { kind: "break", block: GRASS_LOWER, face: Direction.South }] as Press[]) {
      cooldown.clearCooldown(player, KEY);
      await test.idle(1);
      const before = watch.shots.length;
      await press(test, player, p);
      if (p.kind === "break") player.stopBreakingBlock();
      const shot = watch.shots[before];
      log(`passable RESULT tall grass before stone via ${p.kind}: locked ${shot === undefined ? "nothing" : fmt(shot.attack.target)}, stone ${fmt(stone)}, eye→stone ${distanceToBlock(player.getHeadLocation(), stone).toFixed(2)}`);
      test.assert(shot !== undefined && same(shot.attack.target, stone), `tall grass via ${p.kind}: locked ${shot === undefined ? "nothing" : fmt(shot.attack.target)}, not the stone behind it`);
    }
    test.succeed();
  } finally {
    watch.stop();
    watch.clear();
    blocks.restore();
    sweepCharges();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ---------------------------------------------------------------- AC#5: one shared cooldown

registerAsync("andrew", "orbital_shared_cooldown", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const blocks = new Blocks(test);
  const p = test.spawnSimulatedPlayer(STAND_P, `${NAME}_cd_p`, GameMode.Survival);
  const q = test.spawnSimulatedPlayer(STAND_Q, `${NAME}_cd_q`, GameMode.Survival);
  const watch = watchShots([p, q]);
  try {
    await test.idle(4);
    arm(p);
    arm(q);
    const tp = { x: 2, y: 3, z: 1 };
    const tq = { x: 4, y: 3, z: 1 };
    blocks.set(tp, "minecraft:stone");
    blocks.set(tq, "minecraft:stone");
    p.lookAtBlock(tp);
    q.lookAtBlock(tq);
    await test.idle(4);

    await press(test, p, { kind: "use" });
    const first = shotsOf(watch.shots, p)[0];
    test.assert(first !== undefined && first.attack.mode === "rmb", "P's RMB did not fire");
    const t = first.tick;
    log(`cooldown RESULT P rmb at tick ${t}: remainingTicks in that tick ${first.remainingTicks}`);
    test.assert(first.remainingTicks !== undefined && first.remainingTicks >= 599 && first.remainingTicks <= 600, `remainingTicks in the firing tick is ${first.remainingTicks}, not 599..600`);

    await untilTick(test, t + 20);
    const charges = chargesIn(dim);
    const pShots = shotsOf(watch.shots, p).length;
    const lmb = await press(test, p, { kind: "attack" });
    const rmb = await press(test, p, { kind: "use" });
    await test.idle(2);
    log(`cooldown RESULT t+20 P lmb raised [${lmb.join(",")}], rmb raised [${rmb.join(",")}]: new P attacks ${shotsOf(watch.shots, p).length - pShots}, charges ${charges} -> ${chargesIn(dim)}`);
    test.assert(shotsOf(watch.shots, p).length === pShots, `t+20: P fired ${shotsOf(watch.shots, p).length - pShots} more attack(s) on cooldown`);
    test.assert(chargesIn(dim) === charges, `t+20: the charge count moved ${charges} -> ${chargesIn(dim)}`);

    await press(test, q, { kind: "use" });
    const qShot = shotsOf(watch.shots, q)[0];
    log(`cooldown RESULT t+20 Q rmb: ${qShot === undefined ? "blocked" : `fired at ${qShot.tick}, ${qShot.at.length} charges`}`);
    test.assert(qShot !== undefined, "Q's RMB was blocked by P's cooldown");

    // Real milliseconds (cooldown.ts), so 600 ticks is 30 s only at 20 TPS: wait for the clock, bounded.
    await untilTick(test, t + 600);
    let extra = 0;
    while (!cooldown.isReady(p, KEY) && extra < 40) {
      await test.idle(1);
      extra++;
    }
    const readyAt = system.currentTick;
    await press(test, p, { kind: "attack" });
    const second = shotsOf(watch.shots, p)[1];
    log(`cooldown RESULT P ready at t+${readyAt - t} (${extra} tick(s) past t+600); lmb ${second === undefined ? "blocked" : `fired in ${second.attack.mode}`}`);
    test.assert(second !== undefined && second.attack.mode === "lmb", `at t+${readyAt - t} P's LMB did not fire`);

    // Reverse order: LMB first, RMB blocked.
    await untilTick(test, second.tick + 20);
    const before = shotsOf(watch.shots, p).length;
    const raised = await press(test, p, { kind: "use" });
    await test.idle(2);
    log(`cooldown RESULT reverse: after P's LMB, P's RMB raised [${raised.join(",")}] and fired ${shotsOf(watch.shots, p).length - before}`);
    test.assert(shotsOf(watch.shots, p).length === before, "after an LMB shot, P's RMB fired on cooldown");
    test.succeed();
  } finally {
    watch.stop();
    watch.clear();
    blocks.restore();
    sweepCharges();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(1000)
  .tag("andrew");

// ---------------------------------------------------------------- AC#6: HUD

const NAME_KEY: RawMessage = { translate: `${ORBITAL_CANNON.nameKey}.name` };
const READY: RawMessage = { rawtext: [{ translate: "andrew.orbital.hud_ready", with: { rawtext: [NAME_KEY] } }] };
const cooling = (s: number): RawMessage => ({
  rawtext: [{ translate: "andrew.orbital.hud_cooldown", with: { rawtext: [NAME_KEY, { text: String(s) }] } }],
});

function toOffHand(player: Player): void {
  const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
  const stack = container?.getItem(CANNON_SLOT);
  if (container === undefined || stack === undefined) throw new Error(`${player.name} holds no Cannon to move`);
  const ok = player.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Offhand, stack);
  if (ok !== true) throw new Error("setEquipment(Offhand) refused the Cannon");
  container.setItem(CANNON_SLOT, undefined);
}

function toMainHand(player: Player): void {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  const stack = equippable?.getEquipment(EquipmentSlot.Offhand);
  if (stack === undefined) throw new Error(`${player.name} holds no Cannon in the off hand`);
  equippable?.setEquipment(EquipmentSlot.Offhand, undefined);
  player.getComponent(EntityComponentTypes.Inventory)?.container?.setItem(CANNON_SLOT, stack);
}

function emptyHands(player: Player): void {
  player.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Offhand, undefined);
  player.getComponent(EntityComponentTypes.Inventory)?.container?.setItem(CANNON_SLOT, undefined);
}

registerAsync("andrew", "orbital_hud", async (test: Test): Promise<void> => {
  const blocks = new Blocks(test);
  const p = test.spawnSimulatedPlayer(STAND_P, `${NAME}_hud_p`, GameMode.Survival);
  const q = test.spawnSimulatedPlayer(STAND_Q, `${NAME}_hud_q`, GameMode.Survival);
  const watch = watchShots([p, q]);
  const show = (m: RawMessage | undefined): string => (m === undefined ? "undefined" : JSON.stringify(m));
  const expect = (label: string, got: RawMessage | undefined, want: RawMessage | undefined): void => {
    log(`hud RESULT ${label}: ${show(got)}`);
    test.assert(show(got) === show(want), `${label}: ${show(got)}, expected ${show(want)}`);
  };
  try {
    await test.idle(4);
    arm(p);
    arm(q);
    await test.idle(2);
    expect("P main hand, ready", hudMessage(p), READY);
    toOffHand(p);
    expect("P off hand only, ready", hudMessage(p), READY);
    emptyHands(p);
    expect("P no Cannon", hudMessage(p), undefined);

    arm(p);
    const tp = blocks.set({ x: 2, y: 3, z: 1 }, "minecraft:stone");
    p.lookAtBlock({ x: 2, y: 3, z: 1 });
    await test.idle(4);
    await press(test, p, { kind: "attack" });
    const shot = watch.shots[0];
    test.assert(shot !== undefined && same(shot.attack.target, tp), "P's shot did not fire");

    // The countdown is ceil(real ms / 1000): at exactly t+60 a clock a tick ahead still reads 28.
    await untilTick(test, shot.tick + 60);
    while (cooldown.remainingMs(p, KEY) > 27000 && system.currentTick < shot.tick + 66) await test.idle(1);
    const offset = system.currentTick - shot.tick;
    log(`hud RESULT reading at t+${offset}, remainingMs ${cooldown.remainingMs(p, KEY)}`);
    expect(`P main hand, t+${offset}`, hudMessage(p), cooling(27));
    toOffHand(p);
    expect(`P off hand only, t+${offset}`, hudMessage(p), cooling(27));
    expect(`Q main hand, t+${offset}`, hudMessage(q), READY);
    emptyHands(p);
    expect(`P no Cannon, t+${offset}`, hudMessage(p), undefined);
    test.assert(system.currentTick - shot.tick <= 66, "the readings straddled more than a few ticks");
    test.succeed();
  } finally {
    watch.stop();
    watch.clear();
    blocks.restore();
    sweepCharges();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

// ---------------------------------------------------------------- AC#7: the measured input set

async function holdBreaks(test: Test, player: SimulatedPlayer, rel: Vector3, ticks: number): Promise<string> {
  player.lookAtBlock(rel);
  await test.idle(4);
  await press(test, player, { kind: "break", block: rel, face: Direction.South });
  await test.idle(ticks);
  player.stopBreakingBlock();
  await test.idle(2);
  return test.getBlock(rel).typeId;
}

async function inputPaths(test: Test, mode: GameMode): Promise<void> {
  const blocks = new Blocks(test);
  const player = test.spawnSimulatedPlayer(STAND, `${NAME}_in_${mode}`, mode);
  const watch = watchShots([player]);
  const tag = `${mode}:`;
  try {
    await test.idle(4);
    arm(player);
    await test.idle(2);

    // Use on a block: only itemStartUseOn arrives. Aimed at another block, so the lock can only come from the event.
    const used = blocks.set({ x: 3, y: 3, z: 1 }, "minecraft:stone");
    blocks.set({ x: 1, y: 3, z: 1 }, "minecraft:stone");
    player.lookAtBlock({ x: 1, y: 3, z: 1 });
    await test.idle(4);
    cooldown.clearCooldown(player, KEY);
    const raisedOn = await press(test, player, { kind: "useOn", block: { x: 3, y: 3, z: 1 }, face: Direction.South });
    await test.idle(2);
    const onShot = watch.shots[0];
    log(`input RESULT ${tag} use on block raised [${raisedOn.join(",")}]: ${watch.shots.length} attack(s), mode ${onShot?.attack.mode ?? "-"}, locked ${onShot === undefined ? "-" : fmt(onShot.attack.target)} (used ${fmt(used)})`);
    test.assert(watch.shots.length === 1 && onShot.attack.mode === "rmb" && same(onShot.attack.target, used), `${tag} use on a block: ${watch.shots.length} attack(s), locked ${onShot === undefined ? "-" : fmt(onShot.attack.target)}`);
    blocks.restore();
    watch.clear();
    watch.shots.length = 0;

    // A swing at a block 8 blocks out: playerSwingStart and the ray, no entityHitBlock.
    const far = blocks.set({ x: 3, y: 3, z: -3 }, "minecraft:stone");
    player.lookAtBlock({ x: 3, y: 3, z: -3 });
    await test.idle(4);
    cooldown.clearCooldown(player, KEY);
    const raisedSwing = await press(test, player, { kind: "attack" });
    await test.idle(10);
    log(`input RESULT ${tag} swing at a block 8 out raised [${raisedSwing.join(",")}]: ${watch.shots.length} attack(s), locked ${watch.shots[0] === undefined ? "-" : fmt(watch.shots[0].attack.target)}`);
    test.assert(!raisedSwing.includes("entityHitBlock"), `${tag} the swing also raised entityHitBlock — the measurement changed`);
    test.assert(watch.shots.length === 1 && same(watch.shots[0].attack.target, far), `${tag} swing at 8: ${watch.shots.length} attack(s)`);
    blocks.restore();
    watch.clear();
    watch.shots.length = 0;

    // A swing at the sky: the swing arrives, nothing fires, no cooldown.
    cooldown.clearCooldown(player, KEY);
    player.lookAtLocation({ x: 3.5, y: 45, z: 3.5 });
    await test.idle(4);
    const raisedSky = await press(test, player, { kind: "attack" });
    await test.idle(10);
    const cd = player.getDynamicProperty(cooldownKey(KEY));
    log(`input RESULT ${tag} swing at the sky raised [${raisedSky.join(",")}]: ${watch.shots.length} attack(s), ${cooldownKey(KEY)}=${String(cd)}`);
    test.assert(watch.shots.length === 0, `${tag} a swing at the sky fired`);
    test.assert(cd === undefined, `${tag} a swing at the sky wrote the cooldown`);

    // Holding LMB on a block: an empty hand breaks it (control), the Cannon never does.
    const dirt = { x: 3, y: 3, z: 3 };
    blocks.set(dirt, "minecraft:dirt");
    player.selectedSlotIndex = EMPTY_SLOT;
    const control = await holdBreaks(test, player, dirt, 40);
    blocks.restore();
    blocks.set(dirt, "minecraft:dirt");
    player.selectedSlotIndex = CANNON_SLOT;
    cooldown.clearCooldown(player, KEY);
    await test.idle(1);
    const held = await holdBreaks(test, player, dirt, 40);
    log(`input RESULT ${tag} hold on dirt: empty hand left ${control}, the Cannon left ${held}; attacks during the hold ${watch.shots.length}`);
    test.assert(control === "minecraft:air", `${tag} control: an empty-hand hold left ${control} — the hold is too short to prove anything`);
    test.assert(held === "minecraft:dirt", `${tag} holding the Cannon broke the target (now ${held})`);
    test.assert(watch.shots.length === 1, `${tag} a hold fired ${watch.shots.length} attacks, not 1`);
    blocks.restore();
    watch.clear();
    watch.shots.length = 0;

    // LMB is a main-hand action (L0-lgnd-as14): the same swing with the Cannon in the off hand only fires nothing.
    toOffHand(player);
    const offFar = { x: 3, y: 3, z: -3 };
    blocks.set(offFar, "minecraft:stone");
    player.selectedSlotIndex = EMPTY_SLOT;
    player.lookAtBlock(offFar);
    await test.idle(4);
    cooldown.clearCooldown(player, KEY);
    const raisedOff = await press(test, player, { kind: "attack" });
    await test.idle(4);
    log(`input RESULT ${tag} swing with the Cannon in the off hand only raised [${raisedOff.join(",")}]: ${watch.shots.length} attack(s)`);
    test.assert(watch.shots.length === 0, `${tag} an off-hand Cannon fired on a swing`);
    test.succeed();
  } finally {
    watch.stop();
    watch.clear();
    blocks.restore();
    sweepCharges();
  }
}

registerAsync("andrew", "orbital_input_survival", (test: Test) => inputPaths(test, GameMode.Survival))
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

registerAsync("andrew", "orbital_input_creative", (test: Test) => inputPaths(test, GameMode.Creative))
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ---------------------------------------------------------------- AC#9: spawned inside a solid block

interface Detonation {
  mode: Mode;
  point: Vector3;
  attackId: string;
  tick: number;
}

/** Records every onDetonate of `mode` while passing it on to the registered effect. */
function recordDetonations(mode: Mode): { calls: Detonation[]; restore: () => void } {
  const effect = effectFor(mode);
  if (effect === undefined) throw new Error(`no ${mode} effect registered`);
  const calls: Detonation[] = [];
  const recording: Effect = {
    layout: (target) => effect.layout(target),
    scale: effect.scale,
    onDetonate(d, point, ownerId, m, attackId) {
      calls.push({ mode: m, point: { ...point }, attackId, tick: system.currentTick });
      effect.onDetonate(d, point, ownerId, m, attackId);
    },
  };
  registerEffect(mode, recording);
  return { calls, restore: () => registerEffect(mode, effect) };
}

registerAsync("andrew", "orbital_inside_solid", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const blocks = new Blocks(test);
  const lmb = recordDetonations("lmb");
  const rmb = recordDetonations("rmb");
  const player = test.spawnSimulatedPlayer(STAND, `${NAME}_solid`, GameMode.Survival);
  const watch = watchShots([player]);
  try {
    await test.idle(4);
    arm(player);
    const target = blocks.set({ x: 3, y: 3, z: 1 }, "minecraft:stone");
    const cellY = spawnY(dim.id, target.y, dim.heightRange);
    const cell = { x: target.x, y: cellY, z: target.z };
    blocks.setWorld(dim, cell, "minecraft:stone");
    player.lookAtBlock({ x: 3, y: 3, z: 1 });
    await test.idle(4);

    await press(test, player, { kind: "attack" });
    const shot = watch.shots[0];
    test.assert(shot !== undefined, "the LMB shot did not fire");
    const charge = shot.attack.charges.length === 0 ? undefined : shot.attack.charges[0];
    log(`solid RESULT lmb: onDetonate ${lmb.calls.length}x at ${lmb.calls.map((c) => `${fmt(c.point)}@${c.tick}`).join(" ")}; activation tick ${shot.tick}; spawn cell ${fmt(cell)}; charge seen at ${fmt(shot.at[0])}`);
    test.assert(lmb.calls.length === 1, `onDetonate ran ${lmb.calls.length} times, not once`);
    test.assert(lmb.calls[0].tick === shot.tick, `onDetonate ran in tick ${lmb.calls[0].tick}, the activation was ${shot.tick}`);
    test.assert(same(lmb.calls[0].point, cell), `onDetonate point ${fmt(lmb.calls[0].point)}, not the solid spawn cell ${fmt(cell)}`);
    test.assert(charge === undefined && !activeAttacks().has(shot.attack.attackId), "the detonated charge is still held by a live attack");
    await test.idle(1);
    test.assert(chargesOfAttack(dim, shot.attack.attackId) === 0, "a charge entity of the detonated attack is still in the world a tick later");

    // Control: the same shot with air in the spawn cell does not go off.
    blocks.restore();
    blocks.set({ x: 3, y: 3, z: 1 }, "minecraft:stone");
    cooldown.clearCooldown(player, KEY);
    await test.idle(1);
    await press(test, player, { kind: "attack" });
    await test.idle(1);
    const open = watch.shots[1];
    log(`solid RESULT control, air at the spawn cell: onDetonate ${lmb.calls.length - 1} more; charge ${open === undefined ? "-" : `${open.attack.charges.length} alive at ${fmt(open.at[0])}`}`);
    test.assert(open !== undefined && lmb.calls.length === 1, "control: a charge in open air went off at spawn");
    test.assert(open.attack.charges.length === 1 && open.attack.charges[0].entity.isValid, "control: the open-air charge is gone");

    // RMB: only the columns whose spawn cell is solid go off, each once, the rest stay.
    const layout = effectFor("rmb")?.layout(target) ?? [];
    const solid = layout.slice(0, 3);
    for (const c of solid) blocks.setWorld(dim, { x: c.x, y: cellY, z: c.z }, "minecraft:stone");
    cooldown.clearCooldown(player, KEY);
    await test.idle(1);
    await press(test, player, { kind: "use" });
    const ring = watch.shots[2];
    log(`solid RESULT rmb: ${rmb.calls.length} detonation(s) at ${rmb.calls.map((c) => fmt(c.point)).join(" ")}; ${ring?.attack.charges.length ?? 0} of ${layout.length} charges stay`);
    test.assert(ring !== undefined && rmb.calls.length === solid.length, `rmb: ${rmb.calls.length} detonations, not ${solid.length}`);
    for (const c of solid) test.assert(rmb.calls.some((d) => same(d.point, { x: c.x, y: cellY, z: c.z }) && d.tick === ring.tick), `rmb: no detonation at ${c.x},${cellY},${c.z} in the activation tick`);
    test.assert(ring.attack.charges.length === layout.length - solid.length, `rmb: ${ring.attack.charges.length} charges stay, not ${layout.length - solid.length}`);
    test.succeed();
  } finally {
    lmb.restore();
    rmb.restore();
    watch.stop();
    watch.clear();
    blocks.restore();
    sweepCharges();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

// ---------------------------------------------------------------- as03 probe: contact set vs the engine

const PROBE_CONTACT = [
  "minecraft:stone",
  "minecraft:oak_leaves",
  "minecraft:glass",
  "minecraft:glass_pane",
  "minecraft:oak_slab",
  "minecraft:white_carpet",
  "minecraft:oak_fence",
  "minecraft:barrier",
  "minecraft:snow_layer",
  "minecraft:chest",
  "minecraft:standing_sign",
  "minecraft:ladder",
];

/**
 * Per block type, placed in one cell and read in the same tick: isContact(),
 * Block.isSolid if the stable module exposes it, and whether the target ray
 * (includePassableBlocks: false) stops in it or goes on to the floor below.
 */
registerAsync("andrew", "probe_orbital_contact", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const player = test.spawnSimulatedPlayer({ x: 3, y: 2, z: 4 }, `${NAME}_probe`, GameMode.Creative);
  const cellRel = { x: 3, y: 2, z: 3 };
  const cell = test.worldBlockLocation(cellRel);
  const floor = test.worldBlockLocation({ x: 3, y: 1, z: 3 });
  try {
    await test.idle(4);
    // The view is aimed so the real ray (1.52 above the feet, not the 1.62 lookAt aims from) crosses the
    // cell's centre 0.03 above the floor: thin blocks and fence posts lie on it.
    const eye = player.getHeadLocation();
    const aimFrom = { x: eye.x, y: eye.y + 0.1, z: eye.z };
    const through = { x: cell.x + 0.5, y: cell.y + 0.03, z: cell.z + 0.5 };
    const look = { x: aimFrom.x + (through.x - eye.x), y: aimFrom.y + (through.y - eye.y), z: aimFrom.z + (through.z - eye.z) };
    player.lookAtLocation(test.relativeLocation(look));
    await test.idle(4);

    const rows: string[] = [];
    let solidReadable = 0;
    let solidAgrees = 0;
    let rayAgrees = 0;
    const disagreements: string[] = [];
    const ids = [...PASS_THROUGH, ...PROBE_CONTACT];
    for (const id of ids) {
      dim.setBlockType(cell, id);
      const block = dim.getBlock(cell) as Block;
      const contact = isContact(block);
      const solid: unknown = Reflect.get(block, "isSolid");
      const hit = player.getBlockFromViewDirection({ maxDistance: 10, includeLiquidBlocks: false, includePassableBlocks: false });
      const rayStops = hit !== undefined && same(hit.block.location, cell);
      const rayFloor = hit !== undefined && same(hit.block.location, floor);
      if (typeof solid === "boolean") {
        solidReadable++;
        if (solid === contact) solidAgrees++;
      }
      if (rayStops === contact && (rayStops || rayFloor)) rayAgrees++;
      else disagreements.push(`${id}(contact=${contact} ray=${rayStops ? "stops" : rayFloor ? "passes" : hit === undefined ? "none" : fmt(hit.block.location)})`);
      rows.push(`${id.replace("minecraft:", "")}:${contact ? "C" : "P"}/${String(solid)}/${rayStops ? "stop" : rayFloor ? "pass" : "other"}`);
      dim.setBlockType(cell, "minecraft:air");
    }
    // Controls: stone must stop the ray, air must let it reach the floor.
    dim.setBlockType(cell, "minecraft:stone");
    const stoneHit = player.getBlockFromViewDirection({ maxDistance: 10, includePassableBlocks: false });
    dim.setBlockType(cell, "minecraft:air");
    const airHit = player.getBlockFromViewDirection({ maxDistance: 10, includePassableBlocks: false });
    log(`[probe] ORBC-CONTACT rows ${rows.join(" ")}`);
    console.warn(
      `[probe] ORBC-CONTACT RESULT ${ids.length} block types: Block.isSolid readable on ${solidReadable}, agrees with isContact on ${solidAgrees}; ` +
        `target ray agrees with isContact on ${rayAgrees}/${ids.length}; disagreements: ${disagreements.join(" ") || "none"}; ` +
        `controls stone->${stoneHit === undefined ? "none" : fmt(stoneHit.block.location)} air->${airHit === undefined ? "none" : `${fmt(airHit.block.location)} ${airHit.face} at x,z ${airHit.faceLocation.x.toFixed(3)},${airHit.faceLocation.z.toFixed(3)}`} (cell ${fmt(cell)}, floor ${fmt(floor)})`
    );
    test.assert(stoneHit !== undefined && same(stoneHit.block.location, cell), "control: the ray does not stop at stone in the cell — the aim misses it");
    test.assert(airHit !== undefined && same(airHit.block.location, floor), "control: with air in the cell the ray does not reach the floor below it");
    test.succeed();
  } finally {
    dim.setBlockType(cell, "minecraft:air");
  }
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");
