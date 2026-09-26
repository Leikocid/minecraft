// L0-strf-r008 on a real engine: every init step of one instance is caught up
// twice — the second time through a fresh Registry, as after a restart — and
// the world must hold exactly what the first pass put there.

import { ItemStack, Vector3, world } from "@minecraft/server";
import { Test, register } from "@minecraft/server-gametest";
import { type InitStep } from "../structures/state";
import { Registry, forcedOutcome, installTestHook, clearTestHook } from "../structures/registry";
import { DynamicPropertyStore } from "../structures/store";

const STRUCTURE = "andrew:platform";
const CHEST: Vector3 = { x: 2, y: 2, z: 2 };
const GUARD: Vector3 = { x: 4, y: 2, z: 4 };
const GUARD_TAG = "andrew_strf_reg_guard";
const MARKER: Vector3 = { x: 4, y: 2, z: 2 };
const STEPS: readonly InitStep[] = ["place", "loot", "guard", "finish"];

const log = (msg: string): void => console.warn(`[gametest] ${msg}`);

register("andrew", "strf_registry_steps_idempotent", (test: Test): void => {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 1, z: 0 });
  const store = new DynamicPropertyStore(world);

  // The hook is live in this pack: a forced outcome is what later GameTests
  // use to make a structure appear on a chosen chunk.
  installTestHook({ outcomes: [["probe_box", "o", Math.floor(origin.x / 16), Math.floor(origin.z / 16), true]] });
  test.assert(
    forcedOutcome("probe_box", "o", Math.floor(origin.x / 16), Math.floor(origin.z / 16)) === true,
    "test hook outcome override is not live in the gametest pack"
  );
  clearTestHook();

  const first = new Registry(store, log);
  const planned = first.plan({
    def: "probe_box",
    dim: "o",
    origin: [origin.x, origin.y, origin.z],
    rot: 0,
    size: [6, 3, 6],
    id: `probe_box:gt:${Date.now()}`,
  });
  test.assert(planned.ok, `plan refused: ${planned.ok ? "" : planned.blockedBy.id}`);
  if (!planned.ok) return;
  const inst = planned.instance;

  const work: Record<InitStep, () => void> = {
    place: () => test.setBlockType("minecraft:chest", CHEST),
    loot: () => {
      const container = test.getBlock(CHEST).getComponent("minecraft:inventory")?.container;
      test.assert(container !== undefined, "no chest container to fill");
      container?.addItem(new ItemStack("minecraft:diamond", 1));
    },
    guard: () => {
      const guard = test.spawn("minecraft:armor_stand", GUARD);
      guard.addTag(GUARD_TAG);
    },
    finish: () => test.setBlockType("minecraft:gold_block", MARKER),
  };
  const runs: Record<InitStep, number> = { place: 0, loot: 0, guard: 0, finish: 0 };
  const counted = (step: InitStep) => () => {
    runs[step]++;
    work[step]();
  };

  for (const step of STEPS) test.assert(first.runStep(inst, step, counted(step)) === "ran", `first pass: ${step} did not run`);

  const snapshot = () => {
    const container = test.getBlock(CHEST).getComponent("minecraft:inventory")?.container;
    let diamonds = 0;
    let stacks = 0;
    for (let i = 0; i < (container?.size ?? 0); i++) {
      const item = container?.getItem(i);
      if (item === undefined) continue;
      stacks++;
      if (item.typeId === "minecraft:diamond") diamonds += item.amount;
    }
    const guards = dim.getEntities({ tags: [GUARD_TAG] }).length;
    const gold = test.getBlock(MARKER).typeId === "minecraft:gold_block" ? 1 : 0;
    return { chest: test.getBlock(CHEST).typeId, stacks, diamonds, guards, gold };
  };
  const before = snapshot();

  // Catch every step up again, twice: same registry, then a fresh one.
  const second = new Registry(store, log);
  for (const reg of [first, second]) {
    for (const step of STEPS) {
      const res = reg.runStep(inst, step, counted(step));
      test.assert(res === "skipped", `catch-up: ${step} ran again`);
    }
  }
  const after = snapshot();

  log(`world before catch-up ${JSON.stringify(before)} after ${JSON.stringify(after)} work runs ${JSON.stringify(runs)}`);
  test.assert(JSON.stringify(before) === JSON.stringify(after), `catch-up changed the world: ${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
  test.assert(
    before.chest === "minecraft:chest" && before.stacks === 1 && before.diamonds === 1 && before.guards === 1 && before.gold === 1,
    `first pass did not build what it should: ${JSON.stringify(before)}`
  );
  test.assert(Object.values(runs).every((n) => n === 1), `step work ran more than once: ${JSON.stringify(runs)}`);
  test.assert(second.get("o", inst.origin, inst.id)?.state === "done", "record is not done");
  log(first.statsLine());

  for (const e of dim.getEntities({ tags: [GUARD_TAG] })) e.remove();
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(100)
  .tag("andrew");
