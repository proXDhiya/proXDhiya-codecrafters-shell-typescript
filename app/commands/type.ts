/**
  * app/commands/type.ts
  *
  * Implements the `type` builtin command.
  *
  * Objective:
  * - Teach how a shell decides what will run when you type a command name.
  * - Report whether a given name resolves to:
  *   - a shell builtin, or
  *   - an external executable found via `$PATH`, or
  *   - nothing (not found).
  *
  * Implementation notes:
  * - Builtins are looked up in the shared command registry.
  * - External commands are resolved via `utils/path.ts` (executable checks + PATH search).
  */
import type { CommandHandler } from "../utils/types";
import { resolveCommand } from "../utils/path";
import commands from "../registry/commands";

export const typeCommand: CommandHandler = async (args: string[]): Promise<void> => {
  if (args.length === 0) {
    process.stderr.write("type: missing argument\n");
    return;
  }

  const command = args[0];
  
  if (commands.has(command)) {
    process.stdout.write(`${command} is a shell builtin\n`);
    return;
  }

  const resolved = await resolveCommand(command);
  if (resolved) {
    process.stdout.write(`${command} is ${resolved}\n`);
    return;
  }

  process.stdout.write(`${command}: not found\n`);
};
