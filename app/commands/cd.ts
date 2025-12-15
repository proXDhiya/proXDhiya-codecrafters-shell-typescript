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
      process.stderr.write(`cd: ${dir}: No such file or directory\n`);
      return;
    }

    targetDir = dir === "~" ? home : join(home, dir.slice(2));
  }

  try {
    process.chdir(targetDir);
  } catch {
    process.stderr.write(`cd: ${dir}: No such file or directory\n`);
  }
};
