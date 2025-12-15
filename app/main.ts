import { createInterface, Interface } from "node:readline";
import { commands } from "./commands/index";
import { parseCommand } from "./utils/parser";

const rl: Interface = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

rl.setPrompt("$ ");
rl.prompt();

rl.on("line", (line: string): void => {
  const { command, args } = parseCommand(line);
  if (commands.has(command)) {
    commands.get(command)!(args);
  } else {
    console.error(`${command}: command not found`);
  }
  rl.prompt();
});

rl.on("close", (): void => {
  console.log("Exiting shell...");
  process.exit(0);
});
