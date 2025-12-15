export type CommandHandler = (args: string[]) => void | Promise<void>;
export type PathHandler = (folders: string[]) => void;

export type RedirectTarget = string | null;

export type Redirects = {
  stdout: RedirectTarget;
  stderr: RedirectTarget;
};

export type ParsedCommand = {
  command: string;
  args: string[];
  redirects: Redirects;
};
