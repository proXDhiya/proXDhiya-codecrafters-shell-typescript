import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const historyFilePath = resolve(process.cwd(), ".shell_history");
const persistentHistory: string[] = [];
const sessionHistory: string[] = [];

export function initHistory(): void {
  persistentHistory.length = 0;
  sessionHistory.length = 0;

  if (!existsSync(historyFilePath)) {
    return;
  }

  const content = readFileSync(historyFilePath, "utf8");
  const lines = content.split("\n").filter((line) => line.length > 0);
  persistentHistory.push(...lines);
}

export function addHistoryLine(line: string): void {
  sessionHistory.push(line);
  persistentHistory.push(line);
  appendFileSync(historyFilePath, `${line}\n`, "utf8");
}

export function getHistoryLines(): readonly string[] {
  return sessionHistory;
}

export function getPersistentHistoryLines(): readonly string[] {
  return persistentHistory;
}
