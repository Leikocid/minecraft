// Operator tools for structures, one command registered like /andrew:websword:
//   /andrew:structure place <type> [rotation]  build at the caller, through the registry
//   /andrew:structure locate [type]            nearest created instance, or counts per type
//   /andrew:structure chance <type> [0-100]    session-only chance per chunk; no number resets
//   /andrew:structure tp <type>                teleport to the nearest created instance
// Engine classes come in through CommandApi, so node tests load this module
// without a @minecraft/server stub.

import type {
  CommandPermissionLevel,
  CustomCommandOrigin,
  CustomCommandParamType,
  CustomCommandResult,
  CustomCommandStatus,
  Player,
  RawMessage,
  StartupEvent,
  System,
} from "@minecraft/server";
import { ROLL_DEFS, type StructureId, dimShort } from "./config";
import type { DimShort, Instance, Rotation } from "./registry";
import { chanceOverride, setChanceOverride } from "./roll";
import { type PlaceOutcome, type StrfRuntime, centreOf, nearest } from "./runtime";

export const STRUCTURE_COMMAND = "andrew:structure";

export const ACTIONS = ["place", "locate", "chance", "tp"] as const;
export type Action = (typeof ACTIONS)[number];
export const TYPES: readonly StructureId[] = ROLL_DEFS.map((d) => d.id);
export const ROTATION_DEGREES = [0, 90, 180, 270] as const;

const P = "andrew.structure";

/** Every lang key the command sends; tests/structures-commands.test.mjs checks both catalogs against it. */
export const TEXT = {
  noPermission: `${P}.no_permission`,
  notPlayer: `${P}.not_player`,
  needType: `${P}.need_type`,
  badRotation: `${P}.bad_rotation`,
  badChance: `${P}.bad_chance`,
  placed: `${P}.placed`,
  placedPending: `${P}.placed_pending`,
  standIn: `${P}.stand_in`,
  wrongDimension: `${P}.wrong_dimension`,
  notLoaded: `${P}.not_loaded`,
  rejected: `${P}.rejected`,
  blocked: `${P}.blocked`,
  failed: `${P}.failed`,
  found: `${P}.found`,
  noneOfType: `${P}.none_of_type`,
  summary: `${P}.summary`,
  summaryLine: `${P}.summary_line`,
  empty: `${P}.empty`,
  chanceSet: `${P}.chance_set`,
  chanceReset: `${P}.chance_reset`,
  chanceStandIn: `${P}.chance_stand_in`,
  teleported: `${P}.teleported`,
} as const;

/** Site-check and placement reasons with their own text; anything else goes through `why.other`. */
export const REASONS = [
  "liquid",
  "uneven",
  "ceiling",
  "floor",
  "lavaOcean",
  "collision:instance",
  "collision:spawner",
  "collision:signature",
  "collision:player",
  "site-changed",
  "template-missing",
] as const;

const reasonKey = (r: string): string => `${P}.why.${r.replace(":", "_")}`;
const typeKey = (t: string): string => `${P}.type.${t}`;
const dimKey = (d: DimShort): string => `${P}.dim.${d}`;
const stateKey = (s: string): string => `${P}.state.${s}`;
const STATES = ["planned", "placed", "looted", "guarded", "done"] as const;

export const TEXT_KEYS: readonly string[] = [
  ...Object.values(TEXT),
  ...REASONS.map(reasonKey),
  reasonKey("other"),
  ...TYPES.map(typeKey),
  ...(["o", "n"] as const).map(dimKey),
  ...STATES.map(stateKey),
];

/** The engine rejects an empty `with` ("Failed to resolve raw message"), so it is left out with no arguments. */
const t = (key: string, ...with_: Array<string | RawMessage>): RawMessage =>
  with_.length === 0 ? { translate: key } : { translate: key, with: { rawtext: with_.map((w) => (typeof w === "string" ? { text: w } : w)) } };
const typeName = (type: string): RawMessage => ({ translate: typeKey(type) });
const stateName = (s: string): RawMessage => ({ translate: stateKey(s) });
const why = (reason: string): RawMessage =>
  (REASONS as readonly string[]).includes(reason) ? { translate: reasonKey(reason) } : t(reasonKey("other"), reason);
const xyz = (p: readonly number[]): string[] => p.map((n) => String(Math.round(n)));

/** What the command needs of whoever ran it. */
export interface Caller {
  /** Below GameDirectors the command refuses, even if the engine let it through. */
  permitted: boolean;
  dimensionId: string;
  location: { x: number; y: number; z: number };
  teleport(to: { x: number; y: number; z: number }): void;
}

