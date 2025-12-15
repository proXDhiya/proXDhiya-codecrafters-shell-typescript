import commands from "../registry/commands";
import { echoCommand } from "./echo";
import { exitCommand } from "./exit";
import { typeCommand } from "./type";

// Register all commands
commands.set("echo", echoCommand);
commands.set("exit", exitCommand);
commands.set("type", typeCommand);

export default commands;
