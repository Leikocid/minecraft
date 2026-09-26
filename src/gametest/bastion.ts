// The Mini Bastion template on a real engine (§14.1, §14.3; L0-bast-r002..r004):
// placed in the Nether in all four rotations and judged by the blocks there;
// the two ways into the treasure room and the lava's vanilla behaviour are
// played by SimulatedPlayers. Every test clears what it placed.
//
// The player tests build in the Overworld, over the GameTest platform:
// SimulatedPlayer spawns and aims in test-relative coordinates of the test's
// own dimension, and a water bucket evaporates in the Nether by vanilla rule,
// so "reacts to water" can only be shown outside it.

import {
  BlockPermutation,
  BlockTypes,
  BlockVolume,
  Direction,
  type Dimension,
  GameMode,
  ItemStack,
  StructureRotation,
  type Vector3,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, Test, registerAsync } from "@minecraft/server-gametest";
import { type Box, boxOf, sliceBox } from "../structures/clear";
import type { Rotation, Vec3 } from "../structures/registry";
import { ENGINE_ROTATION, ROTATIONS, rotatedSize, toWorld } from "../structures/rotate";
import bastionTemplate, { BASTION_ID, BASTION_SIZE, CHESTS, DROP, MOAT, TREASURE, TREASURE_GOLD } from "../structures/templates/bastion";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const SIZE: Vec3 = [...BASTION_SIZE];
/** Nether height for the rotation test: clear of the lava sea (31) and the roof (≥ 123). */
const NETHER_Y = 40;
/** Test-relative min corner of the Overworld copy: above the platform, positive so relative = local + offset. */
const REL: Vec3 = [2, 4, 2];
/** Netherrack burns forever once lava lights it; a bridge of it sets its builder alight. */
const BRIDGE = "minecraft:cobblestone";

