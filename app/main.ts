import { createInterface, Interface } from "node:readline";
import { initPath, resolveCommand } from "./utils/path";
import { runParsedCommand } from "./utils/executor";
import { parseCommand } from "./utils/parser";
import commands from "./commands/index";

const rl: Interface = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

initPath();

rl.setPrompt("$ ");
rl.prompt();

rl.on("line", async (line: string): Promise<void> => {
  const parsed = parseCommand(line);

  if (parsed.command.length === 0) {
    rl.prompt();
    return;
  }

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
