/**
  * app/registry/path.ts
  *
  * Global registries for PATH handling.
  *
  * Objective:
  * - Store the current PATH directories (`pathDirs`) as an array.
  * - Store a cache from command name -> resolved executable path (`resolveCache`).
  *
  * Ownership:
  * - `app/utils/path.ts` is responsible for initializing and maintaining these values.
  * - Other modules should treat these as internal implementation details and prefer
  *   to call functions from `utils/path.ts` rather than mutate them directly.
  */
export const pathDirs: string[] = [];
export const resolveCache = new Map<string, string | null>();
