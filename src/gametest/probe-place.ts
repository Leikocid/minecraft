// stage4-probe, strf-p006 questions 1, 2, 7 and 10 against BDS 1.26.51.1:
// block entities after structureManager.place, rotation, timing, fillBlocks.
//
// These are measurements, not assertions about the product. A test passes when
// its measurement completed; the engine's answer is the "[probe] Qn RESULT
// PASS|FAIL" line it prints, and the numbers next to it. A test fails only when
// it could not measure (chunks never loaded, the template is missing).
//
// Everything is built above the GameTest platform (y >= +12) or beside it, and
// every test clears what it placed, so the tests that run after these stand on
// the same ground as before.

import {
  BlockComponentTypes,
  BlockVolume,
  Difficulty,
  Dimension,
  GameMode,
  Structure,
  StructureRotation,
  Vector3,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, Test, registerAsync } from "@minecraft/server-gametest";
import { PROBE_BIG_ID, PROBE_BIG_SIZE, buildProbeBig } from "../structures/templates/probe-big";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 3, y: 2, z: 5 };

const PROBE_BOX_ID = "andrew:probe_box";
const BOX_SIZE: Vector3 = { x: 9, y: 5, z: 7 };

/** Template-local marker cells. Must match src/structures/templates/probe_box.json. */
const BOX = {
  chests: [
    { x: 2, y: 1, z: 1 },
    { x: 6, y: 1, z: 1 },
  ],
  spawner: { x: 4, y: 1, z: 3 },
  shrieker: { x: 4, y: 1, z: 5 },
  stairs: { x: 2, y: 1, z: 5 },
  doorLower: { x: 4, y: 1, z: 0 },
  doorUpper: { x: 4, y: 2, z: 0 },
  doorFacing: "south",
  stairsWeirdo: 3,
} as const;

/** fillBlocks slice ceiling used for setup, below any limit Q10 might find. */
const SAFE_FILL = 32000;

const SPAWNER_WAIT_TICKS = 1200;

const log = (msg: string): void => console.warn(`[probe] ${msg}`);
const add = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const fmt = (v: Vector3): string => `${v.x},${v.y},${v.z}`;
const same = (a: Vector3, b: Vector3): boolean => a.x === b.x && a.y === b.y && a.z === b.z;
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err));

const ROTATIONS = [
  StructureRotation.None,
  StructureRotation.Rotate90,
  StructureRotation.Rotate180,
  StructureRotation.Rotate270,
];

/**
 * The transform under test (L0-strf-r004): a template-local point to its offset
 * inside the rotated AABB, clockwise seen from above (+x east, +z south), with
 * the AABB's min corner as the origin (L0-strf-as06).
 */
export function rotateLocal(p: Vector3, size: Vector3, rot: number): Vector3 {
  switch (rot & 3) {
    case 1:
      return { x: size.z - 1 - p.z, y: p.y, z: p.x };
    case 2:
      return { x: size.x - 1 - p.x, y: p.y, z: size.z - 1 - p.z };
    case 3:
      return { x: p.z, y: p.y, z: size.x - 1 - p.x };
    default:
      return { x: p.x, y: p.y, z: p.z };
  }
}

const rotatedSize = (size: Vector3, rot: number): Vector3 =>
  rot % 2 === 0 ? { ...size } : { x: size.z, y: size.y, z: size.x };

const CARDINALS = ["north", "east", "south", "west"];
const rotateCardinal = (dir: string, rot: number): string => CARDINALS[(CARDINALS.indexOf(dir) + rot) % 4];

// Bedrock stairs: weirdo_direction 0=east 1=west 2=south 3=north.
const WEIRDO_TO_CARDINAL = ["east", "west", "south", "north"];
const rotateWeirdo = (weirdo: number, rot: number): number =>
  WEIRDO_TO_CARDINAL.indexOf(rotateCardinal(WEIRDO_TO_CARDINAL[weirdo], rot));

