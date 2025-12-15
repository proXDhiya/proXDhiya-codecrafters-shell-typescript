export function parseCommand(input: string): { command: string; args: string[] } {
  const tokens: string[] = [];
  let current = "";
  let tokenStarted = false;
  let inSingleQuote = false;
  let inDoubleQuote = false;

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

    if (inDoubleQuote) {
      if (ch === "\\") {
        if (i + 1 < input.length) {
          const next = input[i + 1];
          current += next;
          tokenStarted = true;
          i++;
        } else {
          current += "\\";
          tokenStarted = true;
        }
        continue;
      }

      if (ch === '"') {
        inDoubleQuote = false;
      } else {
        current += ch;
        tokenStarted = true;
      }
      continue;
    }

    if (ch === "\\") {
      if (i + 1 >= input.length) {
        current += "\\";
        tokenStarted = true;
        continue;
      }

      const next = input[i + 1];
      current += next;
      tokenStarted = true;
      i++;
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      tokenStarted = true;
      continue;
    }

    if (ch === '"') {
      inDoubleQuote = true;
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
