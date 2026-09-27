// /andrew:structure on a real engine. The release pack cannot resolve a
// SimulatedPlayer, so this pack registers the same command module as
// /andrew:gt_structure over its own runtime, and the simulated players run it
// through the engine's command line — permission gate included. Each test
// builds far from the platform, in its own ticking area, and removes it.
// `find` loads its own terrain through the production search host, under
// ticking-area names of its own.

import {
  BlockComponentTypes,
  BlockTypes,
  BlockVolume,
  CommandPermissionLevel,
  CustomCommandParamType,
  CustomCommandStatus,
  type Dimension,
  EnchantmentType,
  GameMode,
  ItemStack,
  Player,
  StructureRotation,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, Test, registerAsync } from "@minecraft/server-gametest";
import { BODIES, STAND_IN_CHESTS, STAND_IN_SIZE, standIn } from "../structures/bodies";
import { CUSTOM_TABLE } from "../structures/loot";
import { type Box, boxOf, sliceBox } from "../structures/clear";
import { type Reply, registerStructureCommands } from "../structures/commands";
import { rotatedSize, toWorld } from "../structures/rotate";
import { chanceOverride, setChanceOverride } from "../structures/roll";
import { type Instance, SALT_KEY, type Vec3 } from "../structures/registry";
import { StrfRuntime, centreOf, engineStrf } from "../structures/runtime";
import { engineSpawnHost } from "../structures/spawn-search";
import { MemoryStore } from "../structures/store";

const STRUCTURE = "andrew:platform";
const COMMAND = "andrew:gt_structure";
const CHUNK = 16;
const TEMPLATE_SIZE = STAND_IN_SIZE;

const log = (msg: string): void => console.warn(`[gametest] ${msg}`);
const v = (p: Vec3): Vector3 => ({ x: p[0], y: p[1], z: p[2] });

let runtime: StrfRuntime | undefined;
const replies: Array<{ player: string; ok: boolean; key: string; text: string }> = [];

registerStructureCommands(
  { system, Player, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus },
  {
    name: COMMAND,
    runtime: () => runtime,
    send: (player, reply: Reply) => {
      replies.push({ player: player?.name ?? "console", ok: reply.ok, key: reply.message.translate ?? "", text: JSON.stringify(reply.message) });
      player?.sendMessage(reply.message);
    },
    log,
    searchHost: (d) =>
      engineSpawnHost(world.getDimension(d === "n" ? "nether" : "overworld"), system, { BlockVolume, BlockTypes }, () => ({ x: 0, z: 0 }), undefined, {
        prefix: "andrew_gt_find_",
        pool: 5,
      }),
  }
);

function freshRuntime(): StrfRuntime {
  const store = new MemoryStore();
  store.set(SALT_KEY, `gt-cmd-${Date.now()}`);
  replies.length = 0;
  // The commands are proven over the probe box; the real Windmill has its own tests (windmill-body.ts).
  const bodies = { ...BODIES, windmill: standIn([CUSTOM_TABLE, CUSTOM_TABLE]) };
  runtime = new StrfRuntime(store, engineStrf({ world, BlockVolume, BlockTypes, StructureRotation, ItemStack, EnchantmentType }), { log, bodies });
  return runtime;
}

const repliesOf = (p: Player): Array<{ ok: boolean; key: string; text: string }> => replies.filter((r) => r.player === p.name);

