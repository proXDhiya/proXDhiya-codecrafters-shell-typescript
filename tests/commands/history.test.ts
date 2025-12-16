import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { historyCommand } from "../../app/commands/history";
import { addHistoryLine, clearHistory, getHistoryLines } from "../../app/registry/history";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

describe("historyCommand", () => {
  let stdoutOutput: string;
  let stderrOutput: string;
  let originalStdoutWrite: typeof process.stdout.write;
  let originalStderrWrite: typeof process.stderr.write;
  let testDir: string;

  beforeEach(() => {
    stdoutOutput = "";
    stderrOutput = "";
    originalStdoutWrite = process.stdout.write.bind(process.stdout);
    originalStderrWrite = process.stderr.write.bind(process.stderr);
    testDir = join("/tmp", `history-test-${Date.now()}`);
    
    process.stdout.write = ((chunk: any) => {
      stdoutOutput += chunk;
      return true;
    }) as any;
    
    process.stderr.write = ((chunk: any) => {
      stderrOutput += chunk;
      return true;
    }) as any;

    clearHistory();
  });

  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    try {
      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true });
      }
    } catch {}
  });

  describe("display history", () => {
    test("displays empty history", () => {
      historyCommand([]);
      expect(stdoutOutput).toBe("");
    });

    test("displays single history entry with index", () => {
      addHistoryLine("echo hello");
      historyCommand([]);
      expect(stdoutOutput).toBe("    1  echo hello\n");
    });

    test("displays multiple history entries with indices", () => {
      addHistoryLine("echo hello");
      addHistoryLine("pwd");
      addHistoryLine("ls -la");
      historyCommand([]);
      expect(stdoutOutput).toBe("    1  echo hello\n    2  pwd\n    3  ls -la\n");
    });

    test("displays last N entries when number provided", () => {
      addHistoryLine("cmd1");
      addHistoryLine("cmd2");
      addHistoryLine("cmd3");
      addHistoryLine("cmd4");
      addHistoryLine("cmd5");
      historyCommand(["2"]);
      expect(stdoutOutput).toBe("    4  cmd4\n    5  cmd5\n");
    });

    test("displays all entries when N is larger than history", () => {
      addHistoryLine("cmd1");
      addHistoryLine("cmd2");
      historyCommand(["10"]);
      expect(stdoutOutput).toBe("    1  cmd1\n    2  cmd2\n");
    });
  });

  describe("-w flag (write)", () => {
    test("writes history to file", () => {
      const filePath = join("/tmp", `history-write-${Date.now()}.txt`);
      addHistoryLine("echo hello");
      addHistoryLine("pwd");
      
      historyCommand(["-w", filePath]);
      
      const content = readFileSync(filePath, "utf8");
      expect(content).toBe("echo hello\npwd\n");
      
      rmSync(filePath);
    });

    test("outputs error when path missing for -w", () => {
      historyCommand(["-w"]);
      expect(stderrOutput).toBe("history: -w: missing path\n");
    });
  });

  describe("-r flag (read)", () => {
    test("reads history from file", () => {
      const filePath = join("/tmp", `history-read-${Date.now()}.txt`);
      writeFileSync(filePath, "cmd1\ncmd2\ncmd3\n", "utf8");
      
      historyCommand(["-r", filePath]);
      
      const lines = getHistoryLines();
      expect(lines).toEqual(["cmd1", "cmd2", "cmd3"]);
      
      rmSync(filePath);
    });

    test("outputs error when path missing for -r", () => {
      historyCommand(["-r"]);
      expect(stderrOutput).toBe("history: -r: missing path\n");
    });

    test("outputs error when file does not exist for -r", () => {
      historyCommand(["-r", "/nonexistent/file.txt"]);
      expect(stderrOutput).toContain("history:");
    });
  });

  describe("-a flag (append)", () => {
    test("appends new history to file", () => {
      const filePath = join("/tmp", `history-append-${Date.now()}.txt`);
      writeFileSync(filePath, "", "utf8");
      
      addHistoryLine("cmd1");
      historyCommand(["-a", filePath]);
      
      addHistoryLine("cmd2");
      historyCommand(["-a", filePath]);
      
      const content = readFileSync(filePath, "utf8");
      expect(content).toBe("cmd1\ncmd2\n");
      
      rmSync(filePath);
    });

    test("outputs error when path missing for -a", () => {
      historyCommand(["-a"]);
      expect(stderrOutput).toBe("history: -a: missing path\n");
    });
  });
});
