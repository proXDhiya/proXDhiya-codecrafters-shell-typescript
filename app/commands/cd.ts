import type { CommandHandler } from "../utils/types";
import { join } from "node:path";

export const cdCommand: CommandHandler = (args: string[]): void => {
  const dir = args[0];

  if (!dir) {
    return;
  }

  let targetDir = dir;
  if (dir === "~" || dir.startsWith("~/")) {
    const home = process.env.HOME;
    if (!home) {
      console.error(`cd: ${dir}: No such file or directory`);
      return;
    }

    targetDir = dir === "~" ? home : join(home, dir.slice(2));
  }

  try {
    process.chdir(targetDir);
  } catch {
    console.error(`cd: ${dir}: No such file or directory`);
  }
};
