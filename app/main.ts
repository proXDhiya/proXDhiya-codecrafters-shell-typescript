import { closeSync, openSync, createWriteStream } from "node:fs";
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

async function runBuiltinWithRedirect(
  handler: (args: string[]) => void | Promise<void>,
  args: string[],
  stdoutRedirect?: string
): Promise<void> {
  if (!stdoutRedirect) {
    return handler(args);
  }

  const out = createWriteStream(stdoutRedirect, { flags: "w" });
  const originalWrite = (process.stdout.write as unknown) as (...writeArgs: any[]) => boolean;
  process.stdout.write = (chunk: any, encoding?: any, cb?: any) => out.write(chunk, encoding, cb);

  try {
    return handler(args);
  } finally {
    process.stdout.write = originalWrite;
    await new Promise<void>((resolve) => out.end(() => resolve()));
  }
}

rl.setPrompt("$ ");
rl.prompt();

rl.on("line", async (line: string): Promise<void> => {
  const { command, args, stdoutRedirect } = parseCommand(line);

  if (command.length === 0) {
    rl.prompt();
    return;
  }

  if (commands.has(command)) {
    await runBuiltinWithRedirect(commands.get(command)!, args, stdoutRedirect);
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
    if (!stdoutRedirect) {
      const child = spawn(resolved, args, { stdio: "inherit", argv0: command });
      child.on("error", () => resolve());
      child.on("exit", () => resolve());
      return;
    }

    const outFd = openSync(stdoutRedirect, "w");
    const child = spawn(resolved, args, { stdio: ["inherit", outFd, "inherit"], argv0: command });

    child.on("error", () => {
      closeSync(outFd);
      resolve();
    });

    child.on("exit", () => {
      closeSync(outFd);
      resolve();
    });
  });

  rl.prompt();
});

rl.on("close", (): void => {
  console.log("Exiting shell...");
  process.exit(0);
});
