import { readFileSync, writeFileSync } from "node:fs";

import { appendHistoryLines, getHistoryLines } from "../registry/history";
import type { CommandHandler } from "../utils/types";

export const historyCommand: CommandHandler = (args: string[]): void => {
  const flag = args[0];
  const path = args[1];

  if (flag === "-w") {
    if (path === undefined) {
      process.stderr.write("history: -w: missing path\n");
      return;
    }

    const targetPath = path;
    const linesToWrite = getHistoryLines();
    writeFileSync(targetPath, `${linesToWrite.join("\n")}\n`, "utf8");
    return;
  }

  if (flag === "-r") {
    if (path === undefined) {
      process.stderr.write("history: -r: missing path\n");
      return;
    }

    const targetPath = path;
    try {
      const content = readFileSync(targetPath, "utf8");
      const lines = content.split("\n").filter((line) => line.length > 0);
      appendHistoryLines(lines);
    } catch (error) {
      process.stderr.write(`history: ${String(error)}\n`);
    }
    return;
  }

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
