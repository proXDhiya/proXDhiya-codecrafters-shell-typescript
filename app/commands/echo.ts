/**
  * app/commands/echo.ts
  *
  * Implements the `echo` builtin command.
  *
  * Objective:
  * - Demonstrate the simplest possible builtin command handler.
  * - Print arguments joined by spaces followed by a newline.
  *
  * Notes for learners:
  * - Builtins are functions that run inside the shell process (no `spawn`).
  * - This file shows the common `CommandHandler` signature used across builtins.
  */
import type { CommandHandler } from "../utils/types";

export const echoCommand: CommandHandler = (args: string[]): void => {
  process.stdout.write(`${args.join(" ")}\n`);
};
