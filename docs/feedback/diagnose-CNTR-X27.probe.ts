// L0-xcx27 probe against BDS 1.26.51.1. P1: does a raised shield cancel script damage regardless of where its
// holder faces? P2: which damage causes pass a raised shield, and which of them armour reduces? P3: what option
// (b) — manual armour on a cause the shield ignores — takes from diamond armour with Protection IV, next to what
// the native call takes.
//
// Not part of the shipped gametest pack: diagnose-CNTR-X27.repro.sh copies this file into src/gametest/ for one
// run and restores the tree.

import { EnchantmentType, EntityDamageCause, EquipmentSlot, GameMode, ItemStack, type Vector3, system, world } from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";

const STRUCTURE = "andrew:platform";
const log = (msg: string): void => console.warn(`[probe] X27 ${msg}`);
const f2 = (n: number): string => n.toFixed(2);

/** The beam's damage (storm spec §02). */
const D = 10;
/** The hurt window is 10 ticks from the last landed hit. */
const CLEAR = 12;
const EYE = 1.62;
const DEG = 180 / Math.PI;

/** The platform floor is structure y=1, 7×7 from 0,0, so players stand at y=2. */
const CENTRE: Vector3 = { x: 3.5, y: 2, z: 3.5 };
const ARMOUR: Array<[EquipmentSlot, string]> = [
  [EquipmentSlot.Head, "minecraft:diamond_helmet"],
  [EquipmentSlot.Chest, "minecraft:diamond_chestplate"],
  [EquipmentSlot.Legs, "minecraft:diamond_leggings"],
  [EquipmentSlot.Feet, "minecraft:diamond_boots"],
];

interface Kit {
  armour: "none" | "diamond" | "diamond+prot4";
  shield: boolean;
}

interface Rig {
  label: string;
  p: SimulatedPlayer;
  spot: Vector3;
  kit: Kit;
  /** Yaw the holder faces; 0 is +z. */
  yaw: number;
}

interface Hurt {
  tick: number;
  cause: string;
  damage: number;
  by: string;
}

const hurts = new Map<string, Hurt[]>();

const nameOf = (p: { nameTag: string; typeId: string } | undefined): string => {
  try {
    if (p === undefined) return "none";
    return p.nameTag !== "" ? p.nameTag : p.typeId;
  } catch {
    return "?";
  }
};
const hpOf = (p: SimulatedPlayer): number => p.getComponent("minecraft:health")?.currentValue ?? -1;
const add = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
/** Yaw that looks from `a` to `b` (Bedrock: 0 is +z, 90 is −x). */
const yawTo = (a: Vector3, b: Vector3): number => Math.atan2(-(b.x - a.x), b.z - a.z) * DEG;
/** A point 20 blocks out along `yaw`, at eye height above `feet`. */
const lookPoint = (feet: Vector3, yaw: number): Vector3 => ({
  x: feet.x - Math.sin(yaw / DEG) * 20,
  y: feet.y + EYE,
  z: feet.z + Math.cos(yaw / DEG) * 20,
});
/** Horizontal angle between the holder's view and the direction to `src`. */
function angleTo(p: SimulatedPlayer, src: Vector3): number {
  const v = p.getViewDirection();
  const dx = src.x - p.location.x;
  const dz = src.z - p.location.z;
  const nv = Math.hypot(v.x, v.z);
  const ns = Math.hypot(dx, dz);
  if (nv === 0 || ns === 0) return Number.NaN;
  return Math.acos(Math.max(-1, Math.min(1, (v.x * dx + v.z * dz) / (nv * ns)))) * DEG;
}

function watchHurts(): () => void {
  hurts.clear();
  const sub = world.afterEvents.entityHurt.subscribe((e) => {
    const n = nameOf(e.hurtEntity);
    if (!n.startsWith("x27_")) return;
    const list = hurts.get(n) ?? [];
    list.push({ tick: system.currentTick, cause: e.damageSource.cause, damage: e.damage, by: nameOf(e.damageSource.damagingEntity) });
    hurts.set(n, list);
  });
  return () => world.afterEvents.entityHurt.unsubscribe(sub);
}

