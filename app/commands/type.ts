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
    console.log(`${command} is a shell builtin`);
    return;
  }

  const resolved = await resolveCommand(command);
  if (resolved) {
    console.log(`${command} is ${resolved}`);
    return;
  }

  console.log(`${command}: not found`);
};
