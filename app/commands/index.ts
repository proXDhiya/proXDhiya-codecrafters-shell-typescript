import commands from "../registry/commands";
import { echoCommand } from "./echo";
import { exitCommand } from "./exit";
import { typeCommand } from "./type";
import { pwdCommand } from "./pwd";

// Register all commands
commands.set("echo", echoCommand);
commands.set("exit", exitCommand);
commands.set("type", typeCommand);
commands.set("pwd", pwdCommand);

export default commands;
