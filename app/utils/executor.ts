import { spawn } from "node:child_process";
import { closeSync, openSync, writeSync } from "node:fs";
import { PassThrough, Writable } from "node:stream";

import type { CommandHandler, ParsedCommand, ParsedLine, Redirect, Redirects } from "./types";

type RunParsedCommandOptions = {
  builtins: Map<string, CommandHandler>;
  resolveExternal: (command: string) => Promise<string | null>;
};

function openRedirectFd(redirect: Redirect): number | undefined {
  if (redirect === null) return undefined;
  const flags = redirect.mode === "append" ? "a" : "w";
  return openSync(redirect.target, flags);
}

function withRedirects(
  redirects: Redirects,
  fn: () => void | Promise<void>
): Promise<void> {
  if (redirects.stdout === null && redirects.stderr === null) {
    return Promise.resolve(fn());
  }

  const outFd = openRedirectFd(redirects.stdout);
  const errFd = openRedirectFd(redirects.stderr);

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

  return Promise.resolve(fn()).finally(() => {
    process.stdout.write = originalStdoutWrite as any;
    process.stderr.write = originalStderrWrite as any;
    if (outFd !== undefined) closeSync(outFd);
    if (errFd !== undefined) closeSync(errFd);
  });
}

function waitForChild(child: ReturnType<typeof spawn>): Promise<void> {
  return new Promise<void>((resolve) => {
    const finish = (): void => resolve();
    child.on("error", finish);
    child.on("close", finish);
  });
}

function createDevNullWritable(): Writable {
  return new Writable({
    write(_chunk, _encoding, cb) {
      cb();
    }
  });
}

function drainReadable(readable: NodeJS.ReadableStream): Promise<void> {
  return new Promise<void>((resolve) => {
    readable.on("error", () => resolve());
    readable.on("end", () => resolve());
    readable.on("close", () => resolve());
    readable.resume();
  });
}

function withPatchedStdoutStderr(
  stdout: NodeJS.WritableStream,
  stderrRedirect: Redirect,
  fn: () => void | Promise<void>
): Promise<void> {
  const errFd = openRedirectFd(stderrRedirect);
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);

  process.stdout.write = ((chunk: any, encoding?: any, cb?: any) => {
    return stdout.write(chunk, encoding, cb);
  }) as any;

  if (errFd !== undefined) {
    process.stderr.write = ((chunk: any, _encoding?: any, cb?: any) => {
      writeSync(errFd, chunk);
      if (typeof cb === "function") cb();
      return true;
    }) as any;
  }

  return Promise.resolve(fn()).finally(() => {
    process.stdout.write = originalStdoutWrite as any;
    process.stderr.write = originalStderrWrite as any;
    if (errFd !== undefined) closeSync(errFd);
  });
}

async function runExternalPipeline(
  leftResolvedPath: string,
  leftArgv0: string,
  leftArgs: string[],
  leftRedirects: Redirects,
  rightResolvedPath: string,
  rightArgv0: string,
  rightArgs: string[],
  rightRedirects: Redirects
): Promise<void> {
  const leftErrFd = openRedirectFd(leftRedirects.stderr);
  const rightOutFd = openRedirectFd(rightRedirects.stdout);
  const rightErrFd = openRedirectFd(rightRedirects.stderr);

  const left = spawn(leftResolvedPath, leftArgs, {
    stdio: ["inherit", "pipe", leftErrFd ?? "inherit"],
    argv0: leftArgv0
  });

  const right = spawn(rightResolvedPath, rightArgs, {
    stdio: ["pipe", rightOutFd ?? "inherit", rightErrFd ?? "inherit"],
    argv0: rightArgv0
  });

  left.stdout!.on("error", () => {
  });
  right.stdin!.on("error", () => {
  });

  left.stdout!.pipe(right.stdin!);

  right.on("close", () => {
    try {
      left.kill();
    } catch {
    }
  });

  await Promise.all([waitForChild(left), waitForChild(right)]).finally(() => {
    if (leftErrFd !== undefined) closeSync(leftErrFd);
    if (rightOutFd !== undefined) closeSync(rightOutFd);
    if (rightErrFd !== undefined) closeSync(rightErrFd);
  });
}

