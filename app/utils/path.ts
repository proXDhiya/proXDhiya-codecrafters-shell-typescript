import { pathDirs, resolveCache } from "../registry/path";
import { resolve as resolvePath } from "node:path";
import { access } from "node:fs/promises";
import { constants } from "node:fs";

export function setPathFromString(pathValue: string): void {
  const parts = pathValue
    .split(":")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  pathDirs.length = 0;
  pathDirs.push(...parts);
  resolveCache.clear();
}

export function prependPathDir(dir: string): void {
  const trimmed = dir.trim();
  if (trimmed.length === 0) return;

  pathDirs.unshift(trimmed);
  resolveCache.clear();
}

export function getPathDirs(): readonly string[] {
  return pathDirs;
}

export function initPath(): void {
  const envPath = process.env.PATH ?? "";
  setPathFromString(envPath);
}

async function isExecutable(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export async function resolveCommand(command: string): Promise<string | null> {
  if (resolveCache.has(command)) {
    return resolveCache.get(command) ?? null;
  }

  if (command.includes("/")) {
    const ok = await isExecutable(command);
    const resolved = ok ? command : null;
    resolveCache.set(command, resolved);
    return resolved;
  }

  for (const dir of pathDirs) {
    const candidate = resolvePath(dir, command);
    if (await isExecutable(candidate)) {
      resolveCache.set(command, candidate);
      return candidate;
    }
  }

  resolveCache.set(command, null);
  return null;
}
