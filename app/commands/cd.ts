/**
 * app/commands/cd.ts
 *
 * Implements the `cd` builtin command.
 *
 * Objective:
 * - Change the shell process' current working directory.
 * - Provide minimal `~` expansion (`~` and `~/...`) using `$HOME`.
 *
 * Notes for learners:
 * - `cd` must be a builtin because it needs to affect the current process.
 *   If it were an external process, directory changes would not persist.
 */
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
