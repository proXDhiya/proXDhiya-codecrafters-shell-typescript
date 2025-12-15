import { createInterface, Interface } from "node:readline";
import { initPath, resolveCommand } from "./utils/path";
import { parseCommand } from "./utils/parser";
import { spawn } from "node:child_process";
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
  const { command, args } = parseCommand(line);

  if (command.length === 0) {
    rl.prompt();
    return;
  }

  if (commands.has(command)) {
    await commands.get(command)!(args);
    rl.prompt();
    return;
  }

  const resolved = await resolveCommand(command);
  if (!resolved) {
    console.error(`${command}: command not found`);
    rl.prompt();
    return;
  }

  await new Promise<void>((resolve) => {
    const child = spawn(resolved, args, { stdio: "inherit" });
    child.on("error", () => resolve());
    child.on("exit", () => resolve());
  });

  rl.prompt();
});

rl.on("close", (): void => {
  console.log("Exiting shell...");
  process.exit(0);
});
