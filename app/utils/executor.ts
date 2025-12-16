import { spawn } from "node:child_process";
import { closeSync, openSync, writeSync } from "node:fs";

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

  const left = parsed.left;
  const right = parsed.right;

  const leftResolved = await options.resolveExternal(left.command);
  if (leftResolved === null) {
    await withRedirects({ stdout: null, stderr: left.redirects.stderr }, () => {
      process.stderr.write(`${left.command}: command not found\n`);
    });
    return;
  }

  const rightResolved = await options.resolveExternal(right.command);
  if (rightResolved === null) {
    await withRedirects({ stdout: null, stderr: right.redirects.stderr }, () => {
      process.stderr.write(`${right.command}: command not found\n`);
    });
    return;
  }

  await runExternalPipeline(
    leftResolved,
    left.command,
    left.args,
    left.redirects,
    rightResolved,
    right.command,
    right.args,
    right.redirects
  );
}
