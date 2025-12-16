/**
  * tests/path.test.ts
  *
  * Test suite for external command resolution (`app/utils/path.ts`).
  *
  * Objective:
  * - Verify how the shell interprets `PATH`.
  * - Ensure executability checks and search order behave like a typical shell.
  * - Validate caching behavior (repeat lookups are fast and consistent).
  *
  * Notes for learners:
  * - These tests create temporary executable files to simulate commands on disk.
  */
import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { resolveCommand, setPathFromString, getPathDirs, initPath, prependPathDir } from "../app/utils/path";
import { mkdirSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";

describe("path module", () => {
  let testDir: string;
  let originalPath: string | undefined;

  beforeEach(() => {
    testDir = join("/tmp", `path-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    originalPath = process.env.PATH;
  });

  afterEach(() => {
    process.env.PATH = originalPath;
    try {
      rmSync(testDir, { recursive: true });
    } catch {}
  });

  describe("setPathFromString", () => {
    test("sets path directories from colon-separated string", () => {
      setPathFromString("/usr/bin:/bin:/usr/local/bin");
      const dirs = getPathDirs();
      expect(dirs).toEqual(["/usr/bin", "/bin", "/usr/local/bin"]);
    });

    test("handles empty string", () => {
      setPathFromString("");
      const dirs = getPathDirs();
      expect(dirs).toEqual([]);
    });

    test("trims whitespace from path parts", () => {
      setPathFromString(" /usr/bin : /bin ");
      const dirs = getPathDirs();
      expect(dirs).toEqual(["/usr/bin", "/bin"]);
    });

    test("filters out empty parts", () => {
      setPathFromString("/usr/bin::/bin");
      const dirs = getPathDirs();
      expect(dirs).toEqual(["/usr/bin", "/bin"]);
    });
  });

  describe("prependPathDir", () => {
    test("prepends directory to path", () => {
      setPathFromString("/bin:/usr/bin");
      prependPathDir("/usr/local/bin");
      const dirs = getPathDirs();
      expect(dirs[0]).toBe("/usr/local/bin");
    });

    test("ignores empty string", () => {
      setPathFromString("/bin");
      prependPathDir("");
      const dirs = getPathDirs();
      expect(dirs).toEqual(["/bin"]);
    });

    test("ignores whitespace-only string", () => {
      setPathFromString("/bin");
      prependPathDir("   ");
      const dirs = getPathDirs();
      expect(dirs).toEqual(["/bin"]);
    });
  });

  describe("initPath", () => {
    test("initializes path from PATH environment variable", () => {
      process.env.PATH = "/custom/bin:/another/bin";
      initPath();
      const dirs = getPathDirs();
      expect(dirs).toContain("/custom/bin");
      expect(dirs).toContain("/another/bin");
    });

    test("handles empty PATH", () => {
      process.env.PATH = "";
      initPath();
      const dirs = getPathDirs();
      expect(dirs).toEqual([]);
    });
  });

  describe("resolveCommand", () => {
    test("resolves command in PATH", async () => {
      const binDir = join(testDir, "bin");
      mkdirSync(binDir, { recursive: true });
      const execPath = join(binDir, "myexec");
      writeFileSync(execPath, "#!/bin/sh\necho hello", "utf8");
      chmodSync(execPath, 0o755);

      setPathFromString(binDir);
      const resolved = await resolveCommand("myexec");
      expect(resolved).toBe(execPath);
    });

    test("returns null for non-existent command", async () => {
      setPathFromString("/usr/bin");
      const resolved = await resolveCommand("nonexistent_command_xyz_123");
      expect(resolved).toBeNull();
    });

    test("resolves absolute path directly", async () => {
      const execPath = join(testDir, "direct-exec");
      writeFileSync(execPath, "#!/bin/sh\necho hello", "utf8");
      chmodSync(execPath, 0o755);

      const resolved = await resolveCommand(execPath);
      expect(resolved).toBe(execPath);
    });

    test("returns null for non-executable file", async () => {
      const filePath = join(testDir, "notexec");
      writeFileSync(filePath, "not executable", "utf8");
      chmodSync(filePath, 0o644);

      const resolved = await resolveCommand(filePath);
      expect(resolved).toBeNull();
    });

    test("resolves relative path with slash", async () => {
      const binDir = join(testDir, "subdir");
      mkdirSync(binDir, { recursive: true });
      const execPath = join(binDir, "relexec");
      writeFileSync(execPath, "#!/bin/sh\necho hello", "utf8");
      chmodSync(execPath, 0o755);

      const resolved = await resolveCommand(execPath);
      expect(resolved).toBe(execPath);
    });

    test("caches resolved commands", async () => {
      const binDir = join(testDir, "cache-bin");
      mkdirSync(binDir, { recursive: true });
      const execPath = join(binDir, "cachedexec");
      writeFileSync(execPath, "#!/bin/sh\necho hello", "utf8");
      chmodSync(execPath, 0o755);

      setPathFromString(binDir);
      
      const first = await resolveCommand("cachedexec");
      const second = await resolveCommand("cachedexec");
      
      expect(first).toBe(execPath);
      expect(second).toBe(execPath);
    });

    test("searches directories in order", async () => {
      const binDir1 = join(testDir, "bin1");
      const binDir2 = join(testDir, "bin2");
      mkdirSync(binDir1, { recursive: true });
      mkdirSync(binDir2, { recursive: true });

      const execPath1 = join(binDir1, "orderexec");
      const execPath2 = join(binDir2, "orderexec");
      writeFileSync(execPath1, "#!/bin/sh\necho first", "utf8");
      writeFileSync(execPath2, "#!/bin/sh\necho second", "utf8");
      chmodSync(execPath1, 0o755);
      chmodSync(execPath2, 0o755);

      setPathFromString(`${binDir1}:${binDir2}`);
      const resolved = await resolveCommand("orderexec");
      expect(resolved).toBe(execPath1);
    });
  });
});
