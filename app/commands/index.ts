import type { CommandHandler } from "../utils/types";
import { echoCommand } from "./echo";
import { exitCommand } from "./exit";

export const commands: Map<string, CommandHandler> = new Map();

commands.set("echo", echoCommand);
commands.set("exit", exitCommand);
