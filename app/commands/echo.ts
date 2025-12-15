import type { CommandHandler } from "../utils/types";

export const echoCommand: CommandHandler = (args: string[]): void => {
  let result: string = args.join(" ");
  if (result.startsWith("\"") && result.endsWith("\"")) {
    result = result.slice(1, -1);
  }
  console.log(result);
};
