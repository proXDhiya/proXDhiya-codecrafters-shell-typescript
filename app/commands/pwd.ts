import type { CommandHandler } from "../utils/types";

export const pwdCommand: CommandHandler = (args: string[]): void => {
  process.stdout.write(`${process.cwd()}\n`);
};
