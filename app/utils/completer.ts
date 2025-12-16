import { readdirSync } from "node:fs";

import type { CommandHandler } from "./types";

export function createBuiltinCompleter(
  builtins: Map<string, CommandHandler>,
  ringBell: () => void
): (line: string) => [string[], string] {
  return (line: string): [string[], string] => {
    const input = line;

    if (input.trim().length === 0 || /\s/.test(input)) {
      return [[], line];
    }

    const builtinMatches = [...builtins.keys()].filter((cmd) => cmd.startsWith(input));

    const executableMatches = new Set<string>();
    const pathEnv = process.env.PATH ?? "";
    const pathDirs = pathEnv.split(":");

    for (const dir of pathDirs) {
      if (dir.length === 0) continue;
      try {
        const files = readdirSync(dir);
        for (const file of files) {
          if (file.startsWith(input)) {
            executableMatches.add(file);
          }
        }
      } catch {
        // ignore non-existent or unreadable directories
      }
    }

    const matches = [...new Set([...builtinMatches, ...executableMatches])];

    if (matches.length === 0) {
      ringBell();
      return [[], line];
    }

    return [matches.map((m) => `${m} `), line];
  };
}
