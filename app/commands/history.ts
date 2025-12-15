import type { CommandHandler } from "../utils/types";
import { getHistoryLines } from "../registry/history";

export const historyCommand: CommandHandler = (args: string[]): void => {
  const lines = getHistoryLines();

  let startIndex = 0;
  const nRaw = args[0];
  if (nRaw !== undefined) {
    const n = Number.parseInt(nRaw, 10);
    if (Number.isFinite(n) && n > 0) {
      startIndex = Math.max(0, lines.length - n);
    }
  }

  for (let i = startIndex; i < lines.length; i++) {
    const index = String(i + 1).padStart(5, " ");
    process.stdout.write(`${index}  ${lines[i]}\n`);
  }
};
