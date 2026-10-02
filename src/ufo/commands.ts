// /andrew:ufo come|stop|enable|disable (UFO §9, L0-ufoc-p004, ad04): one
// command, one enum parameter, operators only. Replies are plain English: a
// CustomCommandResult message is a string, not rawtext (L0-ufoc-as01).
// Engine classes come in through UfoCommandApi, so node tests load this module
// without a @minecraft/server stub.

import type {
  CommandPermissionLevel,
  CustomCommandOrigin,
  CustomCommandParamType,
  CustomCommandResult,
  CustomCommandStatus,
  Entity,
  StartupEvent,
} from "@minecraft/server";
import { UFO_ACTIONS, type UfoAction, type UfoCore } from "./event";

export const UFO_COMMAND = "andrew:ufo";

export interface UfoCommandApi {
  system: { beforeEvents: { startup: { subscribe(callback: (event: StartupEvent) => void): unknown } } };
  CommandPermissionLevel: typeof CommandPermissionLevel;
  CustomCommandParamType: typeof CustomCommandParamType;
  CustomCommandStatus: typeof CustomCommandStatus;
}

export interface UfoCommandOptions {
  /** The GameTest and self-check packs register their own copy under another name. */
  name?: string;
  core(): UfoCore | undefined;
  log?(msg: string): void;
}

const isAction = (value: string): value is UfoAction => (UFO_ACTIONS as readonly string[]).includes(value);

/**
 * Entity.runCommand does not apply the entity's own permission level (BDS
 * 1.26.51.1), so the GameDirectors gate alone lets a non-operator through that
 * path. A player caller is refused here below GameDirectors; the server, a
 * command block and a non-player entity carry no level and are let through.
 */
function belowOperator(origin: CustomCommandOrigin, gameDirectors: number): boolean {
  return [origin.initiator, origin.sourceEntity].some((e: Entity | undefined) => {
    const level = e === undefined ? undefined : (e as Partial<{ commandPermissionLevel: number }>).commandPermissionLevel;
    return typeof level === "number" && level < gameDirectors;
  });
}

/** Must run at script load: custom commands register during startup only. */
export function registerUfoCommand(api: UfoCommandApi, opts: UfoCommandOptions): void {
  const name = opts.name ?? UFO_COMMAND;
  const log = opts.log ?? (() => {});
  api.system.beforeEvents.startup.subscribe((event: StartupEvent) => {
    const actionEnum = `${name}_action`;
    event.customCommandRegistry.registerEnum(actionEnum, [...UFO_ACTIONS]);
    event.customCommandRegistry.registerCommand(
      {
        name,
        description: "UFO Magnet event: come (to you, or a random Overworld player), stop, enable or disable it in this world.",
        permissionLevel: api.CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: actionEnum, type: api.CustomCommandParamType.Enum }],
      },
      (origin: CustomCommandOrigin, action: string): CustomCommandResult => {
        if (belowOperator(origin, api.CommandPermissionLevel.GameDirectors)) {
          log(`${name} ${action} refused: the caller is not an operator`);
          return { status: api.CustomCommandStatus.Failure, message: `Only an operator can use /${name}.` };
        }
        const core = opts.core();
        if (core === undefined || !isAction(action)) {
          return { status: api.CustomCommandStatus.Failure, message: `The UFO event is not ready (${action}).` };
        }
        const reply = core.command(action, origin.sourceEntity?.id);
        log(`${name} ${action} by ${origin.sourceEntity?.typeId ?? "the server"}: ${reply.message}`);
        return { status: reply.ok ? api.CustomCommandStatus.Success : api.CustomCommandStatus.Failure, message: reply.message };
      }
    );
  });
}
