/**
  * app/utils/types.ts
  *
  * Shared TypeScript types used across the shell.
  *
  * Objective:
  * - Centralize the core data structures that flow between modules.
  * - Keep the parser and executor decoupled by agreeing on a common shape.
  *
  * Key types:
  * - `CommandHandler`: the function signature for builtin commands.
  * - `ParsedCommand`: command name + args + redirects.
  * - `ParsedLine`: either a single command or a pipeline of commands.
  * - `Redirect`/`Redirects`: models stdout/stderr redirection targets.
  */
export type CommandHandler = (args: string[]) => void | Promise<void>;

export type RedirectMode = "overwrite" | "append";

export type Redirect = {
  target: string;
  mode: RedirectMode;
} | null;

export type Redirects = {
  stdout: Redirect;
  stderr: Redirect;
};

export type ParsedCommand = {
  command: string;
  args: string[];
  redirects: Redirects;
};

export type ParsedLine =
  | { kind: "command"; command: ParsedCommand }
  | { kind: "pipeline"; commands: ParsedCommand[] };