/** Block-aligned x/z whose value mod 16 is 8, so a volume starting there crosses chunk borders. */
const midChunk = (v: number): number => Math.floor(v / 16) * 16 - 8;

function volumeOf(from: Vector3, size: Vector3): BlockVolume {
  return new BlockVolume(from, { x: from.x + size.x - 1, y: from.y + size.y - 1, z: from.z + size.z - 1 });
}

/** Fill in y-slabs no larger than SAFE_FILL cells. */
function fillSliced(dim: Dimension, from: Vector3, size: Vector3, block: string): void {
  const layers = Math.max(1, Math.floor(SAFE_FILL / (size.x * size.z)));
  for (let y = 0; y < size.y; y += layers) {
    const h = Math.min(layers, size.y - y);
    dim.fillBlocks(volumeOf({ x: from.x, y: from.y + y, z: from.z }, { x: size.x, y: h, z: size.z }), block);
  }
}

/** Cells of `typeId` in the volume; cells in unloaded chunks are counted separately. */
function countType(dim: Dimension, from: Vector3, size: Vector3, typeId: string): { found: number; unloaded: number } {
  let found = 0;
  let unloaded = 0;
  for (let x = 0; x < size.x; x++)
    for (let y = 0; y < size.y; y++)
      for (let z = 0; z < size.z; z++) {
        const block = dim.getBlock({ x: from.x + x, y: from.y + y, z: from.z + z });
        if (block === undefined) unloaded++;
        else if (block.typeId === typeId) found++;
      }
  return { found, unloaded };
}

function chunksSpanned(from: Vector3, size: Vector3): number {
  const cx = Math.floor((from.x + size.x - 1) / 16) - Math.floor(from.x / 16) + 1;
  const cz = Math.floor((from.z + size.z - 1) / 16) - Math.floor(from.z / 16) + 1;
  return cx * cz;
}

/** Wait until every corner column of the volume is in a loaded chunk. */
async function waitLoaded(test: Test, dim: Dimension, from: Vector3, size: Vector3, label: string): Promise<void> {
  const corners = [
    from,
    { x: from.x + size.x - 1, y: from.y, z: from.z },
    { x: from.x, y: from.y, z: from.z + size.z - 1 },
    { x: from.x + size.x - 1, y: from.y, z: from.z + size.z - 1 },
  ];
  for (let waited = 0; waited <= 300; waited += 5) {
    if (corners.every((c) => dim.isChunkLoaded(c))) {
      log(`${label}: all ${chunksSpanned(from, size)} chunk(s) loaded after ${waited} tick(s)`);
      return;
    }
    await test.idle(5);
  }
  throw new Error(`${label}: chunks under ${fmt(from)} size ${fmt(size)} did not load in 300 ticks`);
}

/** A player keeps the chunks around the platform loaded; nobody else is online in the test world. */
function spawnAnchor(test: Test, name: string): SimulatedPlayer {
  return test.spawnSimulatedPlayer(STAND, name, GameMode.Survival);
}

// ------------------------------------------------ Q1: block entities survive place

