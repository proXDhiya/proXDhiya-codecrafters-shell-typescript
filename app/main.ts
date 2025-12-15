import { addHistoryLine, getPersistentHistoryLines, initHistory } from "./registry/history";
import { createInterface, Interface } from "node:readline";
import { initPath, resolveCommand } from "./utils/path";
import { runParsedCommand } from "./utils/executor";
import { parseCommand } from "./utils/parser";
import commands from "./commands/index";

const rl: Interface = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
  historySize: 1000
});

initPath();
initHistory();

const rlWithHistory = rl as Interface & { history: string[] }
rlWithHistory.history = [...getPersistentHistoryLines()].reverse();

rl.setPrompt("$ ");
rl.prompt();

rl.on("line", async (line: string): Promise<void> => {
  const normalizedLine = line.endsWith("\r") ? line.slice(0, -1) : line;
  const parsed = parseCommand(normalizedLine);

  if (parsed.command.length === 0) {
    rl.prompt();
    return;
  }

  addHistoryLine(normalizedLine);

  await runParsedCommand(parsed, {
    builtins: commands,
    resolveExternal: resolveCommand
  });

  rl.prompt();
});

rl.on("close", (): void => {
  console.log("Exiting shell...");
  process.exit(0);
});