/** A chunk-aligned square far from the platform, loaded by one ticking area; resolves with its remover. */
async function loadArea(test: Test, dim: Dimension, name: string, cx0: number, cz0: number, chunks: number): Promise<() => void> {
  const [x0, z0, x1, z1] = [cx0 * CHUNK, cz0 * CHUNK, (cx0 + chunks) * CHUNK - 1, (cz0 + chunks) * CHUNK - 1];
  const add = (): number => dim.runCommand(`tickingarea add ${x0} 0 ${z0} ${x1} 0 ${z1} ${name}`).successCount;
  if (add() === 0) {
    // Same cap as loadBox in structures-place.ts: ten areas, and a remove does not free
    // the slot in the same tick.
    log(`strf cmd: tickingarea add ${name} refused — clearing leftover areas and retrying once`);
    try {
      dim.runCommand("tickingarea remove_all");
    } catch (e) {
      log(`strf cmd: tickingarea remove_all threw ${String(e)}`);
    }
    if (add() === 0) throw new Error(`tickingarea add ${name} refused twice, after remove_all`);
  }
  const remove = (): void => {
    try {
      dim.runCommand(`tickingarea remove ${name}`);
    } catch (e) {
      log(`strf cmd: tickingarea remove ${name} threw ${String(e)}`);
    }
  };
  for (let t = 0; t < 300; t++) {
    let all = true;
    for (let cx = cx0; cx < cx0 + chunks && all; cx++)
      for (let cz = cz0; cz < cz0 + chunks && all; cz++) all = dim.isChunkLoaded({ x: cx * CHUNK, y: 0, z: cz * CHUNK });
    if (all) return remove;
    await test.idle(1);
  }
  remove();
  throw new Error(`${name}: chunks not loaded after 300 ticks`);
}

/** Chunk coordinates of a spot `offset` chunks east of the test, clear of every other test's ground. */
function farChunk(test: Test, offset: number): [number, number] {
  const b = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  return [Math.floor(b.x / CHUNK) + offset, Math.floor(b.z / CHUNK)];
}

function groundAt(dim: Dimension, x: number, z: number): number {
  const top = dim.getTopmostBlock({ x, z });
  if (top === undefined) throw new Error(`no ground at ${x},${z}`);
  return top.location.y;
}

function spawnPlayer(test: Test, name: string, level: CommandPermissionLevel): SimulatedPlayer {
  const p = test.spawnSimulatedPlayer({ x: 3, y: 2, z: 3 }, name, GameMode.Creative);
  p.commandPermissionLevel = level;
  return p;
}

/** Runs the command as the player; the engine's refusal comes back as a throw or successCount 0. */
function run(p: Player, args: string): string {
  try {
    return `successCount=${p.runCommand(`${COMMAND} ${args}`).successCount}`;
  } catch (e) {
    return `threw ${String(e)}`;
  }
}

function templateBox(inst: Instance): Box {
  return boxOf(inst.origin, rotatedSize(TEMPLATE_SIZE, inst.rot));
}

function wipe(dim: Dimension, inst: Instance | undefined): void {
  if (inst === undefined) return;
  for (const p of STAND_IN_CHESTS) {
    dim.getBlock(v(toWorld(inst.origin, p, TEMPLATE_SIZE, inst.rot)))?.getComponent(BlockComponentTypes.Inventory)?.container?.clearAll();
  }
  for (const s of sliceBox(templateBox(inst))) dim.fillBlocks(new BlockVolume(v(s.min), v(s.max)), "minecraft:air");
}

/** Place `type` at the player's feet through the command; returns the instance it reports in the registry. */
async function placeAt(test: Test, p: SimulatedPlayer, at: Vec3, type: string, rot: number): Promise<{ inst: Instance | undefined; outcome: string }> {
  p.teleport(v(at));
  await test.idle(2);
  const outcome = run(p, `place ${type} ${rot}`);
  await test.idle(3);
  const inst = runtime?.instances(type).find((i) => i.rot === rot / 90);
  return { inst, outcome };
}

// ------------------------------------------------ AC1: place goes through the registry to done

