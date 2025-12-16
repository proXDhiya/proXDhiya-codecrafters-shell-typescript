import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { typeCommand } from "../../app/commands/type";
import "../../app/commands/index";
import { initPath } from "../../app/utils/path";

describe("typeCommand", () => {
  let stdoutOutput: string;
  let stderrOutput: string;
  let originalStdoutWrite: typeof process.stdout.write;
  let originalStderrWrite: typeof process.stderr.write;

  beforeEach(() => {
    stdoutOutput = "";
    stderrOutput = "";
    originalStdoutWrite = process.stdout.write.bind(process.stdout);
    originalStderrWrite = process.stderr.write.bind(process.stderr);
    
    initPath();
    
    process.stdout.write = ((chunk: any) => {
      stdoutOutput += chunk;
      return true;
    }) as any;
    
    process.stderr.write = ((chunk: any) => {
      stderrOutput += chunk;
      return true;
    }) as any;
  });

  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  });

  test("reports echo as shell builtin", async () => {
    await typeCommand(["echo"]);
    expect(stdoutOutput).toBe("echo is a shell builtin\n");
  });

  test("reports cd as shell builtin", async () => {
    await typeCommand(["cd"]);
    expect(stdoutOutput).toBe("cd is a shell builtin\n");
  });

  test("reports pwd as shell builtin", async () => {
    await typeCommand(["pwd"]);
    expect(stdoutOutput).toBe("pwd is a shell builtin\n");
  });

  test("reports exit as shell builtin", async () => {
    await typeCommand(["exit"]);
    expect(stdoutOutput).toBe("exit is a shell builtin\n");
  });

  test("reports type as shell builtin", async () => {
    await typeCommand(["type"]);
    expect(stdoutOutput).toBe("type is a shell builtin\n");
  });

  test("reports history as shell builtin", async () => {
    await typeCommand(["history"]);
    expect(stdoutOutput).toBe("history is a shell builtin\n");
  });

  test("reports path for external command", async () => {
    await typeCommand(["ls"]);
    expect(stdoutOutput).toMatch(/^ls is .+\/ls\n$/);
  });

  test("reports not found for unknown command", async () => {
    await typeCommand(["nonexistent_command_xyz"]);
    expect(stdoutOutput).toBe("nonexistent_command_xyz: not found\n");
  });

  test("outputs error when no argument provided", async () => {
    await typeCommand([]);
    expect(stderrOutput).toBe("type: missing argument\n");
  });
});