registerAsync("andrew", "probe_place_block_entities", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const base = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  // Both boxes sit ~10 blocks from the player, inside the spawner's 16-block
  // RequiredPlayerRange; the control box differs only by a missing spawner, so
  // a zombie in it would be a natural spawn, not the spawner's.
  const boxAt = add(base, { x: 9, y: 1, z: 0 });
  const controlAt = add(base, { x: -11, y: 1, z: 0 });
  const difficultyBefore = world.getDifficulty();
  spawnAnchor(test, "andrew_probe_q1");

  try {
    await waitLoaded(test, dim, controlAt, { x: 29, y: 5, z: 7 }, "Q1");
    log(`Q1 pack structures: ${world.structureManager.getPackStructureIds().join(" ")}`);
    world.structureManager.place(PROBE_BOX_ID, dim, boxAt, { includeEntities: false });
    world.structureManager.place(PROBE_BOX_ID, dim, controlAt, { includeEntities: false });
    dim.setBlockType(add(controlAt, BOX.spawner), "minecraft:stone_bricks");
    await test.idle(2);

    const lost: string[] = [];
    for (const p of BOX.chests) {
      const block = dim.getBlock(add(boxAt, p));
      const container = block?.getComponent(BlockComponentTypes.Inventory)?.container;
      log(
        `Q1 chest @${fmt(p)} typeId=${block?.typeId ?? "unloaded"} inventory=${
          container === undefined ? "undefined" : `size ${container.size}, ${container.emptySlotsCount} empty`
        }`
      );
      if (block?.typeId !== "minecraft:chest") lost.push(`chest @${fmt(p)} is ${block?.typeId}`);
      else if (container === undefined) lost.push(`chest @${fmt(p)} has no Inventory component`);
    }
    const spawner = dim.getBlock(add(boxAt, BOX.spawner));
    log(`Q1 spawner @${fmt(BOX.spawner)} typeId=${spawner?.typeId ?? "unloaded"}`);
    if (spawner?.typeId !== "minecraft:mob_spawner") lost.push(`spawner is ${spawner?.typeId}`);

    // Peaceful (the server default) forbids hostile spawns, spawners included.
    world.setDifficulty(Difficulty.Easy);
    log(`Q1 difficulty ${difficultyBefore} -> ${world.getDifficulty()}, doMobSpawning=${world.gameRules.doMobSpawning}`);

    const interior = (at: Vector3): Vector3 => add(at, { x: 4.5, y: 2, z: 3.5 });
    const mobsIn = (at: Vector3): string[] =>
      dim
        .getEntities({ location: interior(at), maxDistance: 5 })
        .filter((e) => e.typeId !== "minecraft:player")
        .map((e) => e.typeId);

    let zombieAt = -1;
    for (let t = 0; t <= SPAWNER_WAIT_TICKS; t += 20) {
      if (mobsIn(boxAt).includes("minecraft:zombie")) {
        zombieAt = t;
        break;
      }
      await test.idle(20);
    }
    const boxMobs = mobsIn(boxAt);
    const controlMobs = mobsIn(controlAt);
    log(
      `Q1 spawner box: first zombie after ${zombieAt < 0 ? `none in ${SPAWNER_WAIT_TICKS}` : zombieAt} tick(s); ` +
        `mobs=[${boxMobs.join(" ")}] control box mobs=[${controlMobs.join(" ")}]`
    );
    if (zombieAt < 0) lost.push(`no zombie from the spawner within ${SPAWNER_WAIT_TICKS / 20} s`);
    else if (controlMobs.includes("minecraft:zombie")) lost.push("zombie also in the spawner-less control box — not attributable");

    log(
      lost.length === 0
        ? `Q1 RESULT PASS — both chests are chests with an Inventory, the spawner is a mob_spawner and spawned minecraft:zombie in ${zombieAt / 20} s`
        : `Q1 RESULT FAIL — ${lost.join("; ")}`
    );
    test.succeed();
  } finally {
    world.setDifficulty(difficultyBefore);
    fillSliced(dim, boxAt, BOX_SIZE, "minecraft:air");
    fillSliced(dim, controlAt, BOX_SIZE, "minecraft:air");
  }
})
  .structureName(STRUCTURE)
  .maxTicks(SPAWNER_WAIT_TICKS + 600)
  .tag("andrew");

// ------------------------------------------------ Q2: rotation

