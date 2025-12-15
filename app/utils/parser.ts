export function parseCommand(input: string): { command: string; args: string[] } {
  const [command, ...args]: string[] = input.trim().split(/\s+/);
  return { command, args };
}
