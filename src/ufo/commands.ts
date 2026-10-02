// /andrew:ufo come|stop|enable|disable (UFO §9, L0-ufoc-p004, ad04): one
// command, one enum parameter, operators only. The engine refuses anyone below
// GameDirectors before the callback runs. Replies are plain English: a
// CustomCommandResult message is a string, not rawtext (L0-ufoc-as01).
// Engine classes come in through UfoCommandApi, so node tests load this module
// without a @minecraft/server stub.

import type {
  CommandPermissionLevel,
  CustomCommandOrigin,
  CustomCommandParamType,
  CustomCommandResult,
  CustomCommandStatus,
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
        const core = opts.core();
        if (core === undefined || !isAction(action)) {
          return { status: api.CustomCommandStatus.Failure, message: `The UFO event is not ready (${action}).` };
        }
        const reply = core.command(action, origin.sourceEntity?.id);
        log(`[andrew] ${name} ${action} by ${origin.sourceEntity?.typeId ?? "the server"}: ${reply.message}`);
        return { status: reply.ok ? api.CustomCommandStatus.Success : api.CustomCommandStatus.Failure, message: reply.message };
      }
    );
  });
}
