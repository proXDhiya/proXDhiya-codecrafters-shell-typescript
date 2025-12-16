/**
  * app/commands/exit.ts
  *
  * Implements the `exit` builtin command.
  *
  * Objective:
  * - Terminate the shell process with a success exit code.
  *
  * Notes for learners:
  * - In a real shell, `exit` may accept a numeric exit status.
  * - Here we keep it intentionally minimal: `process.exit(0)`.
  */
import type { CommandHandler } from "../utils/types";

export const exitCommand: CommandHandler = (): void => {
  process.exit(0);
};
