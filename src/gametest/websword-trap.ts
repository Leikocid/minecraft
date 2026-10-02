// The Web Sword's "not through walls" rule on a real engine
// [src: webswordspecv1ruen §12 — 'не атаковать сквозь стены'].
//
// Probes:
//   - websword_face_location — what BlockRaycastHit.faceLocation holds on each
//     face, against the entry point computed from the player's own head and
//     view direction, for full faces and for faces inside the cell;
//   - websword_entity_ray_distance — what EntityRaycastHit.distance measures;
//   - websword_ray_stoppers — which blocks stop the trap's block ray, and which
//     of those also stop its entity ray.
// Scenarios, where the cube grows, looking north, east, south and west:
//   - websword_wall_<front|behind|edge>_<dir> — a mob in front of a stone
//     wall, behind it, or just past its edge.
//
// Coordinates are structure-relative throughout, including lookAtLocation's
// argument (see the trap section of main.ts for why). getHeadLocation,
// getViewDirection, entity.location and block.location are world coordinates.

import {
  BlockPermutation,
  Direction,
  GameMode,
  ItemStack,
  type Entity,
  type Player,
  type Vector3,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { WEB_SWORD } from "../legendary/registry";
import * as state from "../legendary/state";
import { WEB_BLOCK_ID } from "../websword/cube";

const STRUCTURE = "andrew:platform";

/** The platform's middle column: room for a target two blocks out on every side. */
const MIDDLE: Vector3 = { x: 3, y: 2, z: 3 };

/** The trap's own reaches and ray options (src/websword/trap.ts). */
const BLOCK_REACH = 5;
const ENTITY_REACH = 3;

/** A passive mob, so a peaceful world keeps it; spawned without AI, so it stays put. */
const MOB = "minecraft:villager_v2";

const log = (msg: string): void => console.warn(`[probe] WSFACE ${msg}`);

const f3 = (v: Vector3): string => `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
const cellKey = (v: Vector3): string => `${v.x},${v.y},${v.z}`;

const AXES = ["x", "y", "z"] as const;
type Axis = (typeof AXES)[number];

const NORMAL_AXIS: Record<string, Axis> = { North: "z", South: "z", East: "x", West: "x", Up: "y", Down: "y" };

interface BoxHit {
  tIn: number;
  tOut: number;
  /** Axis of the plane the ray enters through. */
  axis: Axis;
  /** Face of the box the ray enters through, in the engine's Direction names. */
  face: Direction;
}

/**
 * Slab-method ray/box intersection. The instrument the probes trust instead of
 * faceLocation: it uses only the head location and view direction the engine
 * itself reports.
 */
function rayBox(origin: Vector3, dir: Vector3, min: Vector3, max: Vector3): BoxHit | undefined {
  let tIn = -Infinity;
  let tOut = Infinity;
  let axis: Axis = "x";
  for (const a of AXES) {
    if (Math.abs(dir[a]) < 1e-9) {
      if (origin[a] < min[a] || origin[a] > max[a]) return undefined;
      continue;
    }
    let t1 = (min[a] - origin[a]) / dir[a];
    let t2 = (max[a] - origin[a]) / dir[a];
    if (t1 > t2) [t1, t2] = [t2, t1];
    if (t1 > tIn) {
      tIn = t1;
      axis = a;
    }
    tOut = Math.min(tOut, t2);
  }
  if (tIn > tOut || tOut < 0) return undefined;
  const positive = dir[axis] > 0;
  const face =
    axis === "x"
      ? positive
        ? Direction.West
        : Direction.East
      : axis === "y"
        ? positive
          ? Direction.Down
          : Direction.Up
        : positive
          ? Direction.North
          : Direction.South;
  return { tIn, tOut, axis, face };
}

function cellBox(head: Vector3, dir: Vector3, cell: Vector3): BoxHit | undefined {
  return rayBox(head, dir, cell, { x: cell.x + 1, y: cell.y + 1, z: cell.z + 1 });
}

function along(origin: Vector3, dir: Vector3, t: number): Vector3 {
  return { x: origin.x + dir.x * t, y: origin.y + dir.y * t, z: origin.z + dir.z * t };
}

function sub(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function dist(a: Vector3, b: Vector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** The arithmetic of hitPoint() in src/websword/trap.ts: block corner + faceLocation. */
function cornerPlusFaceLocation(block: Vector3, faceLocation: Vector3): Vector3 {
  return { x: block.x + faceLocation.x, y: block.y + faceLocation.y, z: block.z + faceLocation.z };
}

function placeBlock(test: Test, blockId: string, loc: Vector3): void {
  if (test.getBlock(loc).typeId === blockId) return;
  test.setBlockType(blockId, loc);
}

function armSword(player: SimulatedPlayer): number {
  const slot = player.selectedSlotIndex;
  const sword = state.markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), state.makeMark("admin", player));
  player.getComponent("minecraft:inventory")?.container?.setItem(slot, sword);
  return slot;
}

/** The trap's block ray, with the trap's options. */
function viewRay(player: Player) {
  return player.getBlockFromViewDirection({
    maxDistance: BLOCK_REACH,
    includeLiquidBlocks: true,
    includePassableBlocks: false,
  });
}

/** The trap's entity ray, with the trap's options, narrowed to `mob`. */
function mobRay(player: Player, mob: Entity) {
  return player.getEntitiesFromViewDirection({ maxDistance: ENTITY_REACH }).find((h) => h.entity.id === mob.id);
}

/**
 * How far the bounds' south face sits from the mob's centre, read off the
 * engine's own hit distance — undefined on a miss. A just-spawned entity reads
 * narrower here for the first ticks, so this is also the settling signal.
 */
function impliedHalfWidth(player: Player, mob: Entity): number | undefined {
  const hit = mobRay(player, mob);
  if (hit === undefined) {
    return undefined;
  }
  return along(player.getHeadLocation(), player.getViewDirection(), hit.distance).z - mob.location.z;
}

// ------------------------------------------------ probe: faceLocation per face

interface FaceAim {
  label: string;
  /** Block to place, or undefined when the platform floor is the target. */
  place?: Vector3;
  /** Points on the face nearest the player: its centre and one off-centre. */
  points: Vector3[];
}

/**
 * From MIDDLE, one full face per direction; the floor supplies Up. Down is
 * left out: like North and West its plane is the block's own corner, where a
 * 0 is right whichever way faceLocation is computed.
 */
const FACE_AIMS: FaceAim[] = [
  { label: "south-face", place: { x: 3, y: 3, z: 1 }, points: [{ x: 3.5, y: 3.5, z: 2 }, { x: 3.8, y: 3.3, z: 2 }] },
  { label: "north-face", place: { x: 3, y: 3, z: 5 }, points: [{ x: 3.5, y: 3.5, z: 5 }, { x: 3.2, y: 3.3, z: 5 }] },
  { label: "east-face", place: { x: 1, y: 3, z: 3 }, points: [{ x: 2, y: 3.5, z: 3.5 }, { x: 2, y: 3.3, z: 3.8 }] },
  { label: "west-face", place: { x: 5, y: 3, z: 3 }, points: [{ x: 5, y: 3.5, z: 3.5 }, { x: 5, y: 3.3, z: 3.2 }] },
  { label: "up-face", points: [{ x: 3.5, y: 2, z: 1.5 }, { x: 3.3, y: 2, z: 1.2 }] },
];

interface InsetAim {
  label: string;
  id: string;
  states: Record<string, string | number | boolean>;
  place: Vector3;
  point: Vector3;
  face: Direction;
  /** Where the face lies along its normal, from the block's corner (the shape's 1/16 grid). */
  depth: number;
}

/** From MIDDLE, faces of shapes that stop short of the cell boundary, on both kinds of face. */
const INSET_AIMS: InsetAim[] = [
  // An unconnected pane is a post 2/16 thick in the middle of the cell.
  ...([
    ["pane-south-face", { x: 3, y: 3, z: 1 }, { x: 3.5, y: 3.5, z: 1.5625 }, Direction.South, 0.5625],
    ["pane-north-face", { x: 3, y: 3, z: 5 }, { x: 3.5, y: 3.5, z: 5.4375 }, Direction.North, 0.4375],
    ["pane-east-face", { x: 1, y: 3, z: 3 }, { x: 1.5625, y: 3.5, z: 3.5 }, Direction.East, 0.5625],
    ["pane-west-face", { x: 5, y: 3, z: 3 }, { x: 5.4375, y: 3.5, z: 3.5 }, Direction.West, 0.4375],
  ] as const).map(([label, place, point, face, depth]) => ({
    label,
    id: "minecraft:glass_pane",
    states: {},
    place,
    point,
    face,
    depth,
  })),
  // A bottom slab set into the floor: its top is half a block down. The ray
  // crosses the floor's top plane 0.25 inside the slab's own cell, clear of the
  // coin toss at a cell boundary.
  {
    label: "slab-up-face",
    id: "minecraft:oak_slab",
    states: { "minecraft:vertical_half": "bottom" },
    place: { x: 3, y: 1, z: 2 },
    point: { x: 3.5, y: 1.5, z: 2.5 },
    face: Direction.Up,
    depth: 0.5,
  },
];

registerAsync("andrew", "websword_face_location", async (test: Test): Promise<void> => {
  const player = test.spawnSimulatedPlayer(MIDDLE, "wsface_probe", GameMode.Survival);
  await test.idle(4);

  let reads = 0;
  let normalZero = 0;
  let normalShouldBeOne = 0;
  let normalZeroWhereOne = 0;

  for (const aim of FACE_AIMS) {
    if (aim.place !== undefined) placeBlock(test, "minecraft:stone", aim.place);
    for (const point of aim.points) {
      player.lookAtLocation(point);
      await test.idle(4);
      const head = player.getHeadLocation();
      const dir = player.getViewDirection();
      const hit = viewRay(player);
      test.assert(hit !== undefined, `${aim.label}: the view ray found no block`);
      if (hit === undefined) return;

      const cell = hit.block.location;
      const box = cellBox(head, dir, cell);
      test.assert(box !== undefined, `${aim.label}: the view ray misses the cell the engine reported`);
      if (box === undefined) return;
      const entry = sub(along(head, dir, box.tIn), cell);
      const n = box.axis;

      // The instrument: the engine's face and in-plane coordinates must agree
      // with the entry computed from head + view direction, or nothing below
      // says anything about faceLocation.
      test.assert(hit.face === box.face, `${aim.label}: engine face ${hit.face}, geometry says ${box.face}`);
      for (const a of AXES) {
        if (a === n) continue;
        const err = Math.abs(hit.faceLocation[a] - entry[a]);
        test.assert(err < 0.01, `${aim.label}: faceLocation.${a}=${hit.faceLocation[a]} but the ray enters at ${entry[a]}`);
      }

      reads++;
      const read = hit.faceLocation[n];
      if (Math.abs(read) < 1e-6) normalZero++;
      if (Math.round(entry[n]) === 1) {
        normalShouldBeOne++;
        if (Math.abs(read) < 1e-6) normalZeroWhereOne++;
      }
      const shipped = dist(head, cornerPlusFaceLocation(cell, hit.faceLocation));
      log(
        `FACE ${aim.label} block=${cellKey(cell)} face=${hit.face} faceLocation=${f3(hit.faceLocation)} ` +
          `entry=${f3(entry)} normal=${n} read=${read.toFixed(3)} geometric=${entry[n].toFixed(3)} ` +
          `head=${f3(head)} dir=${f3(dir)} distTrue=${box.tIn.toFixed(3)} distCornerPlusFaceLocation=${shipped.toFixed(3)}`
      );
    }
    if (aim.place !== undefined) test.setBlockType("minecraft:air", aim.place);
    await test.idle(2);
  }

  log(
    `FACE RESULT reads=${reads} normalZero=${normalZero}/${reads} ` +
      `zeroWhereGeometryIsOne=${normalZeroWhereOne}/${normalShouldBeOne}`
  );

  // Shapes whose face lies inside the cell: if faceLocation were zeroed along
  // the normal these would read 0 too; if it is the hit point's fractional
  // part, they read their true depth.
  for (const inset of INSET_AIMS) {
    test.setBlockPermutation(BlockPermutation.resolve(inset.id, inset.states), inset.place);
    player.lookAtLocation(inset.point);
    await test.idle(4);
    const head = player.getHeadLocation();
    const dir = player.getViewDirection();
    const hit = viewRay(player);
    test.assert(hit !== undefined, `${inset.label}: the view ray found no block`);
    if (hit === undefined) return;
    const cell = hit.block.location;
    const n = NORMAL_AXIS[hit.face as string];
    const t = (cell[n] + inset.depth - head[n]) / dir[n];
    const entry = sub(along(head, dir, t), cell);
    test.assert(hit.face === inset.face, `${inset.label}: engine face ${hit.face}, expected ${inset.face}`);
    for (const a of AXES) {
      if (a === n) continue;
      const err = Math.abs(hit.faceLocation[a] - entry[a]);
      test.assert(err < 0.01, `${inset.label}: faceLocation.${a}=${hit.faceLocation[a]} but the ray meets the face at ${entry[a]}`);
    }
    log(
      `FACE INSET ${inset.label} block=${hit.block.typeId}@${cellKey(test.relativeBlockLocation(cell))} face=${hit.face} ` +
        `faceLocation=${f3(hit.faceLocation)} normal=${n} read=${hit.faceLocation[n].toFixed(4)} shapeDepth=${inset.depth.toFixed(4)}`
    );
    test.setBlockType("minecraft:air", inset.place);
    await test.idle(2);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

// ------------------------------------------ probe: what the entity ray measures

registerAsync("andrew", "websword_entity_ray_distance", async (test: Test): Promise<void> => {
  const mob = test.spawnWithoutBehaviors(MOB, { x: 3, y: 2, z: 1 });
  const player = test.spawnSimulatedPlayer(MIDDLE, "wsface_eprobe", GameMode.Survival);
  await test.idle(8);

  // A just-spawned entity grows into its pick bounds over the first ticks, in
  // every direction at once: measured 0.345 against a settled 0.400 half-width,
  // which is the same 0.86 of full size that leaves a 1.95-tall villager only
  // 1.68 tall. So the aim at +1.7 passes over the unsettled box and misses,
  // while an aim at its middle hits throughout — which is why neither "two
  // consecutive hits" nor "two agreeing readings" settles this: both are
  // satisfied by the small box. Settle on the strictest aim the probe will use,
  // the highest one: once that hits twice, the box is full size by construction.
  const mobAt0 = test.relativeLocation(mob.location);
  const HIGHEST = 1.7;
  player.lookAtLocation({ x: mobAt0.x, y: mobAt0.y + HIGHEST, z: mobAt0.z });
  const samples: string[] = [];
  for (let settled = 0, waited = 0; settled < 2; waited += 2) {
    await test.idle(2);
    const reading = impliedHalfWidth(player, mob);
    settled = reading === undefined ? 0 : settled + 1;
    samples.push(`${waited + 2}:${reading?.toFixed(3) ?? "miss"}`);
    test.assert(
      waited < 60,
      `the top of the ${MOB}'s pick box at ${f3(mob.location)} never came up to +${HIGHEST} [${samples.join(" ")}]`
    );
  }
  log(`ENTITY settled on the +${HIGHEST} aim after [${samples.join(" ")}]`);

  const mobAt = test.relativeLocation(mob.location);
  const points: Vector3[] = [
    { x: mobAt.x, y: mobAt.y + 1.0, z: mobAt.z },
    { x: mobAt.x, y: mobAt.y + HIGHEST, z: mobAt.z },
    { x: mobAt.x + 0.2, y: mobAt.y + 0.3, z: mobAt.z },
  ];
  for (const point of points) {
    player.lookAtLocation(point);
    await test.idle(4);
    const head = player.getHeadLocation();
    const dir = player.getViewDirection();
    const hit = mobRay(player, mob);
    test.assert(hit !== undefined, `the entity ray missed the ${MOB} at ${f3(mob.location)}`);
    if (hit === undefined) return;
    // The mob stands due north, so the ray enters its bounds through their
    // south face: how far that face sits from the mob's centre is the bounds'
    // half-width, read straight off the engine's distance.
    const entry = along(head, dir, hit.distance);
    log(
      `ENTITY aim=${f3(point)} distance=${hit.distance.toFixed(3)} entry=${f3(entry)} ` +
        `impliedHalfWidth=${(entry.z - mob.location.z).toFixed(3)} toLocation=${dist(head, mob.location).toFixed(3)} ` +
        `feetToLocation=${dist(player.location, mob.location).toFixed(3)} mob=${f3(mob.location)} head=${f3(head)}`
    );
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

// ---------------------------------------------- probe: what stops which ray

interface Stopper {
  id: string;
  states?: Record<string, string | number | boolean>;
}

/** Placed one at a time in the eye-level cell between the player and the mob. Liquids last: they flow. */
const STOPPERS: Stopper[] = [
  { id: "minecraft:stone" },
  { id: "minecraft:glass" },
  { id: "minecraft:glass_pane" },
  { id: "minecraft:iron_bars" },
  { id: "minecraft:oak_fence" },
  { id: "minecraft:cobblestone_wall" },
  { id: "minecraft:oak_leaves" },
  { id: "minecraft:oak_slab", states: { "minecraft:vertical_half": "top" } },
  { id: "minecraft:trapdoor", states: { open_bit: true, direction: 0 } },
  { id: "minecraft:fence_gate", states: { open_bit: true, "minecraft:cardinal_direction": "north" } },
  { id: "minecraft:web" },
  { id: "minecraft:scaffolding" },
  { id: "minecraft:powder_snow" },
  { id: "minecraft:honey_block" },
  { id: "minecraft:slime" },
  { id: "minecraft:ladder" },
  { id: "minecraft:standing_sign" },
  { id: "minecraft:vine" },
  { id: "minecraft:short_grass" },
  { id: "minecraft:water" },
  { id: "minecraft:lava" },
];

registerAsync("andrew", "websword_ray_stoppers", async (test: Test): Promise<void> => {
  const stand: Vector3 = { x: 3, y: 2, z: 5 };
  const between: Vector3 = { x: 3, y: 3, z: 4 };
  const mob = test.spawnWithoutBehaviors(MOB, { x: 3, y: 2, z: 2 });
  const player = test.spawnSimulatedPlayer(stand, "wsface_stoppers", GameMode.Survival);
  await test.idle(8);
  player.lookAtLocation({ x: 3.5, y: 3.2, z: 2.5 });
  await test.idle(4);

  let clear = mobRay(player, mob);
  for (let attempt = 1; clear === undefined && attempt <= 3; attempt++) {
    const hits = player.getEntitiesFromViewDirection({ maxDistance: ENTITY_REACH });
    log(
      `STOP clear attempt=${attempt} mob=${f3(test.relativeLocation(mob.location))} valid=${mob.isValid} ` +
        `head=${f3(player.getHeadLocation())} dir=${f3(player.getViewDirection())} ` +
        `hits=[${hits.map((h) => `${h.entity.typeId}:${h.distance.toFixed(3)}`).join(" ")}]`
    );
    player.lookAtLocation({ x: 3.5, y: 3.2, z: 2.5 });
    await test.idle(4);
    clear = mobRay(player, mob);
  }
  test.assert(clear !== undefined, "with nothing in between, the entity ray does not reach the mob");
  log(`STOP none blockRay=${viewRay(player)?.block.typeId ?? "none"} entityRay=${clear?.distance.toFixed(3) ?? "blocked"}`);

  const describe = (hit: ReturnType<typeof viewRay>): string =>
    hit === undefined
      ? "none"
      : `${hit.block.typeId}@${cellKey(test.relativeBlockLocation(hit.block.location))}/${hit.face}/${f3(hit.faceLocation)}`;
  const seen = (hit: { distance: number } | undefined): string => (hit === undefined ? "blocked" : hit.distance.toFixed(3));

  let decisive = 0;
  for (const stopper of STOPPERS) {
    const liquid = stopper.id === "minecraft:water" || stopper.id === "minecraft:lava";
    try {
      test.setBlockPermutation(BlockPermutation.resolve(stopper.id, stopper.states), between);
    } catch (err) {
      log(`STOP ${stopper.id} SKIP ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    for (const wait of liquid ? [1, 5] : [1]) {
      await test.idle(wait === 1 ? 1 : 4);
      const trapHit = viewRay(player);
      const trapMob = mobRay(player, mob);
      const stops = trapHit !== undefined && cellKey(test.relativeBlockLocation(trapHit.block.location)) === cellKey(between);
      if (wait === 1 && stops && trapMob !== undefined) decisive++;
      // The same two rays with every block kind switched on, and with the
      // engine's defaults: which option, if any, makes a liquid count.
      const allHit = player.getBlockFromViewDirection({ maxDistance: BLOCK_REACH, includeLiquidBlocks: true, includePassableBlocks: true });
      const defaultHit = player.getBlockFromViewDirection({ maxDistance: BLOCK_REACH });
      const mobWithLiquids = player
        .getEntitiesFromViewDirection({ maxDistance: ENTITY_REACH, includeLiquidBlocks: true })
        .find((h) => h.entity.id === mob.id);
      log(
        `STOP ${stopper.id}${stopper.states === undefined ? "" : JSON.stringify(stopper.states)} tick+${wait} ` +
          `placed=${test.getBlock(between).typeId} ` +
          `blockRay=${describe(trapHit)} entityRay=${seen(trapMob)} decisive=${stops && trapMob !== undefined} | ` +
          `blockRayAll=${describe(allHit)} blockRayDefault=${describe(defaultHit)} entityRayLiquids=${seen(mobWithLiquids)}`
      );
    }
    if (test.getBlock(between).typeId !== "minecraft:air") test.setBlockType("minecraft:air", between);
    await test.idle(liquid ? 40 : 2);
  }
  log(`STOP RESULT types=${STOPPERS.length} blockRayStopsButEntityRayPasses=${decisive}`);
  // The Web Sword's wall rule rests on this being zero: a block the trap's
  // block ray stops at, but its entity ray sees past, would hand the decision
  // to findCenter's distance comparison, whose hitPoint() lands a block deep
  // on South, East and Up faces.
  test.assert(decisive === 0, `${decisive} block type(s) stop the block ray but not the entity ray`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------------- scenario geometry

type Heading = "n" | "e" | "s" | "w";
const HEADINGS: readonly Heading[] = ["n", "e", "s", "w"];

/** Quarter turns clockwise (seen from above) about the platform's middle, x/z in 0..7. */
const TURNS: Record<Heading, number> = { n: 0, e: 1, s: 2, w: 3 };

function turnPoint(p: Vector3, turns: number): Vector3 {
  let { x, z } = p;
  for (let i = 0; i < turns; i++) [x, z] = [7 - z, x];
  return { x, y: p.y, z };
}

function turnCell(c: Vector3, turns: number): Vector3 {
  let { x, z } = c;
  for (let i = 0; i < turns; i++) [x, z] = [6 - z, x];
  return { x, y: c.y, z };
}

const FACE_TURN: Direction[] = [Direction.South, Direction.West, Direction.North, Direction.East];

function turnFace(face: Direction, turns: number): Direction {
  if (face === Direction.Up || face === Direction.Down) return face;
  return FACE_TURN[(FACE_TURN.indexOf(face) + turns) % 4];
}

function cubeCells(center: Vector3): Vector3[] {
  const cells: Vector3[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        cells.push({ x: center.x + dx, y: center.y + dy, z: center.z + dz });
      }
    }
  }
  return cells;
}

/** Every cobweb cell in and one block around the platform, as relative keys. */
function webCells(test: Test): Set<string> {
  const dimension = test.getDimension();
  const found = new Set<string>();
  for (let x = -1; x <= 7; x++) {
    for (let y = -1; y <= 6; y++) {
      for (let z = -1; z <= 7; z++) {
        if (dimension.getBlock(test.worldBlockLocation({ x, y, z }))?.typeId === WEB_BLOCK_ID) {
          found.add(cellKey({ x, y, z }));
        }
      }
    }
  }
  return found;
}

/** Faces whose own plane is the block's far corner coordinate (+1): where faceLocation wraps to 0. */
const PLUS_FACES: ReadonlySet<Direction> = new Set([Direction.South, Direction.East, Direction.Up]);

type Winner = "mob" | "block";

interface Scenario {
  name: string;
  /** Solid blocks placed before anyone spawns. */
  stone: Vector3[];
  /** Where the mob stands (a continuous location). */
  mob: Vector3;
  player: Vector3;
  aim: Vector3;
  /** The cell and face the block ray must report; undefined when it must find nothing in reach. */
  hit?: { cell: Vector3; face: Direction };
  winner: Winner;
  /** Where the cube must grow. */
  center: Vector3;
}

function registerScenario(s: Scenario): void {
  registerAsync("andrew", s.name, async (test: Test): Promise<void> => {
    for (const cell of s.stone) placeBlock(test, "minecraft:stone", cell);
    const mob = test.spawnWithoutBehaviorsAtLocation(MOB, s.mob);
    const player = test.spawnSimulatedPlayer(s.player, `wsface_${s.name.slice(-12)}`, GameMode.Survival);
    await test.idle(4);
    const slot = armSword(player);
    await test.idle(4);
    player.lookAtLocation(s.aim);
    await test.idle(4);

    // What the trap is about to see, measured independently of it.
    const head = player.getHeadLocation();
    const dir = player.getViewDirection();
    const blockHit = viewRay(player);
    const seen = mobRay(player, mob);
    let blockTrue: number | undefined;
    let detail = "block=none";
    if (blockHit !== undefined) {
      const hitRel = test.relativeBlockLocation(blockHit.block.location);
      const box = cellBox(head, dir, blockHit.block.location);
      test.assert(box !== undefined, `${s.name}: the view ray misses the cell the engine reported`);
      blockTrue = box?.tIn;
      const cornerPlus = dist(head, cornerPlusFaceLocation(blockHit.block.location, blockHit.faceLocation));
      detail =
        `block=${blockHit.block.typeId}@${cellKey(hitRel)} face=${blockHit.face} faceLocation=${f3(blockHit.faceLocation)} ` +
        `blockTrue=${blockTrue?.toFixed(3)} blockCornerPlusFaceLocation=${cornerPlus.toFixed(3)}` +
        (PLUS_FACES.has(blockHit.face) ? " (wrapped)" : "");
    }
    log(`SCENE ${s.name} ${detail} mob=${seen === undefined ? "hidden" : seen.distance.toFixed(3)} dir=${f3(dir)}`);

    // The layout must be the case it claims, measured on this run.
    if (s.hit === undefined) {
      test.assert(blockHit === undefined, `${s.name}: the block ray stopped at ${blockHit?.block.typeId}, the layout expects nothing in reach`);
    } else {
      const hitRel = blockHit === undefined ? undefined : test.relativeBlockLocation(blockHit.block.location);
      test.assert(
        hitRel !== undefined && cellKey(hitRel) === cellKey(s.hit.cell) && blockHit?.face === s.hit.face,
        `${s.name}: the ray hit ${hitRel === undefined ? "nothing" : `${cellKey(hitRel)} ${blockHit?.face}`}, ` +
          `the layout expects ${cellKey(s.hit.cell)} ${s.hit.face}`
      );
    }
    if (s.winner === "mob") {
      test.assert(seen !== undefined, `${s.name}: the entity ray does not reach the mob`);
      if (seen !== undefined && blockTrue !== undefined) {
        test.assert(seen.distance < blockTrue, `${s.name}: the mob (${seen.distance}) is not in front of the block (${blockTrue})`);
      }
    }

    player.useItemInSlot(slot);
    await test.idle(10);

    const webs = webCells(test);
    const expected = cubeCells(s.center);
    const missing = expected.filter((c) => !webs.has(cellKey(c)));
    log(`SCENE ${s.name} RESULT webs=${webs.size} missing=${missing.length} expectedCentre=${cellKey(s.center)}`);
    test.assert(
      missing.length === 0,
      `${s.name}: the cube did not grow around ${cellKey(s.center)} (the ${s.winner}) — ${missing.length} of 27 cells are not cobweb`
    );
    test.assert(webs.size === 27, `${s.name}: ${webs.size} cobweb cells, a single cube is 27`);
    test.succeed();
  })
    .structureName(STRUCTURE)
    .maxTicks(200)
    .tag("andrew");
}

/**
 * Looking north from {4,2,5}. Walls are 2-high stone pillars, so the eye-level
 * ray meets them whatever its slight pitch.
 *
 * - wall_front: the mob stands between the player and the wall. The mob wins.
 * - wall_behind: the mob stands straight behind the wall. The wall wins.
 * - wall_edge: the ray enters the pillar's south face 0.1 from its west edge,
 *   leaves through its west face 0.2 later, and would reach a mob west of the
 *   pillar ~0.3 past the exit — inside the band where a hit point one block
 *   too deep would put the wall behind the mob. The wall wins.
 */
const NORTH: Record<"wall_front" | "wall_behind" | "wall_edge", Omit<Scenario, "name">> = {
  wall_front: {
    stone: [{ x: 4, y: 2, z: 1 }, { x: 4, y: 3, z: 1 }],
    mob: { x: 4.5, y: 2, z: 3.5 },
    player: { x: 4, y: 2, z: 5 },
    aim: { x: 4.5, y: 3.0, z: 3.5 },
    hit: { cell: { x: 4, y: 2, z: 1 }, face: Direction.South },
    winner: "mob",
    center: { x: 4, y: 2, z: 3 },
  },
  wall_behind: {
    stone: [{ x: 4, y: 2, z: 3 }, { x: 4, y: 3, z: 3 }],
    mob: { x: 4.5, y: 2, z: 2.5 },
    player: { x: 4, y: 2, z: 5 },
    aim: { x: 4.5, y: 3.0, z: 2.5 },
    hit: { cell: { x: 4, y: 3, z: 3 }, face: Direction.South },
    winner: "block",
    center: { x: 4, y: 3, z: 4 },
  },
  wall_edge: {
    stone: [{ x: 3, y: 2, z: 3 }, { x: 3, y: 3, z: 3 }],
    mob: { x: 2.5, y: 2, z: 3.5 },
    player: { x: 4, y: 2, z: 5 },
    aim: { x: 3.1, y: 3.5, z: 4 },
    hit: { cell: { x: 3, y: 3, z: 3 }, face: Direction.South },
    winner: "block",
    center: { x: 3, y: 3, z: 4 },
  },
};

function turned(name: string, s: Omit<Scenario, "name">, turns: number): Scenario {
  return {
    ...s,
    name,
    stone: s.stone.map((c) => turnCell(c, turns)),
    mob: turnPoint(s.mob, turns),
    player: turnCell(s.player, turns),
    aim: turnPoint(s.aim, turns),
    hit: s.hit === undefined ? undefined : { cell: turnCell(s.hit.cell, turns), face: turnFace(s.hit.face, turns) },
    center: turnCell(s.center, turns),
  };
}

for (const [kind, layout] of Object.entries(NORTH)) {
  for (const heading of HEADINGS) {
    registerScenario(turned(`websword_${kind}_${heading}`, layout, TURNS[heading]));
  }
}
