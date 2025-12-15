import type { CommandHandler } from "../utils/types";
import commands from "../registry/commands";

export const typeCommand: CommandHandler = (args: string[]): void => {
  if (args.length === 0) {
    console.error("builtin: missing argument");
    return;
  }

  const command = args[0];
  
  if (commands.has(command)) {
    console.log(`${command} is a shell builtin`);
  } else {
    console.log(`${command}: not found`);
  }
};
