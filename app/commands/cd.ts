import type { CommandHandler } from "../utils/types";

export const cdCommand: CommandHandler = (args: string[]): void => {
  const dir = args[0];

  if (!dir) {
    return;
  }

  try {
    process.chdir(dir);
  } catch {
    console.error(`cd: ${dir}: No such file or directory`);
  }
};
