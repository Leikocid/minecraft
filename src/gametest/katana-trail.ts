// The Dragon Katana's petal trail on a real engine (L0-katn-ac06: the call
// counter on a jump, silence on a refusal and on cooldown, harmlessness to a
// husk and a second player on the jump line, and a silent skip into an
// unloaded chunk). Visual correctness is an iPad call (L0-katn-ac09), not this
// file's: only the call counter and harmlessness are proven here.

import {
  BlockPermutation,
  Difficulty,
  type Entity,
  type EntityHurtAfterEvent,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { clearCooldown } from "../legendary/cooldown";
import { DRAGON_KATANA, cooldownKey } from "../legendary/registry";
import { type Activation, observeActivations } from "../katana";
import { MAX_TRAIL_POINTS, PARTICLES_PER_POINT, resetTrailCallCount, spawnTrail, trailCallCount, trailCallTicks, trailPoints } from "../katana/trail";

const STRUCTURE = "andrew:platform";
const PREFIX = "katt_";
const SLOT = 0;
const START: Vector3 = { x: 2, y: 2, z: 3 };
const FLOOR_Y = 1;
/** A level jump 19 blocks east, same geometry T05 uses (src/gametest/katana.ts). */
const FLOOR_TARGET: Vector3 = { x: START.x + 19, y: FLOOR_Y, z: START.z };
const CD_KEY = cooldownKey(DRAGON_KATANA.abilityKey);

const log = (msg: string): void => console.warn(`[gametest] katana-trail ${msg}`);
const f2 = (v: number): string => v.toFixed(2);
const cellKey = (v: Vector3): string => `${v.x},${v.y},${v.z}`;
const len = (v: Vector3): number => Math.hypot(v.x, v.y, v.z);
const sub = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

// ---------------------------------------------------------------- the jumper

interface Jump {
  activation: Activation;
  tick: number;
}

const jumps: Jump[] = [];

observeActivations((activation) => {
  const p = activation.player;
  if (!p.name.startsWith(PREFIX)) return;
  jumps.push({ activation, tick: system.currentTick });
});

const jumpsOf = (player: Player): Jump[] => jumps.filter((j) => j.activation.player.id === player.id);

async function jumper(test: Test, name: string): Promise<SimulatedPlayer> {
  const player = test.spawnSimulatedPlayer(START, `${PREFIX}${name}`, GameMode.Survival);
  await test.idle(4);
  player.selectedSlotIndex = SLOT;
  player.setItem(new ItemStack(DRAGON_KATANA.itemId, 1), SLOT, true);
  clearCooldown(player, DRAGON_KATANA.abilityKey);
  await test.idle(2);
  return player;
}

/**
 * Aims `player` at the test-relative point `at`, the same two-step
 * calibration as src/gametest/katana.ts aim(): lookAtLocation aims from a
 * higher eye than getHeadLocation() reports (1.62 vs 1.52 on 1.26.51.1).
 */
async function aim(test: Test, player: SimulatedPlayer, at: Vector3): Promise<void> {
  player.lookAtLocation(at);
  await test.idle(4);
  const head = test.relativeLocation(player.getHeadLocation());
  const view = player.getViewDirection();
  const flat = Math.hypot(view.x, view.z);
  if (flat < 1e-6) return;
  const lookEye = at.y - (view.y / flat) * Math.hypot(at.x - head.x, at.z - head.z);
  const lift = lookEye - head.y;
  if (Math.abs(lift) < 1e-4) return;
  player.lookAtLocation({ x: at.x, y: at.y + lift, z: at.z });
  await test.idle(4);
}

/** Uses the Katana until an activation is seen (a SimulatedPlayer swallows every second use). */
async function pressUse(test: Test, player: SimulatedPlayer, label: string): Promise<Jump | undefined> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const before = jumpsOf(player).length;
    player.useItemInSlot(SLOT);
    for (let t = 0; t < 4; t++) {
      await test.idle(1);
      const made = jumpsOf(player).slice(before);
      if (made.length > 0) {
        test.assert(made.length === 1, `${label}: ${made.length} activations, expected one`);
        return made[0];
      }
    }
    await test.idle(1);
  }
  return undefined;
}

// ---------------------------------------------------------------- arena

type States = Record<string, string | number | boolean>;

class Arena {
  private readonly saved = new Map<string, { at: Vector3; permutation: BlockPermutation }>();

  constructor(private readonly test: Test) {}