export interface Reply {
  ok: boolean;
  message: RawMessage;
}

export const isType = (v: unknown): v is StructureId => typeof v === "string" && (TYPES as readonly string[]).includes(v);

/**
 * The command body. Runs outside the read-only callback: it may write the
 * registry, place blocks and teleport. Returns every line it has to say.
 */
export function execute(runtime: StrfRuntime, action: Action, caller: Caller | undefined, type?: string, value?: number): Reply[] {
  const no = (message: RawMessage): Reply[] => [{ ok: false, message }];
  if (caller !== undefined && !caller.permitted) return no(t(TEXT.noPermission));

  if (action === "locate" && type === undefined) {
    const all = runtime.instances();
    if (all.length === 0) return no(t(TEXT.empty));
    return [
      { ok: true, message: t(TEXT.summary) },
      ...TYPES.map((ty) => ({ ok: true, message: t(TEXT.summaryLine, typeName(ty), String(all.filter((i) => i.def === ty).length)) })),
    ];
  }
  if (!isType(type)) return no(t(TEXT.needType, TYPES.join(", ")));

  if (action === "chance") return chance(runtime, type, value);
  if (caller === undefined) return no(t(TEXT.notPlayer));
  const dim = dimShort(caller.dimensionId);

  if (action === "place") {
    if (value !== undefined && !(ROTATION_DEGREES as readonly number[]).includes(value)) return no(t(TEXT.badRotation));
    const rot = (value === undefined ? Math.floor(Math.random() * 4) : value / 90) as Rotation;
    const need = ROLL_DEFS.find((d) => d.id === type)?.dim ?? "o";
    if (dim === undefined) return no(t(TEXT.wrongDimension, typeName(type), { translate: dimKey(need) }));
    return placeReplies(runtime, type, runtime.placeAt(type, dim, caller.location.x, caller.location.z, rot), rot);
  }

  const hit = dim === undefined ? undefined : nearest(runtime.instances(type), dim, caller.location);
  if (hit === undefined) return no(t(TEXT.noneOfType, typeName(type)));
  const c = centreOf(hit.instance);
  if (action === "tp") {
    const top = { x: c[0] + 0.5, y: hit.instance.origin[1] + hit.instance.size[1] + 1, z: c[2] + 0.5 };
    caller.teleport(top);
    return [{ ok: true, message: t(TEXT.teleported, typeName(type), ...xyz([top.x, top.y, top.z])) }];
  }
  return [{ ok: true, message: t(TEXT.found, typeName(type), ...xyz(c), String(Math.round(hit.distance)), stateName(hit.instance.state)) }];
}

function chance(runtime: StrfRuntime, type: StructureId, value: number | undefined): Reply[] {
  const def = ROLL_DEFS.find((d) => d.id === type);
  const spec = String(Math.round((def?.chance ?? 0) * 100));
  if (value === undefined) {
    setChanceOverride(type, undefined);
    const lines: Reply[] = [{ ok: true, message: t(TEXT.chanceReset, typeName(type), spec) }];
    if (runtime.isStandIn(type)) lines.push({ ok: true, message: t(TEXT.chanceStandIn, typeName(type)) });
    return lines;
  }
  if (!Number.isInteger(value) || value < 0 || value > 100) return [{ ok: false, message: t(TEXT.badChance) }];
  setChanceOverride(type, value / 100);
  return [{ ok: true, message: t(TEXT.chanceSet, typeName(type), String(value), spec) }];
}

function placeReplies(runtime: StrfRuntime, type: StructureId, r: PlaceOutcome, rot: Rotation): Reply[] {
  const name = typeName(type);
  switch (r.kind) {
    case "wrong-dimension":
      return [{ ok: false, message: t(TEXT.wrongDimension, name, { translate: dimKey(r.need) }) }];
    case "not-loaded":
      return [{ ok: false, message: t(TEXT.notLoaded, name) }];
    case "rejected":
      return [{ ok: false, message: t(TEXT.rejected, name, why(r.reason)) }];
    case "blocked":
      return [{ ok: false, message: t(TEXT.blocked, name, typeName(r.by.def), ...xyz(centreOf(r.by))) }];
    case "failed":
      return [{ ok: false, message: t(TEXT.failed, name, why(r.reason)) }];
    case "placed": {
      const inst: Instance = r.instance;
      const key = inst.state === "done" ? TEXT.placed : TEXT.placedPending;
      const lines: Reply[] = [{ ok: true, message: t(key, name, ...xyz(centreOf(inst)), String(rot * 90), stateName(inst.state)) }];
      if (runtime.isStandIn(type)) lines.push({ ok: true, message: t(TEXT.standIn, name) });
      return lines;
    }
  }
}