const log = (msg: string): void => console.warn(`[gametest] ${msg}`);
const v = (p: Vec3): Vector3 => ({ x: p[0], y: p[1], z: p[2] });
const fmt = (p: readonly number[]): string => p.map((n) => (Number.isInteger(n) ? n : n.toFixed(2))).join(",");
const local = (p: readonly number[]): Vec3 => [p[0], p[1], p[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const grow = (b: Box, n: number): Box => ({ min: [b.min[0] - n, b.min[1] - n, b.min[2] - n], max: [b.max[0] + n, b.max[1] + n, b.max[2] + n] });

function fillBox(dim: Dimension, box: Box, block: string): void {
  for (const s of sliceBox(box)) dim.fillBlocks(new BlockVolume(v(s.min), v(s.max)), block);
}

/** The template source: block counts per name (air excluded) and its distinct blocks. */
function templateFacts(): { counts: Map<string, number>; distinct: { name: string; states: Record<string, string | number | boolean> }[] } {
  const t = bastionTemplate();
  const counts = new Map<string, number>();
  for (const rows of Object.values(t.layers))
    for (const row of rows)
      for (const ch of row) {
        const name = t.blocks[ch].name;
        if (name !== "minecraft:air") counts.set(name, (counts.get(name) ?? 0) + 1);
      }
  return { counts, distinct: Object.values(t.blocks).map((b) => ({ name: b.name, states: b.states ?? {} })) };
}

const place = (dim: Dimension, loc: Vec3, rot: Rotation): void => {
  world.structureManager.place(BASTION_ID, dim, v(loc), { rotation: StructureRotation[ENGINE_ROTATION[rot]], includeEntities: false });
};

registerAsync("andrew", "bastion_nether_rotations", async (test: Test): Promise<void> => {
  const facts = templateFacts();
  const unknown = [...facts.counts.keys()].filter((n) => BlockTypes.get(n) === undefined);
  test.assert(unknown.length === 0, `template names the engine does not know: ${unknown.join(" ")}`);
  const badStates: string[] = [];
  for (const d of facts.distinct) {
    if (d.name === "minecraft:air") continue;
    try {
      BlockPermutation.resolve(d.name, d.states);
    } catch (e) {
      badStates.push(`${d.name} ${JSON.stringify(d.states)}: ${String(e)}`);
    }
  }
  test.assert(badStates.length === 0, `states the engine rejects: ${badStates.join("; ")}`);

  const nether = world.getDimension("nether");
  const b = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const loc: Vec3 = [b.x, NETHER_Y, b.z];
  const box = boxOf(loc, SIZE);
  // A netherrack shell keeps the Nether's own lava and air pockets out of the scan.
  const shell = grow(box, 1);
  const unload = await loadBox(test, nether, "andrew_gt_bastion_n", shell);
  const verdicts: string[] = [];
  try {
    for (const rot of ROTATIONS) {
      fillBox(nether, shell, "minecraft:netherrack");
      fillBox(nether, box, "minecraft:air");
      place(nether, loc, rot);
      // Let the lava tick: a source with somewhere to run would show up as extra lava.
      await test.idle(20);
      const problems: string[] = [];
      const counts = new Map<string, number>();
      const found = new Map<string, string>();
      let sources = 0;
      const fires: string[] = [];
      const rbox = boxOf(loc, rotatedSize(SIZE, rot));
      for (let y = rbox.min[1]; y <= rbox.max[1]; y++) {
        for (let x = rbox.min[0]; x <= rbox.max[0]; x++)
          for (let z = rbox.min[2]; z <= rbox.max[2]; z++) {
            const blk = nether.getBlock({ x, y, z });
            if (blk === undefined) throw new Error(`nether ${x},${y},${z} unloaded during the scan`);
            if (blk.isAir) continue;
            // Vanilla lava lights fire next to blocks that catch fire from it (chests, ladders): the engine's, not the template's.
            if (blk.typeId === "minecraft:fire") {
              fires.push(`${x},${y},${z}`);
              continue;
            }
            counts.set(blk.typeId, (counts.get(blk.typeId) ?? 0) + 1);
            found.set(`${x},${y},${z}`, blk.typeId);
            if (blk.typeId === "minecraft:lava" && blk.permutation.getState("liquid_depth") === 0) sources++;
            if (blk.typeId === "minecraft:chest" && blk.getComponent("minecraft:inventory")?.container === undefined) problems.push(`chest at ${x},${y},${z} has no container`);
          }
        await test.idle(1);
      }
      for (const [name, n] of facts.counts) if (counts.get(name) !== n) problems.push(`${name}: ${counts.get(name) ?? 0} in the world, ${n} in the template`);
      for (const [name, n] of counts) if (!facts.counts.has(name)) problems.push(`${name}: ${n} in the world, none in the template`);
      const lava = facts.counts.get("minecraft:lava") ?? 0;
      if (sources !== lava) problems.push(`${sources} lava sources in the world, ${lava} in the template`);
      for (const c of CHESTS) {
        const w = fmt(toWorld(loc, local(c.at), SIZE, rot));
        if (found.get(w) !== "minecraft:chest") problems.push(`no ${c.zone} chest at ${w} (template ${fmt(c.at)})`);
      }
      for (const g of TREASURE_GOLD) {
        const w = fmt(toWorld(loc, local(g), SIZE, rot));
        if (found.get(w) !== "minecraft:gold_block") problems.push(`no treasure gold at ${w} (template ${fmt(g)})`);
      }
      const chests = counts.get("minecraft:chest") ?? 0;
      const gold = counts.get("minecraft:gold_block") ?? 0;
      for (const p of problems) log(`bastion nether rot=${rot * 90} MISMATCH ${p}`);
      log(`bastion nether rot=${rot * 90}: chests ${chests}/${facts.counts.get("minecraft:chest")} gold ${gold}/${facts.counts.get("minecraft:gold_block")} lava sources ${sources}/${lava} blocks ${found.size} fire ${fires.join(" ") || "none"}`);
      verdicts.push(`${rot * 90}:${problems.length === 0 ? "ok" : `${problems.length} mismatch(es)`}`);
    }
  } finally {
    fillBox(nether, shell, "minecraft:netherrack");
    unload();
  }
  log(`bastion nether rotations: ${verdicts.join(" ")}`);
  test.assert(verdicts.length === 4 && verdicts.every((x) => x.endsWith(":ok")), `rotations: ${verdicts.join(" ")}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

/** The Overworld copy at rotation 0 over the platform, loaded and cleared around `body`. */
async function withBastion(test: Test, name: string, body: (dim: Dimension, rel: (p: readonly number[]) => Vec3) => Promise<void>): Promise<void> {
  const dim = test.getDimension();
  const b = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const loc: Vec3 = [b.x + REL[0], b.y + REL[1], b.z + REL[2]];
  const box = grow(boxOf(loc, SIZE), 2);
  const unload = await loadBox(test, dim, name, box);
  try {
    fillBox(dim, box, "minecraft:air");
    place(dim, loc, 0);
    await test.idle(5);
    await body(dim, (p) => add(REL, local(p)));
  } finally {
    fillBox(dim, box, "minecraft:air");
    for (const e of dim.getEntities({ location: v(add(loc, [10, 6, 10])), maxDistance: 24, type: "minecraft:item" })) e.remove();
    unload();
  }
}

const health = (p: SimulatedPlayer): number => p.getComponent("minecraft:health")?.currentValue ?? -1;
const onFire = (p: SimulatedPlayer): boolean => p.getComponent("minecraft:onfire") !== undefined;
/** Template-local cell of a test-relative position. */
const cellOf = (test: Test, p: SimulatedPlayer): Vec3 => {
  const r = test.relativeLocation(p.location);
  return [Math.floor(r.x) - REL[0], Math.floor(r.y) - REL[1], Math.floor(r.z) - REL[2]];
};
const onIsland = (c: Vec3): boolean => c[0] >= TREASURE.x0 && c[0] <= TREASURE.x1 && c[2] >= TREASURE.z0 && c[2] <= TREASURE.z1 && c[1] === TREASURE.y0;

/** Wait until `done` holds or `ticks` pass; true when it held. */
async function until(test: Test, ticks: number, done: () => boolean): Promise<boolean> {
  for (let t = 0; t < ticks; t++) {
    if (done()) return true;
    await test.idle(1);
  }
  return done();
}

registerAsync("andrew", "bastion_treasure_access", async (test: Test): Promise<void> => {
  await withBastion(test, "andrew_gt_bastion_a", async (_dim, rel) => {
    const problems: string[] = [];

    // 1. From above: walk off the main floor into the drop opening.
    const edge: Vec3 = [DROP.x0 + 2, DROP.y0 + 1, DROP.z0 - 2];
    const faller = test.spawnSimulatedPlayer(v(rel(edge)), "andrew_bastion_faller", GameMode.Survival);
    await test.idle(10);
    const hp0 = health(faller);
    const into = rel([DROP.x0 + 2, DROP.y0 + 1, DROP.z0 + 2]);
    faller.moveToLocation({ x: into[0] + 0.5, y: into[1], z: into[2] + 0.5 });
    const landed = await until(test, 100, () => onIsland(cellOf(test, faller)) && faller.isOnGround);
    await test.idle(10);
    const fc = cellOf(test, faller);
    log(`bastion drop: from ${fmt(edge)} landed at ${fmt(fc)} health ${hp0}→${health(faller)} onFire=${onFire(faller)}`);
    if (!landed) problems.push(`the faller did not land on the island: at ${fmt(fc)}`);
    if (onFire(faller)) problems.push("the faller is burning: the drop ends in lava");
    if (health(faller) < hp0) problems.push(`the drop cost ${hp0 - health(faller)} health`);
    faller.disconnect();

    // 2. Through the lava: stand at the moat's west edge and bridge it with blocks.
    // A row whose landing on the island is free floor: a chest there is taller than a step.
    const taken = [...CHESTS.map((c) => c.at), ...TREASURE_GOLD];
    let z = TREASURE.z0 + 1;
    while (taken.some((p) => p[2] === z && p[1] === TREASURE.y0 && p[0] <= TREASURE.x0 + 1)) z++;
    const stand: Vec3 = [MOAT.x0 - 1, TREASURE.y0, z];
    const builder = test.spawnSimulatedPlayer(v(rel(stand)), "andrew_bastion_builder", GameMode.Survival);
    await test.idle(10);
    builder.giveItem(new ItemStack(BRIDGE, 8), true);
    await test.idle(4);
    const hp1 = health(builder);
    const bridge: Vec3[] = [];
    for (let x = MOAT.x0; x < TREASURE.x0; x++) bridge.push([x, MOAT.y0, z]);
    const typeAt = (c: Vec3): string | undefined => test.getBlock(v(rel(c))).typeId;
    const before = bridge.map(typeAt);
    if (before.some((t) => t !== "minecraft:lava")) problems.push(`the bridge line is not lava before building: ${before.join(" ")}`);
    // Step by step, as a player bridges: click the east face of the block just
    // placed (or, if the engine refuses, the moat floor under the lava cell),
    // then step onto it.
    const tries: string[] = [];
    for (const c of bridge) {
      const behind = rel([c[0] - 1, c[1], c[2]]);
      builder.lookAtBlock(v(rel(c)));
      await test.idle(2);
      let ok = builder.useItemOnBlock(new ItemStack(BRIDGE, 1), v(behind), Direction.East);
      await test.idle(4);
      let how = "side";
      if (typeAt(c) !== BRIDGE) {
        how = "floor";
        ok = builder.useItemOnBlock(new ItemStack(BRIDGE, 1), v(rel([c[0], c[1] - 1, c[2]])), Direction.Up);
        await test.idle(4);
      }
      tries.push(`${fmt(c)} ${how} ${ok} → ${typeAt(c)}`);
      if (typeAt(c) !== BRIDGE) break;
      const step = rel([c[0], c[1] + 1, c[2]]);
      builder.moveToLocation({ x: step[0] + 0.5, y: step[1], z: step[2] + 0.5 });
      await until(test, 40, () => cellOf(test, builder)[0] === c[0]);
    }
    log(`bastion bridge tries: ${tries.join("; ")}`);
    const after = bridge.map(typeAt);
    log(`bastion bridge: ${bridge.map((c, i) => `${fmt(c)} ${before[i]}→${after[i]}`).join("; ")}`);
    if (after.some((t) => t !== BRIDGE)) problems.push(`the lava was not covered: ${after.join(" ")}`);
    const target = rel([TREASURE.x0 + 1, TREASURE.y0, z]);
    // Never walk an uncovered line: the result would be a burnt player, not a finding.
    if (after.some((t) => t !== BRIDGE)) {
      builder.disconnect();
      for (const p of problems) log(`bastion access MISMATCH ${p}`);
      test.fail(problems.join("; "));
      return;
    }
    builder.moveToLocation({ x: target[0] + 0.5, y: target[1], z: target[2] + 0.5 });
    const crossed = await until(test, 120, () => onIsland(cellOf(test, builder)));
    await test.idle(10);
    const bc = cellOf(test, builder);
    log(`bastion bridge walk: from ${fmt(stand)} reached ${fmt(bc)} health ${hp1}→${health(builder)} onFire=${onFire(builder)}`);
    if (!crossed) problems.push(`the builder did not reach the island over the bridge: at ${fmt(bc)}`);
    if (onFire(builder) || health(builder) < hp1) problems.push(`the builder got hurt crossing: health ${hp1}→${health(builder)} onFire=${onFire(builder)}`);
    builder.disconnect();

    for (const p of problems) log(`bastion access MISMATCH ${p}`);
    test.assert(problems.length === 0, problems.join("; "));
  });
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

registerAsync("andrew", "bastion_lava_vanilla", async (test: Test): Promise<void> => {
  await withBastion(test, "andrew_gt_bastion_l", async (_dim, rel) => {
    const problems: string[] = [];
    const typeAt = (c: Vec3): string => test.getBlock(v(rel(c))).typeId;

    // A bucket: a player at the moat's south edge scoops one source.
    const x = (TREASURE.x0 + TREASURE.x1 + 1) >> 1;
    const lava: Vec3 = [x, MOAT.y0, MOAT.z1];
    const stand: Vec3 = [x, TREASURE.y0, MOAT.z1 + 1];
    const player = test.spawnSimulatedPlayer(v(rel(stand)), "andrew_bastion_bucket", GameMode.Survival);
    await test.idle(10);
    player.giveItem(new ItemStack("minecraft:bucket", 1), true);
    await test.idle(4);
    const slot = player.selectedSlotIndex;
    const inv = player.getComponent("minecraft:inventory")?.container;
    const held = (): string | undefined => inv?.getItem(slot)?.typeId;
    const hasLavaBucket = (): boolean => {
      for (let i = 0; i < (inv?.size ?? 0); i++) if (inv?.getItem(i)?.typeId === "minecraft:lava_bucket") return true;
      return false;
    };
    const before = typeAt(lava);
    // Ways a player's bucket reaches a lava source; the first that fills it counts.
    const attempts: [string, () => void][] = [
      ["ray", () => (player.lookAtBlock(v(rel(lava))), player.useItemInSlot(slot))],
      ["on-lava", () => player.useItemInSlotOnBlock(slot, v(rel(lava)), Direction.Up)],
      ["edge-face", () => player.useItemInSlotOnBlock(slot, v(rel([stand[0], stand[1] - 1, stand[2]])), Direction.North)],
      ["floor-face", () => player.useItemInSlotOnBlock(slot, v(rel([lava[0], lava[1] - 1, lava[2]])), Direction.Up)],
      ["look-use", () => (player.lookAtLocation({ x: rel(lava)[0] + 0.5, y: rel(lava)[1] + 0.9, z: rel(lava)[2] + 0.5 }), player.useItem(new ItemStack("minecraft:bucket", 1)))],
    ];
    let how = "none";
    let scooped = false;
    const tried: string[] = [];
    for (const [name, act] of attempts) {
      let err = "";
      try {
        act();
      } catch (e) {
        err = ` threw ${String(e)}`;
      }
      scooped = await until(test, 10, () => hasLavaBucket() || typeAt(lava) !== "minecraft:lava");
      tried.push(`${name}${err}: held ${held()} lava ${typeAt(lava)}`);
      if (scooped) {
        how = name;
        break;
      }
    }
    log(`bastion bucket attempts: ${tried.join("; ")}`);
    scooped = hasLavaBucket();
    const afterBucket = typeAt(lava);
    log(`bastion bucket (${how}): ${fmt(lava)} ${before}→${afterBucket}, held ${held()}`);
    if (before !== "minecraft:lava") problems.push(`${fmt(lava)} is ${before}, not lava`);
    if (!scooped) problems.push(`the bucket did not fill: held ${held()}`);
    if (afterBucket === "minecraft:lava" && test.getBlock(v(rel(lava))).permutation.getState("liquid_depth") === 0) problems.push(`${fmt(lava)} is still a lava source after the bucket`);
    player.disconnect();

    // Water: a source poured over the moat on the north side turns the lava under it into obsidian.
    const wet: Vec3 = [x, MOAT.y0, MOAT.z0];
    const pour: Vec3 = [wet[0], wet[1] + 1, wet[2]];
    const wetBefore = typeAt(wet);
    test.setBlockType("minecraft:water", v(rel(pour)));
    const hardened = await until(test, 100, () => typeAt(wet) === "minecraft:obsidian");
    log(`bastion water: poured at ${fmt(pour)}, ${fmt(wet)} ${wetBefore}→${typeAt(wet)}`);
    if (wetBefore !== "minecraft:lava") problems.push(`${fmt(wet)} is ${wetBefore}, not lava`);
    if (!hardened) problems.push(`water over the lava source left ${typeAt(wet)}, not obsidian`);

    for (const p of problems) log(`bastion lava MISMATCH ${p}`);
    test.assert(problems.length === 0, problems.join("; "));
  });
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

export const BASTION_TESTS = ["bastion_nether_rotations", "bastion_treasure_access", "bastion_lava_vanilla"];

log(`registered ${BASTION_TESTS.length} bastion test(s): ${BASTION_TESTS.join(" ")}`);
