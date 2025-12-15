import type { CommandHandler } from "../utils/types";

export const echoCommand: CommandHandler = (args: string[]): void => {
  console.log(args.join(" "));
};
