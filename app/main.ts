import { closeSync, openSync, writeSync } from "node:fs";
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
  stdoutRedirect?: string,
  stderrRedirect?: string
): Promise<void> {
  if (!stdoutRedirect && !stderrRedirect) {
    await handler(args);
    return;
  }

  const outFd = stdoutRedirect ? openSync(stdoutRedirect, "w") : undefined;
  const errFd = stderrRedirect ? openSync(stderrRedirect, "w") : undefined;
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);

  if (outFd !== undefined) {
    process.stdout.write = ((chunk: any, _encoding?: any, cb?: any) => {
      writeSync(outFd, chunk);
      if (typeof cb === "function") cb();
      return true;
    }) as any;
  }

  if (errFd !== undefined) {
    process.stderr.write = ((chunk: any, _encoding?: any, cb?: any) => {
      writeSync(errFd, chunk);
      if (typeof cb === "function") cb();
      return true;
    }) as any;
  }

  try {
    await handler(args);
  } finally {
    process.stdout.write = originalStdoutWrite as any;
    process.stderr.write = originalStderrWrite as any;
    if (outFd !== undefined) closeSync(outFd);
    if (errFd !== undefined) closeSync(errFd);
  }
}

rl.setPrompt("$ ");
rl.prompt();

rl.on("line", async (line: string): Promise<void> => {
  const { command, args, stdoutRedirect, stderrRedirect } = parseCommand(line);

  if (command.length === 0) {
    rl.prompt();
    return;
  }

  if (commands.has(command)) {
    await runBuiltinWithRedirect(commands.get(command)!, args, stdoutRedirect, stderrRedirect);
    rl.prompt();
    return;
  }

  const resolved = await resolveCommand(command);
  if (!resolved) {
    await runBuiltinWithRedirect(
      () => {
        process.stderr.write(`${command}: command not found\n`);
      },
      [],
      undefined,
      stderrRedirect
    );
    rl.prompt();
    return;
  }

  await new Promise<void>((resolve) => {
    const outFd = stdoutRedirect ? openSync(stdoutRedirect, "w") : undefined;
    const errFd = stderrRedirect ? openSync(stderrRedirect, "w") : undefined;

    const child = spawn(resolved, args, {
      stdio: ["inherit", outFd ?? "inherit", errFd ?? "inherit"],
      argv0: command
    });

    const finish = (): void => {
      if (outFd !== undefined) closeSync(outFd);
      if (errFd !== undefined) closeSync(errFd);
      resolve();
    };

    child.on("error", finish);
    child.on("close", finish);
  });

  rl.prompt();
});

rl.on("close", (): void => {
  console.log("Exiting shell...");
  process.exit(0);
});
