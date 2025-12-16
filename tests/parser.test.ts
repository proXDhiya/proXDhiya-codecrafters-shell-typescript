/**
 * tests/parser.test.ts
 *
 * Test suite for the parsing layer (`app/utils/parser.ts`).
 *
 * Objective:
 * - Validate that raw user input is tokenized and structured correctly.
 * - Ensure shell-like behaviors are preserved:
 *   - whitespace splitting
 *   - single/double quotes
 *   - backslash escaping
 *
 * These tests function as executable documentation for the supported grammar.
 */
import { describe, expect, test } from "bun:test";
import { parseCommand, parseLine } from "../app/utils/parser";

describe("parseCommand", () => {
  describe("basic tokenization", () => {
    test("parses simple command with no args", () => {
      const result = parseCommand("echo");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual([]);
      expect(result.redirects.stdout).toBeNull();
      expect(result.redirects.stderr).toBeNull();
    });

    test("parses command with single argument", () => {
      const result = parseCommand("echo hello");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello"]);
    });

    test("parses command with multiple arguments", () => {
      const result = parseCommand("echo hello world foo bar");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello", "world", "foo", "bar"]);
    });

    test("handles multiple spaces between tokens", () => {
      const result = parseCommand("echo   hello    world");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello", "world"]);
    });

    test("handles tabs as whitespace", () => {
      const result = parseCommand("echo\thello\tworld");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello", "world"]);
    });

    test("returns empty command for empty input", () => {
      const result = parseCommand("");
      expect(result.command).toBe("");
      expect(result.args).toEqual([]);
    });

    test("returns empty command for whitespace-only input", () => {
      const result = parseCommand("   ");
      expect(result.command).toBe("");
      expect(result.args).toEqual([]);
    });
  });

  describe("single quote handling", () => {
    test("preserves spaces inside single quotes", () => {
      const result = parseCommand("echo 'hello world'");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello world"]);
    });

    test("preserves special characters inside single quotes", () => {
      const result = parseCommand("echo 'hello\\nworld'");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello\\nworld"]);
    });

    test("handles empty single quotes", () => {
      const result = parseCommand("echo ''");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual([""]);
    });

    test("handles multiple single-quoted arguments", () => {
      const result = parseCommand("echo 'foo bar' 'baz qux'");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["foo bar", "baz qux"]);
    });

    test("preserves double quotes inside single quotes", () => {
      const result = parseCommand("echo '\"hello\"'");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(['"hello"']);
    });

    test("concatenates adjacent single-quoted and unquoted parts", () => {
      const result = parseCommand("echo 'hello'world");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["helloworld"]);
    });
  });

  describe("double quote handling", () => {
    test("preserves spaces inside double quotes", () => {
      const result = parseCommand('echo "hello world"');
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello world"]);
    });

    test("handles empty double quotes", () => {
      const result = parseCommand('echo ""');
      expect(result.command).toBe("echo");
      expect(result.args).toEqual([""]);
    });

    test("escapes backslash inside double quotes", () => {
      const result = parseCommand('echo "hello\\\\world"');
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello\\world"]);
    });

    test("escapes double quote inside double quotes", () => {
      const result = parseCommand('echo "hello\\"world"');
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(['hello"world']);
    });

    test("preserves backslash before non-special characters in double quotes", () => {
      const result = parseCommand('echo "hello\\nworld"');
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello\\nworld"]);
    });

    test("preserves single quotes inside double quotes", () => {
      const result = parseCommand("echo \"'hello'\"");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["'hello'"]);
    });

    test("concatenates adjacent double-quoted and unquoted parts", () => {
      const result = parseCommand('echo "hello"world');
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["helloworld"]);
    });
  });

  describe("backslash escaping (outside quotes)", () => {
    test("escapes space with backslash", () => {
      const result = parseCommand("echo hello\\ world");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello world"]);
    });

    test("escapes backslash with backslash", () => {
      const result = parseCommand("echo hello\\\\world");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello\\world"]);
    });

    test("escapes single quote with backslash", () => {
      const result = parseCommand("echo hello\\'world");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello'world"]);
    });

    test("escapes double quote with backslash", () => {
      const result = parseCommand('echo hello\\"world');
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(['hello"world']);
    });

    test("handles trailing backslash", () => {
      const result = parseCommand("echo hello\\");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello\\"]);
    });
  });

  describe("stdout redirection", () => {
    test("parses > redirect", () => {
      const result = parseCommand("echo hello > file.txt");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello"]);
      expect(result.redirects.stdout).toEqual({ target: "file.txt", mode: "overwrite" });
    });

    test("parses 1> redirect", () => {
      const result = parseCommand("echo hello 1> file.txt");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello"]);
      expect(result.redirects.stdout).toEqual({ target: "file.txt", mode: "overwrite" });
    });

    test("parses >> append redirect", () => {
      const result = parseCommand("echo hello >> file.txt");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello"]);
      expect(result.redirects.stdout).toEqual({ target: "file.txt", mode: "append" });
    });

    test("parses 1>> append redirect", () => {
      const result = parseCommand("echo hello 1>> file.txt");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello"]);
      expect(result.redirects.stdout).toEqual({ target: "file.txt", mode: "append" });
    });

    test("parses >file without space", () => {
      const result = parseCommand("echo hello >file.txt");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello"]);
      expect(result.redirects.stdout).toEqual({ target: "file.txt", mode: "overwrite" });
    });

    test("parses >>file without space", () => {
      const result = parseCommand("echo hello >>file.txt");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello"]);
      expect(result.redirects.stdout).toEqual({ target: "file.txt", mode: "append" });
    });

    test("parses 1>file without space", () => {
      const result = parseCommand("echo hello 1>file.txt");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello"]);
      expect(result.redirects.stdout).toEqual({ target: "file.txt", mode: "overwrite" });
    });

    test("parses 1>>file without space", () => {
      const result = parseCommand("echo hello 1>>file.txt");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello"]);
      expect(result.redirects.stdout).toEqual({ target: "file.txt", mode: "append" });
    });
  });

  describe("stderr redirection", () => {
    test("parses 2> redirect", () => {
      const result = parseCommand("echo hello 2> error.txt");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello"]);
      expect(result.redirects.stderr).toEqual({ target: "error.txt", mode: "overwrite" });
    });

    test("parses 2>> append redirect", () => {
      const result = parseCommand("echo hello 2>> error.txt");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello"]);
      expect(result.redirects.stderr).toEqual({ target: "error.txt", mode: "append" });
    });

    test("parses 2>file without space", () => {
      const result = parseCommand("echo hello 2>error.txt");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello"]);
      expect(result.redirects.stderr).toEqual({ target: "error.txt", mode: "overwrite" });
    });

    test("parses 2>>file without space", () => {
      const result = parseCommand("echo hello 2>>error.txt");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello"]);
      expect(result.redirects.stderr).toEqual({ target: "error.txt", mode: "append" });
    });
  });

  describe("combined redirects", () => {
    test("parses both stdout and stderr redirects", () => {
      const result = parseCommand("echo hello > out.txt 2> err.txt");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello"]);
      expect(result.redirects.stdout).toEqual({ target: "out.txt", mode: "overwrite" });
      expect(result.redirects.stderr).toEqual({ target: "err.txt", mode: "overwrite" });
    });

    test("handles redirects in any order", () => {
      const result = parseCommand("echo hello 2> err.txt > out.txt");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual(["hello"]);
      expect(result.redirects.stdout).toEqual({ target: "out.txt", mode: "overwrite" });
      expect(result.redirects.stderr).toEqual({ target: "err.txt", mode: "overwrite" });
    });
  });

  describe("quoted redirect operators", () => {
    test("treats quoted > as argument, not redirect", () => {
      const result = parseCommand("echo '>' file.txt");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual([">", "file.txt"]);
      expect(result.redirects.stdout).toBeNull();
    });

    test("treats escaped > as argument, not redirect", () => {
      const result = parseCommand("echo \\> file.txt");
      expect(result.command).toBe("echo");
      expect(result.args).toEqual([">", "file.txt"]);
      expect(result.redirects.stdout).toBeNull();
    });
  });
});

