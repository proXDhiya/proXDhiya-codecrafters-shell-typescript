import type { CommandHandler } from "../utils/types";

export const exitCommand: CommandHandler = (): void => {
  process.exit(0);
};
