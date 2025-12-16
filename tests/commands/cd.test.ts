/**
 * tests/commands/cd.test.ts
 *
 * Tests for the `cd` builtin.
 *
 * Objective:
 * - Ensure directory changes update the shell process working directory.
 * - Validate `~` expansion behavior and error output for invalid paths.
 *
 * @description This test suite covers the functionality of the `cd` builtin.
 * It checks for correct directory changes, `~` expansion, and error handling.
 */
import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { cdCommand } from "../../app/commands/cd";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

describe("cdCommand", () => {
  let stderrOutput: string;
  let originalStderrWrite: typeof process.stderr.write;
  let originalCwd: string;
  let testDir: string;

  beforeEach(() => {
    stderrOutput = "";
    originalStderrWrite = process.stderr.write.bind(process.stderr);
    originalCwd = process.cwd();
    testDir = join("/tmp", `cd-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    
    process.stderr.write = ((chunk: any) => {
      stderrOutput += chunk;
      return true;
    }) as any;
  });

  afterEach(() => {
    process.stderr.write = originalStderrWrite;
    process.chdir(originalCwd);
    try {
      rmSync(testDir, { recursive: true });
    } catch {}
  });

  test("changes to specified directory", () => {
    cdCommand([testDir]);
    expect(process.cwd()).toBe(testDir);
    expect(stderrOutput).toBe("");
  });

  test("does nothing when no argument provided", () => {
    cdCommand([]);
    expect(process.cwd()).toBe(originalCwd);
    expect(stderrOutput).toBe("");
  });

  test("outputs error for non-existent directory", () => {
    cdCommand(["/nonexistent/path/that/does/not/exist"]);
    expect(process.cwd()).toBe(originalCwd);
    expect(stderrOutput).toContain("No such file or directory");
  });

  test("changes to home directory with ~", () => {
    const home = process.env.HOME;
    if (home) {
      cdCommand(["~"]);
      expect(process.cwd()).toBe(home);
      expect(stderrOutput).toBe("");
    }
  });

  test("changes to subdirectory of home with ~/path", () => {
    const home = process.env.HOME;
    if (home) {
      const subDir = join(home, ".");
      cdCommand(["~/."]);
      expect(process.cwd()).toBe(home);
      expect(stderrOutput).toBe("");
    }
  });

  test("outputs error when HOME not set for ~", () => {
    const originalHome = process.env.HOME;
    delete process.env.HOME;
    
    cdCommand(["~"]);
    expect(stderrOutput).toContain("No such file or directory");
    
    process.env.HOME = originalHome;
  });

  test("handles relative paths", () => {
    process.chdir("/tmp");
    mkdirSync(join("/tmp", "relative-test-dir"), { recursive: true });
    
    cdCommand(["relative-test-dir"]);
    expect(process.cwd()).toBe("/tmp/relative-test-dir");
    
    rmSync(join("/tmp", "relative-test-dir"), { recursive: true });
  });
});
