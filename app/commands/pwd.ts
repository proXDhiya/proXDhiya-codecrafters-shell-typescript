/**
  * app/commands/pwd.ts
  *
  * Implements the `pwd` builtin command.
  *
  * Objective:
  * - Print the shell's current working directory.
  *
  * Notes for learners:
  * - This uses `process.cwd()` which reflects the current directory of the shell process.
  * - `cd` changes this state via `process.chdir()`.
  */
import type { CommandHandler } from "../utils/types";

export const pwdCommand: CommandHandler = (args: string[]): void => {
  process.stdout.write(`${process.cwd()}\n`);
};
