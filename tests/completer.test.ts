import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { createBuiltinCompleter } from "../app/utils/completer";
import type { CommandHandler } from "../app/utils/types";
import { mkdirSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";

describe("completer module", () => {
  let testDir: string;
  let originalPath: string | undefined;
  let builtins: Map<string, CommandHandler>;
  let bellRung: boolean;
  let printedMatches: string[];

  const ringBell = () => { bellRung = true; };
  const printMatches = (matches: string[]) => { printedMatches = matches; };

  beforeEach(() => {
    testDir = join("/tmp", `completer-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    originalPath = process.env.PATH;
    bellRung = false;
    printedMatches = [];
    
    builtins = new Map<string, CommandHandler>();
    builtins.set("echo", () => {});
    builtins.set("exit", () => {});
    builtins.set("cd", () => {});
    builtins.set("pwd", () => {});
    builtins.set("type", () => {});
  });

  afterEach(() => {
    process.env.PATH = originalPath;
    try {
      rmSync(testDir, { recursive: true });
    } catch {}
  });

  describe("createBuiltinCompleter", () => {
    test("completes single matching builtin with space", () => {
      process.env.PATH = "";
      const completer = createBuiltinCompleter(builtins, ringBell, printMatches);
      
      const [completions, line] = completer("pw");
      
      expect(completions).toEqual(["pwd "]);
      expect(line).toBe("pw");
      expect(bellRung).toBe(false);
    });

    test("completes single matching builtin 'cd'", () => {
      process.env.PATH = "";
      const completer = createBuiltinCompleter(builtins, ringBell, printMatches);
      
      const [completions, line] = completer("c");
      
      expect(completions).toEqual(["cd "]);
      expect(bellRung).toBe(false);
    });

    test("rings bell when LCP equals input (no extension possible)", () => {
      process.env.PATH = "";
      const completer = createBuiltinCompleter(builtins, ringBell, printMatches);
      
      const [completions, line] = completer("e");
      
      expect(completions).toEqual([]);
      expect(line).toBe("e");
      expect(bellRung).toBe(true);
    });

    test("prints matches on second TAB for multiple matches", () => {
      process.env.PATH = "";
      const completer = createBuiltinCompleter(builtins, ringBell, printMatches);
      
      completer("e");
      bellRung = false;
      
      const [completions, line] = completer("e");
      
      expect(completions).toEqual([]);
      expect(printedMatches).toEqual(["echo", "exit"]);
    });

    test("rings bell for no matches", () => {
      process.env.PATH = "";
      const completer = createBuiltinCompleter(builtins, ringBell, printMatches);
      
      const [completions, line] = completer("xyz");
      
      expect(completions).toEqual([]);
      expect(bellRung).toBe(true);
    });

    test("returns empty for empty input", () => {
      const completer = createBuiltinCompleter(builtins, ringBell, printMatches);
      
      const [completions, line] = completer("");
      
      expect(completions).toEqual([]);
      expect(bellRung).toBe(false);
    });

    test("returns empty for whitespace-only input", () => {
      const completer = createBuiltinCompleter(builtins, ringBell, printMatches);
      
      const [completions, line] = completer("   ");
      
      expect(completions).toEqual([]);
      expect(bellRung).toBe(false);
    });

    test("returns empty for input containing spaces", () => {
      const completer = createBuiltinCompleter(builtins, ringBell, printMatches);
      
      const [completions, line] = completer("echo hello");
      
      expect(completions).toEqual([]);
      expect(bellRung).toBe(false);
    });

    test("completes external commands from PATH", () => {
      const binDir = join(testDir, "bin");
      mkdirSync(binDir, { recursive: true });
      const execPath = join(binDir, "mycustomcmd");
      writeFileSync(execPath, "#!/bin/sh\necho hello", "utf8");
      chmodSync(execPath, 0o755);
      
      process.env.PATH = binDir;
      const completer = createBuiltinCompleter(new Map(), ringBell, printMatches);
      
      const [completions, line] = completer("mycustom");
      
      expect(completions).toEqual(["mycustomcmd "]);
    });

    test("combines builtins and external commands", () => {
      const binDir = join(testDir, "bin");
      mkdirSync(binDir, { recursive: true });
      const execPath = join(binDir, "echoplus");
      writeFileSync(execPath, "#!/bin/sh\necho hello", "utf8");
      chmodSync(execPath, 0o755);
      
      process.env.PATH = binDir;
      const completer = createBuiltinCompleter(builtins, ringBell, printMatches);
      
      const [completions, line] = completer("echo");
      
      expect(bellRung).toBe(true);
    });

    test("returns longest common prefix for multiple matches", () => {
      const binDir = join(testDir, "bin");
      mkdirSync(binDir, { recursive: true });
      
      writeFileSync(join(binDir, "testcmd1"), "#!/bin/sh", "utf8");
      writeFileSync(join(binDir, "testcmd2"), "#!/bin/sh", "utf8");
      chmodSync(join(binDir, "testcmd1"), 0o755);
      chmodSync(join(binDir, "testcmd2"), 0o755);
      
      process.env.PATH = binDir;
      const completer = createBuiltinCompleter(new Map(), ringBell, printMatches);
      
      const [completions, line] = completer("test");
      
      expect(completions).toEqual(["testcmd"]);
      expect(bellRung).toBe(true);
    });

    test("resets state after successful single completion", () => {
      process.env.PATH = "";
      const completer = createBuiltinCompleter(builtins, ringBell, printMatches);
      
      completer("e");
      completer("e");
      
      bellRung = false;
      printedMatches = [];
      
      const [completions, line] = completer("pw");
      
      expect(completions).toEqual(["pwd "]);
      expect(bellRung).toBe(false);
      expect(printedMatches).toEqual([]);
    });

    test("ignores non-executable files", () => {
      const binDir = join(testDir, "bin");
      mkdirSync(binDir, { recursive: true });
      
      const nonExecPath = join(binDir, "notexec");
      writeFileSync(nonExecPath, "not executable", "utf8");
      chmodSync(nonExecPath, 0o644);
      
      process.env.PATH = binDir;
      const completer = createBuiltinCompleter(new Map(), ringBell, printMatches);
      
      const [completions, line] = completer("notexec");
      
      expect(completions).toEqual([]);
      expect(bellRung).toBe(true);
    });

    test("ignores directories", () => {
      const binDir = join(testDir, "bin");
      mkdirSync(binDir, { recursive: true });
      mkdirSync(join(binDir, "subdir"), { recursive: true });
      
      process.env.PATH = binDir;
      const completer = createBuiltinCompleter(new Map(), ringBell, printMatches);
      
      const [completions, line] = completer("subdir");
      
      expect(completions).toEqual([]);
      expect(bellRung).toBe(true);
    });

    test("deduplicates commands found in multiple PATH directories", () => {
      const binDir1 = join(testDir, "bin1");
      const binDir2 = join(testDir, "bin2");
      mkdirSync(binDir1, { recursive: true });
      mkdirSync(binDir2, { recursive: true });
      
      writeFileSync(join(binDir1, "dupcmd"), "#!/bin/sh", "utf8");
      writeFileSync(join(binDir2, "dupcmd"), "#!/bin/sh", "utf8");
      chmodSync(join(binDir1, "dupcmd"), 0o755);
      chmodSync(join(binDir2, "dupcmd"), 0o755);
      
      process.env.PATH = `${binDir1}:${binDir2}`;
      const completer = createBuiltinCompleter(new Map(), ringBell, printMatches);
      
      const [completions, line] = completer("dupcmd");
      
      expect(completions).toEqual(["dupcmd "]);
    });

    test("sorts matches alphabetically", () => {
      const binDir = join(testDir, "bin");
      mkdirSync(binDir, { recursive: true });
      
      writeFileSync(join(binDir, "zcmd"), "#!/bin/sh", "utf8");
      writeFileSync(join(binDir, "acmd"), "#!/bin/sh", "utf8");
      writeFileSync(join(binDir, "mcmd"), "#!/bin/sh", "utf8");
      chmodSync(join(binDir, "zcmd"), 0o755);
      chmodSync(join(binDir, "acmd"), 0o755);
      chmodSync(join(binDir, "mcmd"), 0o755);
      
      process.env.PATH = binDir;
      const completer = createBuiltinCompleter(new Map(), ringBell, printMatches);
      
      completer("");
      completer("");
      
      expect(printedMatches).toEqual([]);
    });
  });
});