describe("parseLine", () => {
  describe("single command (no pipe)", () => {
    test("returns command kind for simple command", () => {
      const result = parseLine("echo hello");
      expect(result.kind).toBe("command");
      if (result.kind === "command") {
        expect(result.command.command).toBe("echo");
        expect(result.command.args).toEqual(["hello"]);
      }
    });

    test("returns command kind for empty input", () => {
      const result = parseLine("");
      expect(result.kind).toBe("command");
      if (result.kind === "command") {
        expect(result.command.command).toBe("");
      }
    });
  });

  describe("two-command pipeline", () => {
    test("parses simple two-command pipeline", () => {
      const result = parseLine("cat file.txt | wc");
      expect(result.kind).toBe("pipeline");
      if (result.kind === "pipeline") {
        expect(result.commands).toHaveLength(2);
        expect(result.commands[0].command).toBe("cat");
        expect(result.commands[0].args).toEqual(["file.txt"]);
        expect(result.commands[1].command).toBe("wc");
        expect(result.commands[1].args).toEqual([]);
      }
    });

    test("parses pipeline with arguments on both sides", () => {
      const result = parseLine("cat -n file.txt | head -n 5");
      expect(result.kind).toBe("pipeline");
      if (result.kind === "pipeline") {
        expect(result.commands).toHaveLength(2);
        expect(result.commands[0].command).toBe("cat");
        expect(result.commands[0].args).toEqual(["-n", "file.txt"]);
        expect(result.commands[1].command).toBe("head");
        expect(result.commands[1].args).toEqual(["-n", "5"]);
      }
    });

    test("trims whitespace around pipe", () => {
      const result = parseLine("cat file.txt    |    wc");
      expect(result.kind).toBe("pipeline");
      if (result.kind === "pipeline") {
        expect(result.commands[0].command).toBe("cat");
        expect(result.commands[1].command).toBe("wc");
      }
    });
  });

  describe("multi-command pipeline (3+ commands)", () => {
    test("parses three-command pipeline", () => {
      const result = parseLine("cat file | head -n 3 | wc");
      expect(result.kind).toBe("pipeline");
      if (result.kind === "pipeline") {
        expect(result.commands).toHaveLength(3);
        expect(result.commands[0].command).toBe("cat");
        expect(result.commands[1].command).toBe("head");
        expect(result.commands[2].command).toBe("wc");
      }
    });

    test("parses four-command pipeline", () => {
      const result = parseLine("ls | tail -n 5 | head -n 3 | grep foo");
      expect(result.kind).toBe("pipeline");
      if (result.kind === "pipeline") {
        expect(result.commands).toHaveLength(4);
        expect(result.commands[0].command).toBe("ls");
        expect(result.commands[1].command).toBe("tail");
        expect(result.commands[2].command).toBe("head");
        expect(result.commands[3].command).toBe("grep");
      }
    });
  });

  describe("pipe inside quotes", () => {
    test("ignores pipe inside single quotes", () => {
      const result = parseLine("echo 'hello | world'");
      expect(result.kind).toBe("command");
      if (result.kind === "command") {
        expect(result.command.command).toBe("echo");
        expect(result.command.args).toEqual(["hello | world"]);
      }
    });

    test("ignores pipe inside double quotes", () => {
      const result = parseLine('echo "hello | world"');
      expect(result.kind).toBe("command");
      if (result.kind === "command") {
        expect(result.command.command).toBe("echo");
        expect(result.command.args).toEqual(["hello | world"]);
      }
    });

    test("ignores escaped pipe", () => {
      const result = parseLine("echo hello \\| world");
      expect(result.kind).toBe("command");
      if (result.kind === "command") {
        expect(result.command.command).toBe("echo");
        expect(result.command.args).toEqual(["hello", "|", "world"]);
      }
    });
  });

  describe("edge cases", () => {
    test("returns command kind if left side of pipe is empty", () => {
      const result = parseLine("| wc");
      expect(result.kind).toBe("command");
    });

    test("returns command kind if right side of pipe is empty", () => {
      const result = parseLine("echo hello |");
      expect(result.kind).toBe("command");
    });

    test("returns command kind if middle command is empty", () => {
      const result = parseLine("cat file | | wc");
      expect(result.kind).toBe("command");
    });
  });

  describe("pipeline with redirects", () => {
    test("parses redirects in last command of pipeline", () => {
      const result = parseLine("cat file | wc > output.txt");
      expect(result.kind).toBe("pipeline");
      if (result.kind === "pipeline") {
        expect(result.commands).toHaveLength(2);
        expect(result.commands[1].redirects.stdout).toEqual({ target: "output.txt", mode: "overwrite" });
      }
    });

    test("parses stderr redirect in first command of pipeline", () => {
      const result = parseLine("cat file 2> err.txt | wc");
      expect(result.kind).toBe("pipeline");
      if (result.kind === "pipeline") {
        expect(result.commands).toHaveLength(2);
        expect(result.commands[0].redirects.stderr).toEqual({ target: "err.txt", mode: "overwrite" });
      }
    });
  });
});
