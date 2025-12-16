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