registerAsync("andrew", "strf_cmd_place", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const rt = freshRuntime();
  const [cx, cz] = farChunk(test, 20);
  const unload = await loadArea(test, dim, "andrew_gt_cmd_a", cx, cz, 5);
  const op = spawnPlayer(test, "andrew_cmd_op", CommandPermissionLevel.GameDirectors);
  let inst: Instance | undefined;
  try {
    const x = (cx + 2) * CHUNK + 8;
    const z = (cz + 2) * CHUNK + 8;
    const ground = groundAt(dim, x, z);
    const placed = await placeAt(test, op, [x, ground + 1, z], "windmill", 90);
    inst = placed.inst;
    log(`strf cmd place: ${placed.outcome}; replies ${repliesOf(op).map((r) => r.key).join(" ")}; record ${JSON.stringify(inst)}`);
    test.assert(inst !== undefined, `no windmill record in the registry (${placed.outcome}; ${repliesOf(op).map((r) => r.text).join(" | ")})`);
    if (inst === undefined) return;
    test.assert(inst.state === "done", `record state ${inst.state}, expected done`);
    test.assert(inst.origin[1] === ground + 1, `origin y ${inst.origin[1]}, the surface profile gives ${ground + 1}`);
    test.assert(repliesOf(op).some((r) => r.ok && r.key === "andrew.structure.placed"), `no "placed" reply: ${repliesOf(op).map((r) => r.key).join(" ")}`);

    // The world agrees with the record: template in place, both chests filled by the loot step.
    for (const local of STAND_IN_CHESTS) {
      const at = toWorld(inst.origin, local, TEMPLATE_SIZE, inst.rot);
      const c = dim.getBlock(v(at))?.getComponent(BlockComponentTypes.Inventory)?.container;
      test.assert(c !== undefined, `no chest at ${at.join(",")}`);
      test.assert((c?.emptySlotsCount ?? 27) < (c?.size ?? 27), `chest at ${at.join(",")} is empty — the loot step did not run`);
    }
    const spawner = dim.getBlock(v(toWorld(inst.origin, [4, 1, 3], TEMPLATE_SIZE, inst.rot)));
    test.assert(spawner?.typeId === "minecraft:mob_spawner", `spawner cell holds ${spawner?.typeId}`);

    // The same spot again: refused in words, no second record.
    replies.length = 0;
    const again = run(op, "place windmill 90");
    await test.idle(3);
    log(`strf cmd place again: ${again}; replies ${repliesOf(op).map((r) => r.key).join(" ")}`);
    test.assert(repliesOf(op).some((r) => !r.ok && r.key === "andrew.structure.blocked"), `second place: ${repliesOf(op).map((r) => r.key).join(" ")}`);
    test.assert(rt.instances().length === 1, `${rt.instances().length} records after a refused second place`);

    // A Bastion in the Overworld is refused, naming the Nether.
    replies.length = 0;
    run(op, "place bastion");
    await test.idle(3);
    test.assert(repliesOf(op).some((r) => !r.ok && r.key === "andrew.structure.wrong_dimension"), `bastion: ${repliesOf(op).map((r) => r.key).join(" ")}`);

    // Explicit coordinates place there, not at the caller — the same loaded area, three
    // chunks over, so this costs no extra ticking area (the engine allows about ten).
    const atX = (cx + 4) * CHUNK + 8;
    const atZ = (cz + 4) * CHUNK + 8;
    // Measured before placing: afterwards getTopmostBlock finds the structure's own roof.
    const groundThere = groundAt(dim, atX, atZ);
    replies.length = 0;
    const typedY = 64;
    const atOutcome = run(op, `place windmill 0 ${atX} ${typedY} ${atZ}`);
    await test.idle(3);
    const second = rt.instances("windmill").find((i) => i.rot === 0);
    log(
      `strf cmd place at coords: ${atOutcome}; caller at ${x},${z}, named ${atX},${atZ}; ` +
        `record ${JSON.stringify(second)}; ground there was ${groundThere}`
    );
    test.assert(second !== undefined, `no record for the coordinate form: ${atOutcome} ${repliesOf(op).map((r) => r.text).join(" | ")}`);
    if (second !== undefined) {
      test.assert(second.state === "done", `coordinate form state ${second.state}`);
      const centre = centreOf(second);
      test.assert(Math.abs(centre[0] - atX) <= 1 && Math.abs(centre[2] - atZ) <= 1, `centre ${centre.join(",")} is not the named ${atX},${atZ}`);
      test.assert(Math.abs(centre[0] - x) > CHUNK, `centre ${centre.join(",")} landed at the caller (${x},${z}) instead`);
      // The typed y is ignored: the height comes from the site profile, as in natural generation.
      test.assert(second.origin[1] !== typedY, `origin y is the typed ${typedY} — the site profile was bypassed`);
      test.assert(second.origin[1] === groundThere + 1, `origin y ${second.origin[1]}, the surface there was ${groundThere}`);
      wipe(dim, second);
    }
    test.succeed();
  } finally {
    wipe(dim, inst);
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ AC2 + AC4: locate and tp

registerAsync("andrew", "strf_cmd_locate_tp", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  freshRuntime();
  const [cx, cz] = farChunk(test, 30);
  const unload = await loadArea(test, dim, "andrew_gt_cmd_b", cx, cz, 5);
  const op = spawnPlayer(test, "andrew_cmd_locator", CommandPermissionLevel.GameDirectors);
  let inst: Instance | undefined;
  try {
    run(op, "locate");
    run(op, "locate windmill");
    await test.idle(3);
    const empty = repliesOf(op).map((r) => r.key);
    log(`strf cmd locate on an empty registry: ${empty.join(" ")}`);
    test.assert(empty.includes("andrew.structure.empty") && empty.includes("andrew.structure.none_of_type"), `empty world: ${empty.join(" ")}`);

    const x = (cx + 1) * CHUNK + 8;
    const z = (cz + 2) * CHUNK + 8;
    inst = (await placeAt(test, op, [x, groundAt(dim, x, z) + 1, z], "windmill", 0)).inst;
    test.assert(inst?.state === "done", `placed windmill: ${JSON.stringify(inst)}`);
    if (inst === undefined) return;
    const c = centreOf(inst);

    // Walk away, then ask.
    const away: Vec3 = [(cx + 4) * CHUNK + 8, groundAt(dim, (cx + 4) * CHUNK + 8, z) + 1, z];
    op.teleport(v(away));
    await test.idle(2);
    replies.length = 0;
    run(op, "locate windmill");
    run(op, "locate");
    await test.idle(3);
    const found = repliesOf(op).find((r) => r.key === "andrew.structure.found");
    log(`strf cmd locate: ${found?.text}; summary ${repliesOf(op).filter((r) => r.key === "andrew.structure.summary_line").map((r) => r.text).join(" ")}`);
    test.assert(found !== undefined, `no "found" reply: ${repliesOf(op).map((r) => r.key).join(" ")}`);
    test.assert(found?.text.includes(`{"text":"${c[0]}"},{"text":"${c[1]}"},{"text":"${c[2]}"}`) === true, `coordinates in ${found?.text}, expected ${c.join(" ")}`);
    const windmills = repliesOf(op).find((r) => r.key === "andrew.structure.summary_line" && r.text.includes("type.windmill"));
    test.assert(windmills?.text.includes('{"text":"1"}') === true, `summary line for windmill: ${windmills?.text}`);

    replies.length = 0;
    run(op, "tp windmill");
    await test.idle(10);
    const at = op.location;
    const off = Math.hypot(at.x - (c[0] + 0.5), at.z - (c[2] + 0.5));
    log(`strf cmd tp: player at ${at.x.toFixed(1)},${at.y.toFixed(1)},${at.z.toFixed(1)}, centre ${c.join(",")}, horizontal offset ${off.toFixed(2)}; ${repliesOf(op).map((r) => r.key).join(" ")}`);
    test.assert(repliesOf(op).some((r) => r.ok && r.key === "andrew.structure.teleported"), `tp reply: ${repliesOf(op).map((r) => r.key).join(" ")}`);
    test.assert(off < 1.5, `tp left the player ${off.toFixed(2)} blocks from the centre column`);
    test.succeed();
  } finally {
    wipe(dim, inst);
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ AC3: chance changes the roll, not the world store

registerAsync("andrew", "strf_cmd_chance", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const [cx, cz] = farChunk(test, 40);
  // An Airship footprint plus margin reaches 2 chunks past its own: the sampled 3×3 sits 2 chunks inside the loaded 7×7.
  const unload = await loadArea(test, dim, "andrew_gt_cmd_c", cx, cz, 7);
  const op = spawnPlayer(test, "andrew_cmd_chance", CommandPermissionLevel.GameDirectors);
  const propsBefore = world.getDynamicPropertyIds().length;
  try {
    const sample = (): { miss: number; other: string[] } => {
      const out = { miss: 0, other: [] as string[] };
      for (let x = cx + 2; x <= cx + 4; x++)
        for (let z = cz + 2; z <= cz + 4; z++)
          for (const r of runtime?.discovery.evaluateChunk("o", x, z).results ?? []) {
            if (r.def !== "airship") continue;
            if (r.outcome === "miss") out.miss++;
            else out.other.push(`${x},${z}:${r.outcome}${r.reason === undefined ? "" : `(${r.reason})`}`);
          }
      return out;
    };

    freshRuntime();
    run(op, "chance airship 100");
    await test.idle(3);
    const hundred = sample();
    const planned100 = runtime?.instances("airship").length ?? 0;
    log(`strf cmd chance 100: override=${chanceOverride("airship")} miss=${hundred.miss} ${hundred.other.join(" ")} planned=${planned100}; ${repliesOf(op).map((r) => r.key).join(" ")}`);
    test.assert(repliesOf(op).some((r) => r.ok && r.key === "andrew.structure.chance_set"), `chance reply: ${repliesOf(op).map((r) => r.key).join(" ")}`);
    test.assert(hundred.miss === 0, `${hundred.miss} of 9 chunks missed at 100`);
    test.assert(planned100 > 0 && hundred.other.every((o) => !o.includes(":pending")), `at 100: ${hundred.other.join(" ")}`);
    test.assert(hundred.other.every((o) => /:(planned|rejected\(collision)/.test(o)), `a chunk neither planned nor blocked by a neighbour: ${hundred.other.join(" ")}`);

    freshRuntime();
    run(op, "chance airship 0");
    await test.idle(3);
    const zero = sample();
    log(`strf cmd chance 0: miss=${zero.miss} ${zero.other.join(" ")} planned=${runtime?.instances("airship").length}`);
    test.assert(zero.miss === 9 && zero.other.length === 0, `at 0: miss=${zero.miss} ${zero.other.join(" ")}`);

    // Session only: the override lives in script memory, not in the world.
    const propsAfter = world.getDynamicPropertyIds().length;
    log(`strf cmd chance: world dynamic properties ${propsBefore} -> ${propsAfter}`);
    test.assert(propsAfter === propsBefore, `chance wrote ${propsAfter - propsBefore} world dynamic propert(ies)`);
    replies.length = 0;
    run(op, "chance airship");
    await test.idle(3);
    test.assert(chanceOverride("airship") === undefined, "no-argument chance did not reset the override");
    test.assert(repliesOf(op).some((r) => r.key === "andrew.structure.chance_reset"), `reset reply: ${repliesOf(op).map((r) => r.key).join(" ")}`);
    test.succeed();
  } finally {
    setChanceOverride("airship", undefined);
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ AC5: operators only

registerAsync("andrew", "strf_cmd_operator_only", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const rt = freshRuntime();
  const [cx, cz] = farChunk(test, 50);
  const unload = await loadArea(test, dim, "andrew_gt_cmd_d", cx, cz, 5);
  const op = spawnPlayer(test, "andrew_cmd_boss", CommandPermissionLevel.GameDirectors);
  const guest = spawnPlayer(test, "andrew_cmd_guest", CommandPermissionLevel.Any);
  let inst: Instance | undefined;
  try {
    const x = (cx + 2) * CHUNK + 8;
    const z = (cz + 2) * CHUNK + 8;
    const spot: Vec3 = [x, groundAt(dim, x, z) + 1, z];
    guest.teleport(v(spot));
    await test.idle(2);
    const guestRuns = ["place windmill 0", "locate", "chance windmill 100", "tp windmill"].map((a) => `${a} -> ${run(guest, a)}`);
    await test.idle(3);
    const guestReplies = repliesOf(guest);
    log(`strf cmd guest (level ${guest.commandPermissionLevel}): ${guestRuns.join("; ")}; replies ${guestReplies.map((r) => r.key).join(" ") || "none"}`);
    test.assert(guestReplies.every((r) => !r.ok), `a non-operator got an answer: ${guestReplies.map((r) => r.key).join(" ")}`);
    test.assert(rt.instances().length === 0, `a non-operator created ${rt.instances().length} record(s)`);
    test.assert(chanceOverride("windmill") === undefined, "a non-operator changed the chance");

    const placed = await placeAt(test, op, spot, "windmill", 0);
    inst = placed.inst;
    log(`strf cmd operator (level ${op.commandPermissionLevel}): ${placed.outcome}; replies ${repliesOf(op).map((r) => r.key).join(" ")}`);
    test.assert(inst?.state === "done", `the operator's place: ${placed.outcome} ${repliesOf(op).map((r) => r.key).join(" ")}`);
    test.succeed();
  } finally {
    setChanceOverride("windmill", undefined);
    wipe(dim, inst);
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ find: search, then build through the registry

/** The flat world's grass layer turned to water in a square of half-side `half` around x,z. */
function pool(dim: Dimension, x: number, z: number, half: number, block = "minecraft:water"): Box {
  const box: Box = { min: [x - half, -61, z - half], max: [x + half, -61, z + half] };
  for (const s of sliceBox(box)) dim.fillBlocks(new BlockVolume(v(s.min), v(s.max)), block);
  return box;
}

/** Waits for the line `find` delivers once its search ends. */
async function findResult(test: Test, who: string, ticks: number): Promise<{ ok: boolean; key: string; text: string } | undefined> {
  for (let t = 0; t < ticks; t++) {
    const hit = replies.find((r) => r.player === who && /\.find_(placed|none|error)$|\.(rejected|blocked|failed|not_loaded)$/.test(r.key));
    if (hit !== undefined) return hit;
    await test.idle(1);
  }
  return undefined;
}

registerAsync("andrew", "strf_cmd_find", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const rt = freshRuntime();
  const [cx, cz] = farChunk(test, 65);
  const unload = await loadArea(test, dim, "andrew_gt_cmd_f", cx, cz, 5);
  const op = spawnPlayer(test, "andrew_cmd_finder", CommandPermissionLevel.GameDirectors);
  const x = (cx + 2) * CHUNK + 8;
  const z = (cz + 2) * CHUNK + 8;
  pool(dim, x, z, 20);
  let inst: Instance | undefined;
  try {
    // The named point is in the middle of a pool: `place` there refuses.
    run(op, `place windmill 0 ${x} -60 ${z}`);
    await test.idle(3);
    const placeThere = repliesOf(op).map((r) => r.key);
    log(`strf cmd find: place in the pool -> ${placeThere.join(" ")}`);
    test.assert(placeThere.includes("andrew.structure.rejected") && rt.instances().length === 0, `place in the pool: ${placeThere.join(" ")}`);

    replies.length = 0;
    const outcome = run(op, `find windmill 48 ${x} -60 ${z}`);
    await test.idle(2);
    const started = repliesOf(op).find((r) => r.key === "andrew.structure.find_started");
    log(`strf cmd find: ${outcome}; immediate reply ${started?.text}`);
    test.assert(started !== undefined, `no "find_started" reply: ${repliesOf(op).map((r) => r.key).join(" ")}`);
    const result = await findResult(test, op.name, 1500);
    inst = rt.instances("windmill")[0];
    log(`strf cmd find RESULT: ${result?.key} ${result?.text}; record ${JSON.stringify(inst)}`);
    test.assert(result?.ok === true && result.key === "andrew.structure.find_placed", `find result: ${result?.key} ${result?.text}`);
    test.assert(inst !== undefined && inst.state === "done", `record ${JSON.stringify(inst)}`);
    if (inst === undefined) return;
    const c = centreOf(inst);
    const off = Math.hypot(c[0] - x, c[2] - z);
    test.assert(off > 10 && off <= 48, `centre ${c.join(",")} is ${off.toFixed(1)} from the named ${x},${z}`);
    // Where, how many were checked and why the rest went — all in the delivered line.
    test.assert(result?.text.includes(`{"text":"${c[0]}"},{"text":"${c[1]}"},{"text":"${c[2]}"}`) === true, `centre missing from ${result?.text}`);
    test.assert(/liquid=\d+/.test(result?.text ?? ""), `no reject reasons in ${result?.text}`);
    // Nothing of the footprint stands in the pool.
    const box = templateBox(inst);
    let wet = 0;
    for (let bx = box.min[0]; bx <= box.max[0]; bx++)
      for (let bz = box.min[2]; bz <= box.max[2]; bz++) if (dim.getBlock({ x: bx, y: -61, z: bz })?.typeId === "minecraft:water") wet++;
    test.assert(wet === 0, `${wet} water cell(s) under the footprint`);
    test.succeed();
  } finally {
    wipe(dim, inst);
    pool(dim, x, z, 20, "minecraft:grass_block");
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(2000)
  .tag("andrew");

registerAsync("andrew", "strf_cmd_find_refuses", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const rt = freshRuntime();
  const [cx, cz] = farChunk(test, 85);
  const unload = await loadArea(test, dim, "andrew_gt_cmd_g", cx, cz, 5);
  const x = (cx + 2) * CHUNK + 8;
  const z = (cz + 2) * CHUNK + 8;
  // Radius 12 plus the stand-in's half-diagonal stays inside a 28-block half-side pool.
  pool(dim, x, z, 28);
  const watch: Box = { min: [x - 36, -64, z - 36], max: [x + 36, -52, z + 36] };
  try {
    await test.idle(5);
    const before = await snapshot(test, dim, watch);
    // From the server console: no entity behind the command, the centre is the typed point.
    let outcome: string;
    try {
      outcome = `successCount=${dim.runCommand(`${COMMAND} find windmill 12 ${x} -60 ${z}`).successCount}`;
    } catch (e) {
      outcome = `threw ${String(e)}`;
    }
    const result = await findResult(test, "console", 1500);
    const after = await snapshot(test, dim, watch);
    const diff = changed(before, after);
    const all = replies.filter((r) => r.player === "console");
    log(`strf cmd find refuses RESULT: ${outcome}; replies ${all.map((r) => `${r.key} ${r.text}`).join(" | ")}; cells changed ${diff} of ${before.length}; records ${rt.registry.allInstances().length}`);
    test.assert(all.some((r) => r.key === "andrew.structure.find_started"), `no "find_started" reply: ${all.map((r) => r.key).join(" ")}`);
    test.assert(result?.ok === false && result.key === "andrew.structure.find_none", `find result: ${result?.key} ${result?.text}`);
    test.assert(/liquid=\d+/.test(result?.text ?? ""), `no reject reasons in ${result?.text}`);
    test.assert(diff === 0, `${diff} cell(s) of the world changed after a refused find`);
    test.assert(rt.registry.allInstances().length === 0, `${rt.registry.allInstances().length} record(s) after a refused find`);
    test.succeed();
  } finally {
    pool(dim, x, z, 28, "minecraft:grass_block");
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(2000)
  .tag("andrew");

/** Type of every cell, a few x-slices per tick so no single tick runs long. */
async function snapshot(test: Test, dim: Dimension, box: Box): Promise<string[]> {
  const out: string[] = [];
  for (let x = box.min[0]; x <= box.max[0]; x++) {
    for (let y = box.min[1]; y <= box.max[1]; y++)
      for (let z = box.min[2]; z <= box.max[2]; z++) out.push(dim.getBlock({ x, y, z })?.typeId ?? "unloaded");
    if ((x - box.min[0]) % 4 === 3) await test.idle(1);
  }
  return out;
}

const changed = (a: string[], b: string[]): number => a.reduce((n, t, i) => n + (b[i] === t ? 0 : 1), 0);

export const STRF_CMD_TESTS = ["strf_cmd_place", "strf_cmd_locate_tp", "strf_cmd_chance", "strf_cmd_operator_only", "strf_cmd_find", "strf_cmd_find_refuses"];
