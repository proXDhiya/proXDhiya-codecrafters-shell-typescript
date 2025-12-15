import commands from "../registry/commands";
import { historyCommand } from "./history";
import { echoCommand } from "./echo";
import { exitCommand } from "./exit";
import { typeCommand } from "./type";
import { pwdCommand } from "./pwd";
import { cdCommand } from "./cd";

// Register all commands
commands.set("history", historyCommand);
commands.set("echo", echoCommand);
commands.set("exit", exitCommand);
commands.set("type", typeCommand);
commands.set("pwd", pwdCommand);
commands.set("cd", cdCommand);

export default commands;