registerAsync("andrew", "probe_place_rotation", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const base = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const loc = add(base, { x: 0, y: 14, z: 0 });
  // Wide enough to catch a box rotated about its origin block instead of
  // inside its AABB, which would put it up to 8 cells on the negative side.
  const scanFrom = add(loc, { x: -10, y: -2, z: -10 });
  const scanSize: Vector3 = { x: 30, y: 9, z: 30 };
  spawnAnchor(test, "andrew_probe_q2");
  await waitLoaded(test, dim, scanFrom, scanSize, "Q2");

  const scan = (): Map<string, { at: Vector3; typeId: string; states: Record<string, boolean | number | string> }> => {
    const found = new Map<string, { at: Vector3; typeId: string; states: Record<string, boolean | number | string> }>();
    for (let x = 0; x < scanSize.x; x++)
      for (let y = 0; y < scanSize.y; y++)
        for (let z = 0; z < scanSize.z; z++) {
          const at = add(scanFrom, { x, y, z });
          const block = dim.getBlock(at);
          if (block === undefined) throw new Error(`Q2: ${fmt(at)} unloaded during the scan`);
          if (!block.isAir) found.set(fmt(at), { at, typeId: block.typeId, states: block.permutation.getAllStates() });
        }
    return found;
  };

  const before = scan();
  if (before.size > 0) throw new Error(`Q2: scan area is not empty before placing (${before.size} blocks)`);

  const verdicts: string[] = [];
  let minCornerHolds = true;
  try {
    for (let rot = 0; rot < 4; rot++) {
      const deg = rot * 90;
      world.structureManager.place(PROBE_BOX_ID, dim, loc, { rotation: ROTATIONS[rot], includeEntities: false });
      const cells = [...scan().values()];
      fillSliced(dim, scanFrom, scanSize, "minecraft:air");

      const min = { x: Infinity, y: Infinity, z: Infinity };
      const max = { x: -Infinity, y: -Infinity, z: -Infinity };
      for (const c of cells) {
        min.x = Math.min(min.x, c.at.x);
        min.y = Math.min(min.y, c.at.y);
        min.z = Math.min(min.z, c.at.z);
        max.x = Math.max(max.x, c.at.x);
        max.y = Math.max(max.y, c.at.y);
        max.z = Math.max(max.z, c.at.z);
      }
      const rs = rotatedSize(BOX_SIZE, rot);
      const measuredSize = { x: max.x - min.x + 1, y: max.y - min.y + 1, z: max.z - min.z + 1 };
      const offset = { x: min.x - loc.x, y: min.y - loc.y, z: min.z - loc.z };
      const originOk = same(offset, { x: 0, y: 0, z: 0 });
      if (!originOk) minCornerHolds = false;
      log(
        `Q2 rot=${deg} blocks=${cells.length} aabb min-loc=${fmt(offset)} size=${fmt(measuredSize)} ` +
          `expected size=${fmt(rs)} origin-is-min-corner=${originOk}`
      );

      // Positions are judged against the measured min corner, so a wrong origin
      // convention shows up once (above) instead of as eight position misses.
      const problems: string[] = [];
      if (!same(measuredSize, rs)) problems.push(`AABB ${fmt(measuredSize)} != ${fmt(rs)}`);
      const at = (p: Vector3) => cells.find((c) => same(c.at, add(min, rotateLocal(p, BOX_SIZE, rot))));
      const expect = (label: string, p: Vector3, typeId: string, states: Record<string, boolean | number | string>) => {
        const cell = at(p);
        const where = fmt(rotateLocal(p, BOX_SIZE, rot));
        if (cell?.typeId !== typeId) {
          const actual = cells.filter((c) => c.typeId === typeId).map((c) => fmt({ x: c.at.x - min.x, y: c.at.y - min.y, z: c.at.z - min.z }));
          problems.push(`${label}: expected ${typeId} at ${where}, found ${cell?.typeId ?? "air"}; ${typeId} is at [${actual.join(" ")}]`);
          return;
        }
        const shown = Object.entries(cell.states).map(([k, v]) => `${k}=${String(v)}`).join(" ");
        log(`Q2 rot=${deg} ${label} at ${where}: ${shown}`);
        for (const [k, v] of Object.entries(states)) {
          if (cell.states[k] !== v) problems.push(`${label} ${k}=${String(cell.states[k])}, expected ${String(v)}`);
        }
      };
      BOX.chests.forEach((p, i) => expect(`chest${i + 1}`, p, "minecraft:chest", {}));
      expect("spawner", BOX.spawner, "minecraft:mob_spawner", {});
      expect("shrieker", BOX.shrieker, "minecraft:sculk_shrieker", {});
      const facing = rotateCardinal(BOX.doorFacing, rot);
      expect("door-lower", BOX.doorLower, "minecraft:wooden_door", {
        upper_block_bit: false,
        "minecraft:cardinal_direction": facing,
      });
      expect("door-upper", BOX.doorUpper, "minecraft:wooden_door", {
        upper_block_bit: true,
        "minecraft:cardinal_direction": facing,
      });
      expect("stairs", BOX.stairs, "minecraft:stone_brick_stairs", {
        weirdo_direction: rotateWeirdo(BOX.stairsWeirdo, rot),
        upside_down_bit: false,
      });

      verdicts.push(problems.length === 0 ? `${deg}:ok` : `${deg}:${problems.length} mismatch(es)`);
      for (const p of problems) log(`Q2 rot=${deg} MISMATCH ${p}`);
      await test.idle(1);
    }
  } finally {
    fillSliced(dim, scanFrom, scanSize, "minecraft:air");
  }

  const allOk = verdicts.every((v) => v.endsWith(":ok"));
  log(`Q2 RESULT ${allOk ? "PASS" : "FAIL"} — rotateLocal vs placement: ${verdicts.join(" ")}`);
  log(`Q2 origin RESULT ${minCornerHolds ? "PASS" : "FAIL"} — location is the min corner of the rotated AABB at 0/90/180/270: ${minCornerHolds}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ Q7: timing

registerAsync("andrew", "probe_place_timing", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const base = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const from: Vector3 = { x: midChunk(base.x), y: base.y + 12, z: midChunk(base.z) };
  spawnAnchor(test, "andrew_probe_q7");
  await waitLoaded(test, dim, from, PROBE_BIG_SIZE, "Q7");

  try {
    const voidProbe = world.structureManager.createEmpty("andrew:probe_void", { x: 1, y: 1, z: 1 });
    log(`Q7 createEmpty cell reads as ${voidProbe.getBlockPermutation({ x: 0, y: 0, z: 0 })?.type.id ?? "undefined"}`);
    world.structureManager.delete(voidProbe);

    let t = Date.now();
    const big: Structure = buildProbeBig();
    log(`Q7 built ${PROBE_BIG_ID} ${fmt(big.size)} in memory: ${Date.now() - t} ms`);
    await test.idle(1);

    t = Date.now();
    fillSliced(dim, from, PROBE_BIG_SIZE, "minecraft:stone");
    log(`Q7 setup: stone fill ${fmt(PROBE_BIG_SIZE)} in slices: ${Date.now() - t} ms`);
    await test.idle(2);

    t = Date.now();
    world.structureManager.place(big, dim, from, { includeEntities: false });
    const placeOverStone = Date.now() - t;
    await test.idle(1);
    const left = countType(dim, from, PROBE_BIG_SIZE, "minecraft:stone");
    log(
      `Q7 place ${fmt(PROBE_BIG_SIZE)} (${PROBE_BIG_SIZE.x * PROBE_BIG_SIZE.y * PROBE_BIG_SIZE.z} cells) over stone: ` +
        `${placeOverStone} ms; stone left after one tick=${left.found} unloaded=${left.unloaded}`
    );
    if (left.found !== 0) throw new Error(`Q7: place left ${left.found} stone — the template did not write every cell`);
    await test.idle(2);

    t = Date.now();
    world.structureManager.place(big, dim, from, { includeEntities: false });
    const placeOverAir = Date.now() - t;
    log(`Q7 place same template over air (no block changes): ${placeOverAir} ms`);
    await test.idle(2);

    const points: Vector3[] = [];
    for (let i = 0; i < 64; i++) points.push(add(from, { x: (i % 8) * 4, y: (i >> 3) * 3, z: ((i * 5) % 8) * 4 }));
    t = Date.now();
    for (const p of points) dim.getBlock(p);
    const firstRound = Date.now() - t;
    const ROUNDS = 100;
    t = Date.now();
    for (let r = 0; r < ROUNDS; r++) for (const p of points) dim.getBlock(p);
    const perRound = (Date.now() - t) / ROUNDS;
    log(`Q7 64 getBlock: first round ${firstRound} ms, mean of ${ROUNDS} rounds ${perRound.toFixed(3)} ms`);

    log(
      `Q7 RESULT place ${fmt(PROBE_BIG_SIZE)} = ${placeOverStone} ms (every cell changes), ${placeOverAir} ms (no change); ` +
        `64 getBlock = ${perRound.toFixed(3)} ms mean, ${firstRound} ms first round`
    );
    test.succeed();
  } finally {
    fillSliced(dim, from, PROBE_BIG_SIZE, "minecraft:air");
    world.structureManager.delete(PROBE_BIG_ID);
  }
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");

// ------------------------------------------------ Q10: fillBlocks with air

registerAsync("andrew", "probe_fill_air_limits", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const base = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const from: Vector3 = { x: midChunk(base.x), y: base.y + 12, z: midChunk(base.z) };
  const region: Vector3 = { x: 40, y: 30, z: 40 };
  spawnAnchor(test, "andrew_probe_q10");
  await waitLoaded(test, dim, from, region, "Q10");

  /** Stone the volume, then one fillBlocks call with air, then count what stayed stone. */
  const attempt = async (size: Vector3): Promise<{ ok: boolean; note: string }> => {
    const cells = size.x * size.y * size.z;
    fillSliced(dim, from, size, "minecraft:stone");
    await test.idle(1);
    const t = Date.now();
    let returned = -1;
    let error = "";
    try {
      returned = dim.fillBlocks(volumeOf(from, size), "minecraft:air").getCapacity();
    } catch (err) {
      error = errText(err);
    }
    const ms = Date.now() - t;
    await test.idle(1);
    const left = countType(dim, from, size, "minecraft:stone");
    const ok = error === "" && left.found === 0 && left.unloaded === 0;
    const note =
      `${fmt(size)}=${cells} cells over ${chunksSpanned(from, size)} chunks: ` +
      (error === "" ? `returned ${returned} placed, ${ms} ms` : `threw ${error} after ${ms} ms`) +
      `; stone left ${left.found}, unloaded ${left.unloaded}`;
    log(`Q10 ${ok ? "ok  " : "FAIL"} ${note}`);
    fillSliced(dim, from, size, "minecraft:air");
    await test.idle(1);
    return { ok, note };
  };

  try {
    const probe = await attempt(region);
    const results = [probe];
    if (!probe.ok) {
      // Bracket the limit: the command-style 32768, one layer either side of it, and one layer past it.
      for (const size of [
        { x: 32, y: 32, z: 32 },
        { x: 33, y: 32, z: 32 },
        { x: 40, y: 20, z: 40 },
        { x: 40, y: 21, z: 40 },
      ]) {
        results.push(await attempt(size));
      }
    }
    const crossed = results.find((r) => r.ok);
    log(
      `Q10 RESULT 40x30x40 in one call: ${probe.ok ? "PASS" : "FAIL"}; across chunk borders in one call: ` +
        `${crossed ? "PASS" : "FAIL"}${crossed ? ` (${crossed.note})` : ""}`
    );
    test.succeed();
  } finally {
    fillSliced(dim, from, region, "minecraft:air");
  }
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

export const PROBE_PLACE_TESTS = [
  "probe_place_block_entities",
  "probe_place_rotation",
  "probe_place_timing",
  "probe_fill_air_limits",
];

log(`registered ${PROBE_PLACE_TESTS.length} probe test(s): ${PROBE_PLACE_TESTS.join(" ")}`);
