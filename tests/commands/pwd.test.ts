import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { pwdCommand } from "../../app/commands/pwd";

describe("pwdCommand", () => {
  let stdoutOutput: string;
  let originalWrite: typeof process.stdout.write;
  let originalCwd: string;

  beforeEach(() => {
    stdoutOutput = "";
    originalWrite = process.stdout.write.bind(process.stdout);
    originalCwd = process.cwd();
    process.stdout.write = ((chunk: any) => {
      stdoutOutput += chunk;
      return true;
    }) as any;
  });

  afterEach(() => {
    process.stdout.write = originalWrite;
    process.chdir(originalCwd);
  });

  test("outputs current working directory", () => {
    pwdCommand([]);
    expect(stdoutOutput).toBe(`${process.cwd()}\n`);
  });

  test("outputs updated directory after chdir", () => {
    const newDir = "/tmp";
    process.chdir(newDir);
    pwdCommand([]);
    expect(stdoutOutput).toBe(`${newDir}\n`);
  });

  test("ignores any arguments", () => {
    pwdCommand(["ignored", "arguments"]);
    expect(stdoutOutput).toBe(`${process.cwd()}\n`);
  });
});
