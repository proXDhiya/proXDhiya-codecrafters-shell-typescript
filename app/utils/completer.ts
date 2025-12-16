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

    const matches = [...builtins.keys()].filter((cmd) => cmd.startsWith(input));

    if (matches.length === 0) {
      ringBell();
      return [[], line];
    }

    return [matches.map((m) => `${m} `), line];
  };
}
