export function parseCommand(input: string): { command: string; args: string[] } {
  const tokens: string[] = [];
  let current = "";
  let tokenStarted = false;
  let inSingleQuote = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inSingleQuote) {
      if (ch === "'") {
        inSingleQuote = false;
      } else {
        current += ch;
        tokenStarted = true;
      }
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      tokenStarted = true;
      continue;
    }

    if (ch === " " || ch === "\t") {
      if (tokenStarted) {
        tokens.push(current);
        current = "";
        tokenStarted = false;
      }
      continue;
    }

    current += ch;
    tokenStarted = true;
  }

  if (tokenStarted) {
    tokens.push(current);
  }

  const command = tokens[0] ?? "";
  const args = tokens.slice(1);
  return { command, args };
}
