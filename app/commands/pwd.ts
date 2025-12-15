import type { CommandHandler } from "../utils/types";

export const pwdCommand: CommandHandler = (args: string[]): void => {
  console.log(process.cwd());
};
