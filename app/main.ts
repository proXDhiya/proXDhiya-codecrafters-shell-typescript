import { createInterface } from "node:readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

rl.setPrompt("$ ");
rl.prompt();

rl.on("line", (line) => {
  const command = line.trim();
  if (command)
    console.error(`${command}: command not found`);
  rl.prompt();
});
