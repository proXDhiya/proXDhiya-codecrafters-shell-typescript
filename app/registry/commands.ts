/**
  * app/registry/commands.ts
  *
  * Global registry for builtin commands.
  *
  * Objective:
  * - Provide a single `Map<string, CommandHandler>` shared across the application.
  * - Keep builtins discoverable (for execution, completion, and `type`).
  *
  * Why a separate module?
  * - It avoids circular dependencies and allows multiple modules to share the same map
  *   instance without passing it around manually.
  */
import type { CommandHandler } from "../utils/types";

const commands = new Map<string, CommandHandler>();

export default commands;
