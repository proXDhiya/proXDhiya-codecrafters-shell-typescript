import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const historyFilePath = resolve(process.cwd(), ".shell_history");
const history: string[] = [];

export function initHistory(): void {
  history.length = 0;

  if (!existsSync(historyFilePath)) {
    return;
  }

  const content = readFileSync(historyFilePath, "utf8");
  const lines = content.split("\n").filter((line) => line.length > 0);
  history.push(...lines);
}

export function addHistoryLine(line: string): void {
  history.push(line);
  appendFileSync(historyFilePath, `${line}\n`, "utf8");
}

export function getHistoryLines(): readonly string[] {
  return history;
}
