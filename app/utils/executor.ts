import { spawn } from "node:child_process";
import { closeSync, openSync, writeSync } from "node:fs";

import type { CommandHandler, ParsedCommand, Redirect, Redirects } from "./types";

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