const hurtsSince = (p: SimulatedPlayer, t0: number): string =>
  (hurts.get(p.name) ?? [])
    .filter((h) => h.tick >= t0)
    .map((h) => `${h.cause}:${f2(h.damage)}@+${h.tick - t0}`)
    .join(" ");

/** Regen off for the probe; peaceful regenerates otherwise. Health is also read in the call's own tick. */
function pinRegen(): () => void {
  const regen = world.gameRules.naturalRegeneration;
  world.gameRules.naturalRegeneration = false;
  return () => {
    world.gameRules.naturalRegeneration = regen;
  };
}

/** The off-hand shield's durability damage; NaN when the engine refuses the read. */
function shieldWear(p: SimulatedPlayer): number {
  try {
    const item = p.getComponent("minecraft:equippable")?.getEquipmentSlot(EquipmentSlot.Offhand).getItem();
    return item?.getComponent("minecraft:durability")?.damage ?? -1;
  } catch {
    return Number.NaN;
  }
}

function equip(p: SimulatedPlayer, kit: Kit): string {
  const eq = p.getComponent("minecraft:equippable");
  if (eq === undefined) throw new Error(`${p.name}: no equippable`);
  for (const [slot, id] of ARMOUR) {
    if (kit.armour === "none") {
      eq.setEquipment(slot, undefined);
      continue;
    }
    const stack = new ItemStack(id);
    if (kit.armour === "diamond+prot4") stack.getComponent("minecraft:enchantable")?.addEnchantment({ type: new EnchantmentType("protection"), level: 4 });
    eq.setEquipment(slot, stack);
  }
  // A fresh shield every trial: a blocked hit wears it, and 336 durability would not last the table.
  const off = eq.setEquipment(EquipmentSlot.Offhand, kit.shield ? new ItemStack("minecraft:shield") : undefined);
  const chest = eq.getEquipment(EquipmentSlot.Chest);
  const prot = chest?.getComponent("minecraft:enchantable")?.getEnchantment("protection")?.level ?? 0;
  return `${chest?.typeId.replace("minecraft:", "") ?? "no-armour"}${prot > 0 ? `+prot${prot}` : ""} off=${eq.getEquipment(EquipmentSlot.Offhand)?.typeId.replace("minecraft:", "") ?? "-"}(${String(off)})`;
}

/** Puts the holder back on its spot facing `yaw`, with a fresh kit, full health, no effects and no fire. */
function prep(test: Test, r: Rig): string {
  const at = test.worldLocation(r.spot);
  r.p.teleport(at, { rotation: { x: 0, y: r.yaw } });
  r.p.setBodyRotation(r.yaw);
  // lookAtLocation takes structure-relative coordinates.
  r.p.lookAtLocation(lookPoint(r.spot, r.yaw), LookDuration.Continuous);
  const kit = equip(r.p, r.kit);
  r.p.isSneaking = r.kit.shield;
  for (const effect of r.p.getEffects()) r.p.removeEffect(effect.typeId);
  r.p.extinguishFire(false);
  r.p.getComponent("minecraft:health")?.resetToMaxValue();
  return kit;
}

async function spawn(test: Test, rel: Vector3, name: string): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer({ x: Math.floor(rel.x), y: rel.y, z: Math.floor(rel.z) }, name, GameMode.Survival);
  await test.idle(2);
  return p;
}