  set(rel: Vector3, id: string, states?: States): void {
    const at = this.test.worldBlockLocation(rel);
    const block = this.test.getDimension().getBlock(at);
    if (block === undefined) throw new Error(`arena cell ${cellKey(rel)} is not loaded`);
    if (!this.saved.has(cellKey(at))) this.saved.set(cellKey(at), { at, permutation: block.permutation });
    if (!block.permutation.matches(id, states)) block.setPermutation(BlockPermutation.resolve(id, states));
  }

  fill(from: Vector3, to: Vector3, id: string): void {
    for (let x = from.x; x <= to.x; x++) for (let y = from.y; y <= to.y; y++) for (let z = from.z; z <= to.z; z++) this.set({ x, y, z }, id);
  }

  restore(): string[] {
    const failures: string[] = [];
    for (const { at, permutation } of this.saved.values()) {
      try {
        this.test.getDimension().getBlock(at)?.setPermutation(permutation);
      } catch (err) {
        failures.push(`${cellKey(at)}: ${String(err)}`);
      }
    }
    return failures;
  }
}

function runway(arena: Arena, toX: number, z0 = 0, z1 = 6, height = 6): void {
  arena.fill({ x: 0, y: FLOOR_Y, z: z0 }, { x: toX, y: FLOOR_Y, z: z1 }, "minecraft:stone");
  arena.fill({ x: 0, y: FLOOR_Y + 1, z: z0 }, { x: toX, y: FLOOR_Y + height, z: z1 }, "minecraft:air");
}

function snapshot(test: Test, from: Vector3, to: Vector3): Map<string, string> {
  const out = new Map<string, string>();
  const dim = test.getDimension();
  for (let x = from.x; x <= to.x; x++)
    for (let y = from.y; y <= to.y; y++)
      for (let z = from.z; z <= to.z; z++) {
        const block = dim.getBlock(test.worldBlockLocation({ x, y, z }));
        out.set(cellKey({ x, y, z }), block === undefined ? "unloaded" : `${block.typeId}${JSON.stringify(block.permutation.getAllStates())}`);
      }
  return out;
}

function diff(before: Map<string, string>, after: Map<string, string>): string[] {
  const out: string[] = [];
  for (const [k, v] of before) if (after.get(k) !== v) out.push(`${k}: ${v} -> ${after.get(k) ?? "missing"}`);
  return out;
}

function scenario(name: string, maxTicks: number, body: (test: Test, arena: Arena, players: SimulatedPlayer[], leftovers: Entity[]) => Promise<void>): void {
  registerAsync("andrew", name, async (test: Test): Promise<void> => {
    const arena = new Arena(test);
    const players: SimulatedPlayer[] = [];
    const leftovers: Entity[] = [];
    try {
      await body(test, arena, players, leftovers);
    } finally {
      for (const p of players) if (p.isValid) test.removeSimulatedPlayer(p);
      for (const e of leftovers) if (e.isValid) e.remove();
      const failures = arena.restore();
      if (failures.length > 0) log(`${name} RESTORE failed for ${failures.length} cells: ${failures.slice(0, 3).join("; ")}`);
    }
    test.succeed();
  })
    .structureName(STRUCTURE)
    .maxTicks(maxTicks)
    .tag("andrew");
}

// ---------------------------------------------------------------- AC06 #1: the call counter on a jump

scenario("katana_trail_call_count", 300, async (test, arena, players) => {
  runway(arena, 26);
  const player = await jumper(test, "count");
  players.push(player);
  await aim(test, player, { x: FLOOR_TARGET.x + 0.5, y: FLOOR_Y + 1, z: FLOOR_TARGET.z + 0.5 });

  resetTrailCallCount();
  const inputTick = system.currentTick;
  const jump = await pressUse(test, player, "AC06#1");
  test.assert(jump !== undefined, "AC06#1: no Katana activation reached");
  test.assert((jump as Jump).activation.jumped, "AC06#1: the activation refused, expected a jump");

  const count = trailCallCount();
  const ticks = trailCallTicks();
  const spread = ticks.length === 0 ? 0 : Math.max(...ticks) - Math.min(...ticks, (jump as Jump).tick);
  log(`AC06#1 RESULT calls=${count} activationTick=${(jump as Jump).tick} ticks=[${[...new Set(ticks)].join(",")}] spread=${spread}`);
  test.assert(count >= 1 && count <= 130, `AC06#1: ${count} spawnParticle calls, expected 1..130`);
  for (const t of ticks) {
    test.assert(Math.abs(t - (jump as Jump).tick) <= 10, `AC06#1: a call at tick ${t}, activation at ${(jump as Jump).tick}, more than 10 ticks apart`);
  }
});

