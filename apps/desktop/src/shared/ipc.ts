import { z } from 'zod';

/**
 * Closed list of IPC channels between the renderer (via preload) and main (ADR-0010).
 * Every channel declares the schema of its arguments and of its result; main validates
 * arguments, preload validates results.
 */
export const ipcContract = {
  'app:get-info': {
    args: z.tuple([]),
    result: z.object({ name: z.string(), version: z.string() }),
  },
} as const;

export type IpcChannel = keyof typeof ipcContract;
