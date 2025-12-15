import type { CommandHandler } from "../utils/types";
import { resolveCommand } from "../utils/path";
import commands from "../registry/commands";

export const typeCommand: CommandHandler = async (args: string[]): Promise<void> => {
  if (args.length === 0) {
    console.error("type: missing argument");
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