// ------------------------------------------------------------ engine adapter

export interface CommandApi {
  system: System;
  Player: typeof Player;
  CommandPermissionLevel: typeof CommandPermissionLevel;
  CustomCommandParamType: typeof CustomCommandParamType;
  CustomCommandStatus: typeof CustomCommandStatus;
}

export interface CommandOptions {
  /** The GameTest pack registers its own copy under another name; the release one owns STRUCTURE_COMMAND. */
  name?: string;
  runtime(): StrfRuntime | undefined;
  /** Where replies go; defaults to the calling player's chat. */
  send?(player: Player | undefined, reply: Reply): void;
  log?(msg: string): void;
}

/**
 * Must run at script load: custom commands register during startup only.
 * `startup` is the startup event source (system.beforeEvents.startup).
 */
export function registerStructureCommands(api: CommandApi, opts: CommandOptions): void {
  const name = opts.name ?? STRUCTURE_COMMAND;
  const log = opts.log ?? (() => {});
  const send =
    opts.send ??
    ((player: Player | undefined, reply: Reply): void => {
      if (player !== undefined) player.sendMessage(reply.message);
      else log(`[andrew] ${name}: ${JSON.stringify(reply.message)}`);
    });

  api.system.beforeEvents.startup.subscribe((event: StartupEvent) => {
    const registry = event.customCommandRegistry;
    const actionEnum = `${name}_action`;
    const typeEnum = `${name}_type`;
    registry.registerEnum(actionEnum, [...ACTIONS]);
    registry.registerEnum(typeEnum, [...TYPES]);
    registry.registerCommand(
      {
        name,
        description: "Structure operator tools: place at you, locate, change the chance per chunk for this session, teleport.",
        permissionLevel: api.CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: actionEnum, type: api.CustomCommandParamType.Enum }],
        optionalParameters: [
          { name: typeEnum, type: api.CustomCommandParamType.Enum },
          { name: "number", type: api.CustomCommandParamType.Integer },
        ],
      },
      (origin: CustomCommandOrigin, action: string, type?: string, value?: number): CustomCommandResult => {
        const player = origin.sourceEntity instanceof api.Player ? origin.sourceEntity : undefined;
        // The callback is read-only: registry writes, placement and teleport wait for the next tick.
        api.system.run(() => {
          const caller: Caller | undefined =
            player === undefined
              ? undefined
              : {
                  permitted: player.commandPermissionLevel >= api.CommandPermissionLevel.GameDirectors,
                  dimensionId: player.dimension.id,
                  location: player.location,
                  teleport: (to) => teleportSafely(player, to, api.system),
                };
          const runtime = opts.runtime();
          if (runtime === undefined) {
            log(`[andrew] ${name} ${action}: the structure runtime is not up yet`);
            return;
          }
          let replies: Reply[];
          try {
            replies = execute(runtime, action as Action, caller, type, value);
          } catch (e) {
            log(`[andrew] ${name} ${action} ${type ?? ""} threw ${String(e)}`);
            replies = [{ ok: false, message: t(reasonKey("other"), String(e)) }];
          }
          for (const r of replies) {
            try {
              send(player, r);
            } catch (e) {
              log(`[andrew] ${name}: reply ${r.message.translate ?? "?"} not delivered: ${String(e)}`);
            }
          }
          log(`[andrew] ${name} ${action} ${type ?? ""} ${value ?? ""} by ${player?.name ?? "the console"}: ${replies.map((r) => (r.ok ? "ok" : "refused")).join(",")}`);
        });
        return { status: api.CustomCommandStatus.Success };
      }
    );
    log(`[andrew] registered /${name} <${ACTIONS.join("|")}> [type] [number]`);
  });
}

/**
 * Above the box, with slow falling for the drop. A spot inside blocks (a
 * buried Warden City) is lifted to the surface once the chunk is readable.
 */
function teleportSafely(player: Player, to: { x: number; y: number; z: number }, system: System): void {
  player.teleport(to);
  player.addEffect("slow_falling", 200, { showParticles: false });
  system.runTimeout(() => {
    if (!player.isValid) return;
    const dim = player.dimension;
    const feet = dim.getBlock(to);
    const head = dim.getBlock({ x: to.x, y: to.y + 1, z: to.z });
    if (feet === undefined || head === undefined || (feet.isAir && head.isAir)) return;
    const top = dim.getTopmostBlock({ x: to.x, z: to.z });
    if (top !== undefined) player.teleport({ x: to.x, y: top.location.y + 1, z: to.z });
  }, 5);
}