// ---------------------------------------------------------------- AC06 #2: silence on a refusal and on cooldown

scenario("katana_trail_silent_on_refusal_and_cooldown", 300, async (test, arena, players) => {
  // Boxed in on every side: the activation refuses, feet undefined.
  const boxed = await jumper(test, "boxed");
  players.push(boxed);
  for (const y of [FLOOR_Y + 1, FLOOR_Y + 2]) {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) arena.set({ x: START.x + dx, y, z: START.z + dz }, "minecraft:stone");
  }
  arena.set({ x: START.x, y: FLOOR_Y + 3, z: START.z }, "minecraft:stone");
  const head = test.relativeLocation(boxed.getHeadLocation());
  await aim(test, boxed, { x: head.x + 15, y: head.y, z: head.z });

  resetTrailCallCount();
  boxed.useItemInSlot(SLOT);
  await test.idle(6);
  const refusals = jumpsOf(boxed);
  log(`REFUSAL RESULT activations=${refusals.length} jumped=${refusals[0]?.activation.jumped} calls=${trailCallCount()}`);
  test.assert(refusals.length === 1 && !refusals[0].activation.jumped, "REFUSAL: the boxed-in press did not reach a refusal");
  test.assert(trailCallCount() === 0, `REFUSAL: ${trailCallCount()} trail calls on a refused activation`);

  // A ready jump, then a second press inside the 30 s cooldown: no second activation at all.
  runway(arena, 26);
  const player = await jumper(test, "cooldown");
  players.push(player);
  await aim(test, player, { x: FLOOR_TARGET.x + 0.5, y: FLOOR_Y + 1, z: FLOOR_TARGET.z + 0.5 });
  const first = await pressUse(test, player, "cooldown setup");
  test.assert(first !== undefined && first.activation.jumped, "cooldown setup: the first jump did not succeed");

  resetTrailCallCount();
  const before = jumpsOf(player).length;
  const at = { ...player.location };
  player.useItemInSlot(SLOT);
  await test.idle(6);
  const madeDuringCooldown = jumpsOf(player).slice(before);
  const moved = len(sub(player.location, at));
  log(`COOLDOWN RESULT activations=${madeDuringCooldown.length} moved=${f2(moved)} calls=${trailCallCount()}`);
  test.assert(madeDuringCooldown.length === 0, `COOLDOWN: a press on cooldown reached the plan (${madeDuringCooldown.length} activations)`);
  test.assert(moved < 1e-6, `COOLDOWN: the press on cooldown moved the player by ${moved}`);
  test.assert(trailCallCount() === 0, `COOLDOWN: ${trailCallCount()} trail calls on a press that never left cooldown`);
});

// ---------------------------------------------------------------- AC06 #3: harmless to a husk and a second player on the line

interface Hurt {
  cause: string;
  damage: number;
}

