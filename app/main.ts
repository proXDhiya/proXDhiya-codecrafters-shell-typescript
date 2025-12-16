/**
  * app/main.ts
  *
  * Entry point for the shell executable.
  *
  * Responsibilities:
  * - Creates the interactive REPL using Node's `readline`.
  * - Initializes global registries (PATH + history).
  * - Reads user input, parses it into an AST-like structure (`ParsedLine`),
  *   executes it (builtins, externals, pipelines, redirects), then re-prompts.
  *
  * Data flow (high level):
  * `readline` line -> `parseLine()` -> `runParsedLine()` -> output/side effects.
  *
  * Notes for learners:
  * - This file purposefully keeps orchestration logic only; the real shell
  *   semantics live in `utils/parser.ts`, `utils/executor.ts`, and `utils/path.ts`.
  */
import { addHistoryLine, getPersistentHistoryLines, initHistory } from "./registry/history";
import { createBuiltinCompleter } from "./utils/completer";
import { createInterface, Interface } from "node:readline";
import { initPath, resolveCommand } from "./utils/path";
import { runParsedLine } from "./utils/executor";
import { parseLine } from "./utils/parser";
import commands from "./commands/index";

const rl: Interface = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
  historySize: 1000,
  completer: createBuiltinCompleter(
    commands,
    () => process.stdout.write("\x07"),
    (matches: string[]) => {
      process.stdout.write(`\n${matches.join("  ")}\n`);
      rl.prompt();
    }
  )
});

initPath();
initHistory();

const rlWithHistory = rl as Interface & { history: string[] }
rlWithHistory.history = [...getPersistentHistoryLines()].reverse();

rl.setPrompt("$ ");
rl.prompt();

rl.on("line", async (line: string): Promise<void> => {
  const normalizedLine = line.endsWith("\r") ? line.slice(0, -1) : line;
  const parsed = parseLine(normalizedLine);

  if (parsed.kind === "command" && parsed.command.command.length === 0) {
    rl.prompt();
    return;
  }

  addHistoryLine(normalizedLine);

  await runParsedLine(parsed, {
    builtins: commands,
    resolveExternal: resolveCommand
  });

  rl.prompt();
});

rl.on("close", (): void => {
  console.log("Exiting shell...");
  process.exit(0);
});
