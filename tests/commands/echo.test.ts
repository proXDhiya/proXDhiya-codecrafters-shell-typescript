/**
 * tests/commands/echo.test.ts
 *
 * Tests for the `echo` builtin.
 *
 * Objective:
 * - Confirm argument joining behavior and newline output.
 * - Treat this as a minimal example of testing a builtin command handler.
 *
 * @description This test suite verifies the functionality of the `echo` builtin command.
 * It checks the command's behavior with various inputs, including single and multiple arguments,
 * and ensures that it correctly handles special characters and spaces within arguments.
 */
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