scenario("katana_trail_harmless", 400, async (test, arena, players, leftovers) => {
  const difficulty = world.getDifficulty();
  try {
    // Peaceful (the checks world's default) deletes hostile mobs; Easy keeps the husk (katana-fall.ts).
    world.setDifficulty(Difficulty.Easy);
    runway(arena, 26);
    const player = await jumper(test, "harmless");
    players.push(player);
    await aim(test, player, { x: FLOOR_TARGET.x + 0.5, y: FLOOR_Y + 1, z: FLOOR_TARGET.z + 0.5 });

    // A husk and a second player, both stationary, standing on the trail line.
    const husk = test.spawnWithoutBehaviors("minecraft:husk", { x: START.x + 8, y: FLOOR_Y + 1, z: START.z });
    leftovers.push(husk);
    const bystander = test.spawnSimulatedPlayer({ x: START.x + 12, y: FLOOR_Y + 1, z: START.z }, `${PREFIX}bystander`, GameMode.Survival);
    players.push(bystander);
    await test.idle(10);

    const hurts = new Map<string, Hurt[]>([
      [husk.id, []],
      [bystander.id, []],
    ]);
    const hurtSub = world.afterEvents.entityHurt.subscribe((e: EntityHurtAfterEvent) => {
      const list = hurts.get(e.hurtEntity.id);
      if (list !== undefined) list.push({ cause: e.damageSource.cause, damage: e.damage });
    });

    const centre = test.worldLocation({ x: 13, y: FLOOR_Y + 3, z: 3 });
    const entityIdsOf = (): Set<string> => new Set(test.getDimension().getEntities({ location: centre, maxDistance: 24 }).map((e) => e.id));
    const AREA_FROM: Vector3 = { x: -1, y: 0, z: -1 };
    const AREA_TO: Vector3 = { x: 27, y: FLOOR_Y + 6, z: 7 };
    const before = {
      entities: entityIdsOf(),
      blocks: snapshot(test, AREA_FROM, AREA_TO),
      huskV: husk.getVelocity(),
      bystanderV: bystander.getVelocity(),
    };

    try {
      const jump = await pressUse(test, player, "AC06#3");
      test.assert(jump !== undefined && jump.activation.jumped, "AC06#3: the jump setup did not succeed");
      await test.idle(15);

      const huskHurt = hurts.get(husk.id) as Hurt[];
      const bystanderHurt = hurts.get(bystander.id) as Hurt[];
      const huskDv = len(sub(husk.getVelocity(), before.huskV));
      const bystanderDv = len(sub(bystander.getVelocity(), before.bystanderV));
      const afterEntities = entityIdsOf();
      const newEntities = [...afterEntities].filter((id) => !before.entities.has(id));
      const blockChanges = diff(before.blocks, snapshot(test, AREA_FROM, AREA_TO));

      log(
        `AC06#3 RESULT huskHurt=${JSON.stringify(huskHurt)} bystanderHurt=${JSON.stringify(bystanderHurt)} ` +
          `huskDv=${f2(huskDv)} bystanderDv=${f2(bystanderDv)} newEntities=${newEntities.length} blockChanges=${blockChanges.length}`
      );
      test.assert(huskHurt.length === 0, `AC06#3: the husk took entityHurt ${JSON.stringify(huskHurt)}`);
      test.assert(bystanderHurt.length === 0, `AC06#3: the bystander took entityHurt ${JSON.stringify(bystanderHurt)}`);
      test.assert(huskDv <= 0.01, `AC06#3: the husk's velocity changed by ${huskDv}, more than gravity`);
      test.assert(bystanderDv <= 0.01, `AC06#3: the bystander's velocity changed by ${bystanderDv}, more than gravity`);
      test.assert(newEntities.length === 0, `AC06#3: ${newEntities.length} new entities appeared near the trail`);
      test.assert(blockChanges.length === 0, `AC06#3: blocks changed: ${blockChanges.slice(0, 4).join("; ")}`);
    } finally {
      world.afterEvents.entityHurt.unsubscribe(hurtSub);
    }
  } finally {
    world.setDifficulty(difficulty);
  }
});

// ---------------------------------------------------------------- AC06 #4: a silent skip into an unloaded chunk

registerAsync("andrew", "katana_trail_skips_unloaded", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 3, y: 2, z: 3 });
  let edge: number | undefined;
  for (let c = 1; c <= 64 && edge === undefined; c++) {
    const x = origin.x + c * 16;
    if (!dim.isChunkLoaded({ x, y: origin.y, z: origin.z })) edge = Math.floor(x / 16) * 16;
  }
  test.assert(edge !== undefined, "no unloaded chunk within 64 chunks along +x");
  const xs = edge as number;
  const z = origin.z + 0.5;
  const a: Vector3 = { x: xs - 8, y: origin.y + 0.5, z };
  const b: Vector3 = { x: xs + 8, y: origin.y + 0.5, z };
  const points = trailPoints(a, b);
  const loaded = points.filter((p) => dim.isChunkLoaded(p));
  const unloaded = points.filter((p) => !dim.isChunkLoaded(p));
  test.assert(unloaded.length > 0, `the probe geometry does not reach an unloaded point (edge x=${xs}, ${points.length} points)`);
  test.assert(loaded.length > 0, `the probe geometry has no loaded point left to compare against (edge x=${xs})`);

  resetTrailCallCount();
  let threw: string | undefined;
  try {
    spawnTrail(dim, a, b);
  } catch (err) {
    threw = String(err);
  }
  const count = trailCallCount();
  const expected = loaded.length * PARTICLES_PER_POINT;
  log(
    `AC06#4 RESULT edge x=${xs} points=${points.length} (${loaded.length} loaded, ${unloaded.length} unloaded) ` +
      `calls=${count} expected=${expected} threw=${threw ?? "no"}`
  );
  test.assert(threw === undefined, `AC06#4: spawnTrail threw on an unloaded point: ${threw}`);
  test.assert(count === expected, `AC06#4: ${count} calls, expected exactly ${expected} (one per loaded point × ${PARTICLES_PER_POINT})`);
  test.assert(points.length <= MAX_TRAIL_POINTS, `AC06#4: ${points.length} points, more than the ${MAX_TRAIL_POINTS} cap`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(100)
  .tag("andrew");
