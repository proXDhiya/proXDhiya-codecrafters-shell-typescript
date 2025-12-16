import type { ParsedCommand, ParsedLine, Redirect } from "./types";

function findFirstUnquotedPipe(input: string): number {
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inSingleQuote) {
      if (ch === "'") inSingleQuote = false;
      continue;
    }

    if (inDoubleQuote) {
      if (ch === "\\") {
        if (i + 1 < input.length) {
          const next = input[i + 1];
          if (next === "\\" || next === '"') {
            i++;
          }
        }
        continue;
      }

      if (ch === '"') {
        inDoubleQuote = false;
      }
      continue;
    }

    if (ch === "\\") {
      if (i + 1 < input.length) i++;
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      continue;
    }

    if (ch === '"') {
      inDoubleQuote = true;
      continue;
    }

    if (ch === "|") return i;
  }

  return -1;
}

export function parseLine(input: string): ParsedLine {
  const pipeIndex = findFirstUnquotedPipe(input);
  if (pipeIndex === -1) {
    return { kind: "command", command: parseCommand(input) };
  }

  const leftInput = input.slice(0, pipeIndex).trimEnd();
  const rightInput = input.slice(pipeIndex + 1).trimStart();
  const left = parseCommand(leftInput);
  const right = parseCommand(rightInput);

  if (left.command.length === 0 || right.command.length === 0) {
    return { kind: "command", command: parseCommand(input) };
  }

  return { kind: "pipeline", left, right };
}

export function parseCommand(input: string): ParsedCommand {
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

    if (ch === " " || ch === "\t" || ch === "\r") {
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

  let stdoutRedirect: Redirect = null;
  let stderrRedirect: Redirect = null;
  const args: string[] = [];

  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i];
    const tokHasQuotedOrEscaped = tokenHasQuotedOrEscapedChar[i] ?? false;

    if (!tokHasQuotedOrEscaped && (tok === ">>" || tok === "1>>")) {
      const file = tokens[i + 1];
      if (file !== undefined) {
        stdoutRedirect = { target: file, mode: "append" };
        i++;
      }
      continue;
    }

    if (!tokHasQuotedOrEscaped && tok === "2>>") {
      const file = tokens[i + 1];
      if (file !== undefined) {
        stderrRedirect = { target: file, mode: "append" };
        i++;
      }
      continue;
    }

    if (!tokHasQuotedOrEscaped && (tok === ">" || tok === "1>")) {
      const file = tokens[i + 1];
      if (file !== undefined) {
        stdoutRedirect = { target: file, mode: "overwrite" };
        i++;
      }
      continue;
    }

    if (!tokHasQuotedOrEscaped && tok === "2>") {
      const file = tokens[i + 1];
      if (file !== undefined) {
        stderrRedirect = { target: file, mode: "overwrite" };
        i++;
      }
      continue;
    }

    if (!tokHasQuotedOrEscaped && tok.startsWith("1>>") && tok.length > 3) {
      stdoutRedirect = { target: tok.slice(3), mode: "append" };
      continue;
    }

    if (!tokHasQuotedOrEscaped && tok.startsWith(">>") && tok.length > 2) {
      stdoutRedirect = { target: tok.slice(2), mode: "append" };
      continue;
    }

    if (!tokHasQuotedOrEscaped && tok.startsWith("2>>") && tok.length > 3) {
      stderrRedirect = { target: tok.slice(3), mode: "append" };
      continue;
    }

    if (!tokHasQuotedOrEscaped && tok.startsWith("1>") && tok.length > 2) {
      stdoutRedirect = { target: tok.slice(2), mode: "overwrite" };
      continue;
    }

    if (!tokHasQuotedOrEscaped && tok.startsWith("2>") && tok.length > 2) {
      stderrRedirect = { target: tok.slice(2), mode: "overwrite" };
      continue;
    }

    if (!tokHasQuotedOrEscaped && tok.startsWith(">") && tok.length > 1) {
      stdoutRedirect = { target: tok.slice(1), mode: "overwrite" };
      continue;
    }

    args.push(tok);
  }

  return {
    command,
    args,
    redirects: {
      stdout: stdoutRedirect,
      stderr: stderrRedirect
    }
  };
}
