import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import { echoCommand } from "../../app/commands/echo";

describe("echoCommand", () => {
  let stdoutOutput: string;
  let originalWrite: typeof process.stdout.write;

  beforeEach(() => {
    stdoutOutput = "";
    originalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: any) => {
      stdoutOutput += chunk;
      return true;
    }) as any;
  });

  afterEach(() => {
    process.stdout.write = originalWrite;
  });

  test("echoes single argument", () => {
    echoCommand(["hello"]);
    expect(stdoutOutput).toBe("hello\n");
  });

  test("echoes multiple arguments joined by space", () => {
    echoCommand(["hello", "world"]);
    expect(stdoutOutput).toBe("hello world\n");
  });

  test("echoes empty string for no arguments", () => {
    echoCommand([]);
    expect(stdoutOutput).toBe("\n");
  });

  test("echoes arguments with special characters", () => {
    echoCommand(["hello", "world!", "@#$%"]);
    expect(stdoutOutput).toBe("hello world! @#$%\n");
  });

  test("preserves spaces within arguments", () => {
    echoCommand(["hello world", "foo bar"]);
    expect(stdoutOutput).toBe("hello world foo bar\n");
  });
});
