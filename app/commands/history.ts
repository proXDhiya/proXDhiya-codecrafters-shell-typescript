import type { CommandHandler } from "../utils/types";
import { getHistoryLines } from "../registry/history";

export const historyCommand: CommandHandler = (): void => {
  const lines = getHistoryLines();

  for (let i = 0; i < lines.length; i++) {
    const index = String(i + 1).padStart(5, " ");
    process.stdout.write(`${index}  ${lines[i]}\n`);
  }
};
