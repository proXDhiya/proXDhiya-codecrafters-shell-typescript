/**
  * app/commands/index.ts
  *
  * Builtin command wiring.
  *
  * Objective:
  * - Central place to register all builtin commands into a shared registry (`Map`).
  * - Keep the rest of the shell (executor, completer, `type`) decoupled from the
  *   individual builtin implementations.
  *
  * How it is used:
  * - `app/main.ts` imports this module to obtain the populated `commands` map.
  * - The executor checks this map first before falling back to external commands.
  */
import commands from "../registry/commands";
import { historyCommand } from "./history";
import { echoCommand } from "./echo";
import { exitCommand } from "./exit";
import { typeCommand } from "./type";
import { pwdCommand } from "./pwd";
import { cdCommand } from "./cd";

// Register all commands
commands.set("history", historyCommand);
commands.set("echo", echoCommand);
commands.set("exit", exitCommand);
commands.set("type", typeCommand);
commands.set("pwd", pwdCommand);
commands.set("cd", cdCommand);

export default commands;
