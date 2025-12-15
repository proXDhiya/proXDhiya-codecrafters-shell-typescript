export type CommandHandler = (args: string[]) => void | Promise<void>;
export type PathHandler = (folders: string[]) => void;