async function runExternalCommand(
  resolvedPath: string,
  argv0: string,
  args: string[],
  redirects: Redirects
): Promise<void> {
  await new Promise<void>((resolve) => {
    const outFd = openRedirectFd(redirects.stdout);
    const errFd = openRedirectFd(redirects.stderr);

    const child = spawn(resolvedPath, args, {
      stdio: ["inherit", outFd ?? "inherit", errFd ?? "inherit"],
      argv0
    });

    const finish = (): void => {
      if (outFd !== undefined) closeSync(outFd);
      if (errFd !== undefined) closeSync(errFd);
      resolve();
    };

    child.on("error", finish);
    child.on("close", finish);
  });
}

export async function runParsedCommand(parsed: ParsedCommand, options: RunParsedCommandOptions): Promise<void> {
  if (options.builtins.has(parsed.command)) {
    const handler = options.builtins.get(parsed.command)!;
    await withRedirects(parsed.redirects, () => handler(parsed.args));
    return;
  }

  const resolved = await options.resolveExternal(parsed.command);
  if (resolved === null) {
    await withRedirects({ stdout: null, stderr: parsed.redirects.stderr }, () => {
      process.stderr.write(`${parsed.command}: command not found\n`);
    });
    return;
  }

  await runExternalCommand(resolved, parsed.command, parsed.args, parsed.redirects);
}

export async function runParsedLine(parsed: ParsedLine, options: RunParsedCommandOptions): Promise<void> {
  if (parsed.kind === "command") {
    await runParsedCommand(parsed.command, options);
    return;
  }

  const commands = parsed.commands;
  if (commands.length === 1) {
    await runParsedCommand(commands[0]!, options);
    return;
  }

  const stageChildren: Array<ReturnType<typeof spawn> | null> = new Array(commands.length).fill(null);
  const killUpstream = (stageIndex: number): void => {
    for (let i = 0; i < stageIndex; i++) {
      const child = stageChildren[i];
      if (!child) continue;
      try {
        child.kill();
      } catch {
      }
    }
  };

  let prevOutput: NodeJS.ReadableStream | null = null;
  const stagePromises: Promise<void>[] = [];

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i]!;
    const isLast = i === commands.length - 1;
    const builtin = options.builtins.get(cmd.command);

    if (builtin) {
      if (prevOutput) {
        const devNull = createDevNullWritable();
        prevOutput.pipe(devNull);
        stagePromises.push(drainReadable(prevOutput));
      }

      if (isLast) {
        const p = withRedirects(cmd.redirects, () => builtin(cmd.args)).finally(() => {
          killUpstream(i);
        });
        stagePromises.push(p);
        prevOutput = null;
        continue;
      }

      const outStream = new PassThrough();
      const p = withPatchedStdoutStderr(outStream, cmd.redirects.stderr, () => builtin(cmd.args))
        .finally(() => {
          try {
            outStream.end();
          } catch {
          }
          killUpstream(i);
        });
      stagePromises.push(p);
      prevOutput = outStream;
      continue;
    }

    const resolved = await options.resolveExternal(cmd.command);
    if (resolved === null) {
      await withRedirects({ stdout: null, stderr: cmd.redirects.stderr }, () => {
        process.stderr.write(`${cmd.command}: command not found\n`);
      });
      killUpstream(i);
      return;
    }

    const errFd = openRedirectFd(cmd.redirects.stderr);
    const outFd = isLast ? openRedirectFd(cmd.redirects.stdout) : undefined;

    const child: ReturnType<typeof spawn> = spawn(resolved, cmd.args, {
      stdio: [prevOutput ? "pipe" : "inherit", isLast ? (outFd ?? "inherit") : "pipe", errFd ?? "inherit"],
      argv0: cmd.command
    });

    stageChildren[i] = child;

    if (prevOutput) {
      child.stdin!.on("error", () => {
      });
      prevOutput.on("error", () => {
      });
      prevOutput.pipe(child.stdin!);
    }

    const p = waitForChild(child)
      .finally(() => {
        if (errFd !== undefined) closeSync(errFd);
        if (outFd !== undefined) closeSync(outFd);
        killUpstream(i);
      });
    stagePromises.push(p);

    prevOutput = isLast ? null : child.stdout!;
  }

  await Promise.all(stagePromises);
}
