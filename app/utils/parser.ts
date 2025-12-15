export function parseCommand(input: string): { command: string; args: string[]; stdoutRedirect?: string } {
  const tokenHasQuotedOrEscapedChar: boolean[] = [];
  const tokens: string[] = [];
  let current = "";
  let currentHasQuotedOrEscapedChar = false;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let tokenStarted = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inSingleQuote) {
      if (ch === "'") {
        inSingleQuote = false;
      } else {
        current += ch;
        tokenStarted = true;
        currentHasQuotedOrEscapedChar = true;
      }
      continue;
    }

    if (inDoubleQuote) {
      if (ch === "\\") {
        if (i + 1 < input.length) {
          const next = input[i + 1];
          if (next === "\\" || next === '"') {
            current += next;
            tokenStarted = true;
            currentHasQuotedOrEscapedChar = true;
            i++;
          } else {
            current += "\\";
            tokenStarted = true;
            currentHasQuotedOrEscapedChar = true;
          }
        } else {
          current += "\\";
          tokenStarted = true;
          currentHasQuotedOrEscapedChar = true;
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
        currentHasQuotedOrEscapedChar = true;
        continue;
      }

      const next = input[i + 1];
      current += next;
      tokenStarted = true;
      currentHasQuotedOrEscapedChar = true;
      i++;
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      tokenStarted = true;
      currentHasQuotedOrEscapedChar = true;
      continue;
    }

    if (ch === '"') {
      inDoubleQuote = true;
      tokenStarted = true;
      currentHasQuotedOrEscapedChar = true;
      continue;
    }

    if (ch === " " || ch === "\t") {
      if (tokenStarted) {
        tokens.push(current);
        tokenHasQuotedOrEscapedChar.push(currentHasQuotedOrEscapedChar);
        current = "";
        tokenStarted = false;
        currentHasQuotedOrEscapedChar = false;
      }
      continue;
    }

    current += ch;
    tokenStarted = true;
  }

  if (tokenStarted) {
    tokens.push(current);
    tokenHasQuotedOrEscapedChar.push(currentHasQuotedOrEscapedChar);
  }

  const command = tokens[0] ?? "";

  let stdoutRedirect: string | undefined;
  const args: string[] = [];

  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i];
    const tokHasQuotedOrEscaped = tokenHasQuotedOrEscapedChar[i] ?? false;

    if (!tokHasQuotedOrEscaped && (tok === ">" || tok === "1>")) {
      const file = tokens[i + 1];
      if (file !== undefined) {
        stdoutRedirect = file;
        i++;
      }
      continue;
    }

    if (!tokHasQuotedOrEscaped && tok.startsWith("1>") && tok.length > 2) {
      stdoutRedirect = tok.slice(2);
      continue;
    }

    if (!tokHasQuotedOrEscaped && tok.startsWith(">") && tok.length > 1) {
      stdoutRedirect = tok.slice(1);
      continue;
    }

    args.push(tok);
  }

  return { command, args, stdoutRedirect };
}
