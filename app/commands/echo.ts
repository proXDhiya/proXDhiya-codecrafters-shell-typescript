import type { CommandHandler } from "../utils/types";

export const echoCommand: CommandHandler = (args: string[]): void => {
  process.stdout.write(`${args.join(" ")}\n`);
};
