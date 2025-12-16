import { readdirSync } from "node:fs";

import type { CommandHandler } from "./types";

function findMatches(input: string, builtins: Map<string, CommandHandler>): string[] {
  const builtinMatches = [...builtins.keys()].filter((cmd) => cmd.startsWith(input));

  const executableMatches = new Set<string>();
  const pathEnv = process.env.PATH ?? "";
  const pathDirs = pathEnv.split(":");

  for (const dir of pathDirs) {
    if (dir.length === 0) continue;
    try {
      const files = readdirSync(dir);
      for (const file of files) {
        if (file.startsWith(input) && file.includes('.')) {
          executableMatches.add(file);
        }
      }
    } catch {
    }
  }

  return [...new Set([...builtinMatches, ...executableMatches])].sort();
}

function findLongestCommonPrefix(matches: string[]): string {
  if (matches.length === 0) return "";
  if (matches.length === 1) return matches[0];

  let lcp = matches[0];
  for (let i = 1; i < matches.length; i++) {
    while (!matches[i].startsWith(lcp) && lcp.length > 0) {
      lcp = lcp.slice(0, -1);
    }
  }
  return lcp;
}

export function createBuiltinCompleter(
  builtins: Map<string, CommandHandler>,
  ringBell: () => void,
  printMatches: (matches: string[]) => void
): (line: string) => [string[], string] {
  let lastInput = "";
  let lastMatches: string[] = [];

  return (line: string): [string[], string] => {
    const input = line;

    if (input.trim().length === 0 || /\s/.test(input)) {
      lastInput = "";
      lastMatches = [];
      return [[], line];
    }

    const matches = findMatches(input, builtins);

    if (matches.length === 0) {
      ringBell();
      lastInput = "";
      lastMatches = [];
      return [[], line];
    }

    if (input === lastInput && lastMatches.length > 1) {
      printMatches(lastMatches);
      return [[], line];
    }

    if (matches.length > 1) {
      const lcp = findLongestCommonPrefix(matches);
      ringBell();
      lastInput = input;
      lastMatches = matches;
      if (lcp.length > input.length) {
        return [[lcp], line];
      }
      return [[], line];
    }

    lastInput = "";
    lastMatches = [];
    return [[`${matches[0]} `], line];
  };
}
