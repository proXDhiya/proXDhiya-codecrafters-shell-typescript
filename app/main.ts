import { createInterface, Interface } from "node:readline";

const rl: Interface = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

rl.setPrompt("$ ");
rl.prompt();

type CommandHandler = (args: string[]) => void;
const commands: Map<string, CommandHandler> = new Map();

function parseCommand(input: string): { command: string; args: string[] } {
  const [command, ...args]: string[] = input.trim().split(/\s+/);
  return { command, args };
}

function executeCommand(command: string, args: string[]): void {
  if (commands.has(command)) {
    commands.get(command)!(args);
  } else {
    console.error(`${command}: command not found`);
  }
}

commands.set("echo", (args: string[]): void => {
  let result: string = args.join(" ");
  if (result.startsWith("\"") && result.endsWith("\"")) {
    result = result.slice(1, -1);
  }
  console.log(result);
});

rl.on("line", (line: string): void => {
  const { command, args }: { command: string; args: string[] } = parseCommand(line);
  if (command.toLowerCase() === "exit") {
    rl.close();
    process.exit(0);
  }
  executeCommand(command, args);
  rl.prompt();
});