function removeAll(test: Test, players: SimulatedPlayer[]): void {
  for (const p of players) {
    try {
      if (p.isValid) test.removeSimulatedPlayer(p);
    } catch (err) {
      log(`cleanup ${p.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

function tryDamage(p: SimulatedPlayer, amount: number, cause: EntityDamageCause, src: SimulatedPlayer | undefined): string {
  try {
    return String(p.applyDamage(amount, src === undefined ? { cause } : { cause, damagingEntity: src }));
  } catch (err) {
    return `threw(${(err instanceof Error ? err.message : String(err)).replace(/\s+/g, " ").slice(0, 80)})`;
  }
}

// ------------------------------------------------ P1: does the block depend on where the holder faces?

interface FacingRow {
  label: string;
  nominal: number;
  measured: number;
  dist: number;
  shield: boolean;
  sneak: boolean;
  ret: string;
  took: number;
  took1: number;
  hurt: string;
  wear: number;
}

registerAsync("andrew", "probe_x27_facing", async (test: Test): Promise<void> => {
  const restore = pinRegen();
  const unwatch = watchHurts();
  const players: SimulatedPlayer[] = [];
  const rows: FacingRow[] = [];
  try {
    log(`setup difficulty=${world.getDifficulty()} naturalRegeneration=${world.gameRules.naturalRegeneration}`);
    const target = await spawn(test, CENTRE, "x27_target");
    const near = await spawn(test, { x: 0, y: 2, z: 0 }, "x27_near");
    const far = await spawn(test, { x: 6, y: 2, z: 0 }, "x27_far");
    players.push(target, near, far);
    const sword = near.setItem(new ItemStack("minecraft:diamond_sword"), 0, true);
    log(`setup near holds ${near.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand)?.typeId ?? "-"} (setItem ${String(sword)})`);
    const rig = (shield: boolean, yaw: number): Rig => ({ label: "target", p: target, spot: CENTRE, kit: { armour: "none", shield }, yaw });

    /**
     * One hit on the holder, who faces `yaw` (+z unless given). `offset` puts the source relative to the holder's
     * feet; the near source stands there through the settle, the far one is teleported in the tick of the call
     * (it stands in air).
     */
    const trial = async (
      label: string,
      nominal: number,
      offset: Vector3 | undefined,
      shield: boolean,
      how: "script-near" | "script-far" | "melee" | "nosource",
      yaw = 0
    ): Promise<void> => {
      const kit = prep(test, rig(shield, yaw));
      const src = how === "script-far" ? far : how === "nosource" ? undefined : near;
      const srcRel = offset === undefined ? undefined : add(CENTRE, offset);
      if (src === near && srcRel !== undefined) {
        near.teleport(test.worldLocation(srcRel), { facingLocation: target.getHeadLocation() });
        near.lookAtEntity(target, LookDuration.Continuous);
      }
      await test.idle(CLEAR);
      if (src === far && srcRel !== undefined) far.teleport(test.worldLocation(srcRel), { facingLocation: target.getHeadLocation() });
      const srcAt = src?.location;
      const measured = srcAt === undefined ? Number.NaN : angleTo(target, srcAt);
      const dist = srcAt === undefined ? Number.NaN : Math.hypot(srcAt.x - target.location.x, srcAt.y - target.location.y, srcAt.z - target.location.z);
      const sneak = target.isSneaking;
      const wear0 = shieldWear(target);
      const t0 = system.currentTick;
      const before = hpOf(target);
      let ret: string;
      if (how === "melee") ret = String(near.attackEntity(target));
      else ret = tryDamage(target, D, EntityDamageCause.entityAttack, src);
      const same = hpOf(target);
      await test.idle(1);
      const next = hpOf(target);
      await test.idle(1);
      const row: FacingRow = {
        label: `${how} ${label}`,
        nominal,
        measured,
        dist,
        shield,
        sneak,
        ret,
        took: before - same,
        took1: before - next,
        hurt: hurtsSince(target, t0),
        wear: shieldWear(target) - wear0,
      };
      rows.push(row);
      log(`FROW ${how} ${shield ? 1 : 0} ${label.replace(/ /g, "_")} ${f2(measured)} ${f2(dist)} ${f2(row.took)} ${f2(row.took1)} ${ret} wear+${row.wear}`);
      log(
        `FACING ${row.label}: nominal ${nominal}° measured ${f2(measured)}° dist ${f2(dist)} [${kit}] sneak=${sneak} ` +
          `ret=${ret} took ${f2(row.took)} (+1 ${f2(row.took1)}) hurt=[${row.hurt}] shieldWear+${row.wear} view=${f2(target.getViewDirection().x)},${f2(target.getViewDirection().z)}`
      );
    };

    const ring = (r: number, deg: number): Vector3 => ({ x: -Math.sin(deg / DEG) * r, y: 0, z: Math.cos(deg / DEG) * r });
    // Controls: the same calls on the same holder with no shield in hand, from the front and from behind.
    for (const deg of [0, 180]) {
      await trial(`no-shield ${deg}`, deg, ring(2, deg), false, "script-near");
      await trial(`no-shield ${deg}`, deg, ring(8, deg), false, "script-far");
      await trial(`no-shield ${deg}`, deg, ring(2, deg), false, "melee");
    }
    for (const deg of [0, 30, 60, 75, 85, 90, 95, 105, 120, 150, 180]) {
      await trial(`shield ${deg}`, deg, ring(2, deg), true, "script-near");
      await trial(`shield ${deg}`, deg, ring(8, deg), true, "script-far");
    }
    for (const deg of [0, 60, 85, 95, 120, 180]) await trial(`shield ${deg}`, deg, ring(2, deg), true, "melee");
    // The beam from a hill: the wielder 6 up and 6 out, in front and behind, and straight overhead.
    await trial("shield above-front", 0, { x: 0, y: 6, z: 6 }, true, "script-far");
    await trial("shield above-behind", 180, { x: 0, y: 6, z: -6 }, true, "script-far");
    await trial("shield overhead", Number.NaN, { x: 0, y: 8, z: 0 }, true, "script-far");
    // No damagingEntity: the call strm-pprb P3 writes.
    await trial("shield no source", Number.NaN, undefined, true, "nosource");
    await trial("shield no source facing -z", Number.NaN, undefined, true, "nosource", 180);
    await trial("no-shield no source", Number.NaN, undefined, false, "nosource");
  } finally {
    unwatch();
    restore();
    removeAll(test, players);
  }
  const pick = (label: string): FacingRow | undefined => rows.find((r) => r.label === label);
  const front = pick("script-near shield 0");
  const back = pick("script-near shield 180");
  const farFront = pick("script-far shield 0");
  const farBack = pick("script-far shield 180");
  log(
    `RESULT facing entityAttack+source 10: near front took ${f2(front?.took ?? -1)} (ret ${front?.ret}), near back took ${f2(back?.took ?? -1)} (ret ${back?.ret}); ` +
      `far front ${f2(farFront?.took ?? -1)}, far back ${f2(farBack?.took ?? -1)}; ` +
      `blocked at [${rows.filter((r) => r.shield && r.label.startsWith("script-far") && r.took === 0).map((r) => f2(r.measured)).join(", ")}]°, ` +
      `passed at [${rows.filter((r) => r.shield && r.label.startsWith("script-far") && r.took > 0).map((r) => f2(r.measured)).join(", ")}]°`
  );
  for (const r of rows.filter((x) => !x.shield && !x.label.startsWith("nosource"))) test.assert(r.took > 0, `control: ${r.label} took ${f2(r.took)} with no shield — the instrument cannot see damage`);
  const meleeFront = pick("melee shield 0");
  test.assert(meleeFront !== undefined && meleeFront.took === 0, `control: a diamond-sword hit from the front landed ${f2(meleeFront?.took ?? -1)} through the shield — it is not raised`);
  const unsneaked = rows.filter((r) => r.sneak !== r.shield);
  test.assert(unsneaked.length === 0, `isSneaking did not read back as set in ${unsneaked.length} trials`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(3000)
  .tag("andrew");

// ------------------------------------------------ P2: every cause × shield (front, back) × armour

/** Every member of EntityDamageCause in @minecraft/server 2.10.0. */
const CAUSES: EntityDamageCause[] = [
  EntityDamageCause.anvil,
  EntityDamageCause.blockExplosion,
  EntityDamageCause.campfire,
  EntityDamageCause.charging,
  EntityDamageCause.contact,
  EntityDamageCause.drowning,
  EntityDamageCause.entityAttack,
  EntityDamageCause.entityExplosion,
  EntityDamageCause.fall,
  EntityDamageCause.fallingBlock,
  EntityDamageCause.fire,
  EntityDamageCause.fireTick,
  EntityDamageCause.fireworks,
  EntityDamageCause.flyIntoWall,
  EntityDamageCause.freezing,
  EntityDamageCause.lava,
  EntityDamageCause.lightning,
  EntityDamageCause.maceSmash,
  EntityDamageCause.magic,
  EntityDamageCause.magma,
  EntityDamageCause.none,
  EntityDamageCause.override,
  EntityDamageCause.piston,
  EntityDamageCause.projectile,
  EntityDamageCause.ramAttack,
  EntityDamageCause.selfDestruct,
  EntityDamageCause.sonicBoom,
  EntityDamageCause.soulCampfire,
  EntityDamageCause.stalactite,
  EntityDamageCause.stalagmite,
  EntityDamageCause.starve,
  EntityDamageCause.suffocation,
  EntityDamageCause.temperature,
  EntityDamageCause.thorns,
  EntityDamageCause.wither,
];
/** The source stands at the north edge; the holders stand in a row 5 blocks south. */
const SOURCE_AT: Vector3 = { x: 3.5, y: 2, z: 0.5 };
const ROW_Z = 5.5;

registerAsync("andrew", "probe_x27_causes", async (test: Test): Promise<void> => {
  const restore = pinRegen();
  const unwatch = watchHurts();
  const players: SimulatedPlayer[] = [];
  const verdicts: Array<{ cause: string; src: boolean; took: Record<string, number>; ret: Record<string, string> }> = [];
  try {
    const source = await spawn(test, SOURCE_AT, "x27_source");
    players.push(source);
    const specs: Array<[string, number, Kit, "toward" | "away"]> = [
      ["bare", 0.5, { armour: "none", shield: false }, "toward"],
      ["diamond", 2.0, { armour: "diamond", shield: false }, "toward"],
      ["prot4", 3.5, { armour: "diamond+prot4", shield: false }, "toward"],
      ["shield-front", 5.0, { armour: "none", shield: true }, "toward"],
      ["shield-back", 6.5, { armour: "none", shield: true }, "away"],
    ];
    const rigs: Rig[] = [];
    for (const [label, x, kit, face] of specs) {
      const spot: Vector3 = { x, y: 2, z: ROW_Z };
      const toward = yawTo(spot, SOURCE_AT);
      const p = await spawn(test, spot, `x27_${label.replace("-", "_")}`);
      players.push(p);
      rigs.push({ label, p, spot, kit, yaw: face === "toward" ? toward : toward + 180 });
    }
    for (const cause of CAUSES) {
      for (const withSource of [true, false]) {
        const kits = rigs.map((r) => prep(test, r));
        source.teleport(test.worldLocation(SOURCE_AT), { facingLocation: test.worldLocation({ x: 3.5, y: 2 + EYE, z: ROW_Z }) });
        await test.idle(CLEAR);
        const t0 = system.currentTick;
        const took: Record<string, number> = {};
        const ret: Record<string, string> = {};
        const angles: string[] = [];
        for (const r of rigs) {
          const before = hpOf(r.p);
          ret[r.label] = tryDamage(r.p, D, cause, withSource ? source : undefined);
          took[r.label] = before - hpOf(r.p);
          if (r.kit.shield) angles.push(`${r.label} ${f2(angleTo(r.p, source.location))}° sneak=${r.p.isSneaking}`);
        }
        await test.idle(1);
        const later = rigs.map((r) => `${r.label} ${f2(20 - hpOf(r.p))}`).join(", ");
        const tag = `${cause} ${withSource ? "src" : "nosrc"}`;
        log(
          `CAUSE ${tag}: ${rigs.map((r) => `${r.label} took ${f2(took[r.label])} ret=${ret[r.label]} hurt=[${hurtsSince(r.p, t0)}]`).join("; ")} | +1: ${later} | ${angles.join(", ")}` +
            (cause === CAUSES[0] && withSource ? ` | kits ${rigs.map((r, i) => `${r.label}=${kits[i]}`).join(" ")}` : "")
        );
        verdicts.push({ cause, src: withSource, took, ret });
        await test.idle(1);
      }
    }
  } finally {
    unwatch();
    restore();
    removeAll(test, players);
  }
  // One line per cause and source mode, ready to tabulate.
  for (const v of verdicts) {
    const t = v.took;
    const lands = t.bare > 0;
    const shieldFront = !lands ? "n/a" : t["shield-front"] === t.bare ? "passes" : t["shield-front"] === 0 ? "BLOCKED" : `partial ${f2(t["shield-front"])}`;
    const shieldBack = !lands ? "n/a" : t["shield-back"] === t.bare ? "passes" : t["shield-back"] === 0 ? "BLOCKED" : `partial ${f2(t["shield-back"])}`;
    const armour = !lands ? "n/a" : t.prot4 < t.bare ? `reduced ${f2(t.prot4)} (diamond only ${f2(t.diamond)})` : "IGNORED";
    log(`TABLE ${v.cause} ${v.src ? "src" : "nosrc"}: bare ${f2(t.bare)} ret=${v.ret.bare} | shield front ${shieldFront} | shield back ${shieldBack} | armour ${armour}`);
    const ret = v.ret.bare.startsWith("threw") ? "threw" : v.ret.bare;
    log(`ROW ${v.cause} ${v.src ? "s" : "n"} ${f2(t.bare)} ${f2(t["shield-front"])} ${f2(t["shield-back"])} ${f2(t.prot4)} ${f2(t.diamond)} ${ret}`);
  }
  const ctl = verdicts.find((v) => v.cause === EntityDamageCause.entityAttack && v.src);
  test.assert(ctl !== undefined && ctl.took.bare === D, `control: entityAttack ${D} from the source took ${f2(ctl?.took.bare ?? -1)} from a bare holder`);
  test.assert(ctl !== undefined && ctl.took.prot4 < D / 2, `control: armour let ${f2(ctl?.took.prot4 ?? -1)} of entityAttack through — it is not on`);
  test.assert(ctl !== undefined && ctl.took["shield-front"] === 0, `control: entityAttack from in front took ${f2(ctl?.took["shield-front"] ?? -1)} through the shield — it is not raised`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(6000)
  .tag("andrew");

// ------------------------------------------------ P3: option (b) on diamond + Protection IV

interface ArmourModel {
  label: string;
  /** Damage left after `armour` points, `toughness` and a Protection EPF total `epf`. */
  reduce: (dmg: number, armour: number, toughness: number, epf: number) => number;
}

/** Diamond: 3+8+6+3 armour points, 2 toughness a piece; Protection IV is EPF 4 a piece. */
const DIAMOND = { armour: 20, toughness: 8, epf: 16 };
const MODELS: ArmourModel[] = [
  {
    label: "java-1.21",
    reduce: (dmg, armour, toughness, epf) => {
      const f = 2 + toughness / 4;
      const g = Math.min(20, Math.max(armour * 0.2, armour - dmg / f));
      return dmg * (1 - g / 25) * (1 - Math.min(20, epf) / 25);
    },
  },
  {
    label: "flat-4%",
    reduce: (dmg, armour, _toughness, epf) => dmg * (1 - Math.min(20, armour) / 25) * (1 - Math.min(20, epf) / 25),
  },
];

registerAsync("andrew", "probe_x27_manual", async (test: Test): Promise<void> => {
  const restore = pinRegen();
  const unwatch = watchHurts();
  const players: SimulatedPlayer[] = [];
  const native: Record<string, number[]> = {};
  try {
    const source = await spawn(test, SOURCE_AT, "x27_source");
    players.push(source);
    const specs: Array<[string, number, Kit, "toward" | "away"]> = [
      ["diamond", 0.5, { armour: "diamond", shield: false }, "toward"],
      ["prot4", 2.0, { armour: "diamond+prot4", shield: false }, "toward"],
      ["prot4+shield-back", 3.5, { armour: "diamond+prot4", shield: true }, "away"],
      ["prot4+shield-front", 5.0, { armour: "diamond+prot4", shield: true }, "toward"],
      ["bare", 6.5, { armour: "none", shield: false }, "toward"],
    ];
    const rigs: Rig[] = [];
    for (const [label, x, kit, face] of specs) {
      const spot: Vector3 = { x, y: 2, z: ROW_Z };
      const toward = yawTo(spot, SOURCE_AT);
      const p = await spawn(test, spot, `x27_${label.replace(/[^a-z0-9]/g, "_")}`);
      players.push(p);
      rigs.push({ label, p, spot, kit, yaw: face === "toward" ? toward : toward + 180 });
    }
    let kitsLogged = false;
    const round = async (tag: string, act: (r: Rig) => string): Promise<Record<string, number>> => {
      const kits = rigs.map((r) => `${r.label}=${prep(test, r)}`);
      if (!kitsLogged) log(`MANUAL kits ${kits.join(" ")}`);
      kitsLogged = true;
      source.teleport(test.worldLocation(SOURCE_AT), { facingLocation: test.worldLocation({ x: 3.5, y: 2 + EYE, z: ROW_Z }) });
      await test.idle(CLEAR);
      const t0 = system.currentTick;
      const took: Record<string, number> = {};
      const parts: string[] = [];
      for (const r of rigs) {
        const before = hpOf(r.p);
        const ret = act(r);
        took[r.label] = before - hpOf(r.p);
        parts.push(`${r.label} took ${f2(took[r.label])} ret=${ret} hurt=[${hurtsSince(r.p, t0)}]`);
      }
      await test.idle(1);
      log(`MANUAL ${tag}: ${parts.join("; ")}`);
      return took;
    };
    for (const dmg of [D, 6]) {
      // The native call strm-rdmg prescribes, three times over to see whether armour is deterministic.
      for (let i = 1; i <= 3; i++) {
        const took = await round(`native entityAttack+src ${dmg} #${i}`, (r) => tryDamage(r.p, dmg, EntityDamageCause.entityAttack, source));
        for (const [k, v] of Object.entries(took)) (native[`${k}@${dmg}`] ??= []).push(v);
      }
      for (const m of MODELS) {
        const reduced = m.reduce(dmg, DIAMOND.armour, DIAMOND.toughness, DIAMOND.epf);
        const plain = m.reduce(dmg, DIAMOND.armour, DIAMOND.toughness, 0);
        log(`MANUAL model ${m.label} ${dmg}: diamond ${f2(plain)}, diamond+prot4 ${f2(reduced)}`);
        for (const cause of [EntityDamageCause.override, EntityDamageCause.sonicBoom]) {
          await round(`option-b ${m.label} ${cause}+src ${dmg} -> ${f2(reduced)}`, (r) =>
            tryDamage(r.p, r.kit.armour === "diamond" ? plain : r.kit.armour === "none" ? dmg : reduced, cause, source)
          );
        }
      }
    }
  } finally {
    unwatch();
    restore();
    removeAll(test, players);
  }
  const fmt = (k: string): string => (native[k] ?? []).map(f2).join("/");
  log(
    `RESULT native entityAttack+src 10: diamond ${fmt(`diamond@${D}`)}, diamond+prot4 ${fmt(`prot4@${D}`)}, prot4 shield back ${fmt(`prot4+shield-back@${D}`)}, ` +
      `prot4 shield front ${fmt(`prot4+shield-front@${D}`)}, bare ${fmt(`bare@${D}`)}; 6: diamond ${fmt("diamond@6")}, diamond+prot4 ${fmt("prot4@6")}`
  );
  test.assert((native[`bare@${D}`] ?? []).every((v) => v === D), `control: the bare holder took ${fmt(`bare@${D}`)} from entityAttack ${D}`);
  test.assert((native[`prot4@${D}`] ?? []).every((v) => v < D / 2), `control: diamond + Protection IV let ${fmt(`prot4@${D}`)} through — it is not on`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(3000)
  .tag("andrew");
