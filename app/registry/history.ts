import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

const histfileEnv = (process.env.HISTFILE ?? "").trim();
const historyFilePath =
  histfileEnv.length > 0
    ? (isAbsolute(histfileEnv) ? histfileEnv : resolve(process.cwd(), histfileEnv))
    : resolve(process.cwd(), ".shell_history");
const writeHistoryOnExit = histfileEnv.length > 0;

const persistentHistory: string[] = [];
const sessionHistory: string[] = [];
let initialSessionHistoryLength = 0;
let exitHandlerRegistered = false;

function flushHistoryOnExit(): void {
  if (!writeHistoryOnExit) return;

  const newLines = sessionHistory.slice(initialSessionHistoryLength);
  if (newLines.length === 0) return;

  appendFileSync(historyFilePath, `${newLines.join("\n")}\n`, "utf8");
  initialSessionHistoryLength = sessionHistory.length;
}

export function initHistory(): void {
  persistentHistory.length = 0;
  sessionHistory.length = 0;
  initialSessionHistoryLength = 0;

  if (writeHistoryOnExit && !exitHandlerRegistered) {
    process.on("exit", flushHistoryOnExit);
    exitHandlerRegistered = true;
  }

  if (!existsSync(historyFilePath)) {
    return;
  }

  const content = readFileSync(historyFilePath, "utf8");
  const lines = content.split("\n").filter((line) => line.length > 0);
  persistentHistory.push(...lines);

  if (writeHistoryOnExit) {
    sessionHistory.push(...lines);
    initialSessionHistoryLength = sessionHistory.length;
  }
}

export function addHistoryLine(line: string): void {
  sessionHistory.push(line);
  persistentHistory.push(line);

  if (!writeHistoryOnExit) {
    appendFileSync(historyFilePath, `${line}\n`, "utf8");
  }
}

export function getHistoryLines(): readonly string[] {
  return sessionHistory;
}

export function getPersistentHistoryLines(): readonly string[] {
  return persistentHistory;
}

export function appendHistoryLines(lines: readonly string[]): void {
  sessionHistory.push(...lines);
  persistentHistory.push(...lines);
}

export function clearHistory(): void {
  sessionHistory.length = 0;
  persistentHistory.length = 0;
  initialSessionHistoryLength = 0;
}
