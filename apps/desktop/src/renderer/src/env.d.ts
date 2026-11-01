/// <reference types="vite/client" />
import type { Platform } from '@cabane3d/platform';

declare global {
  interface ImportMetaEnv {
    readonly VITE_PLATFORM?: 'fake';
  }

  interface Window {
    /** Exposed by the preload script in Electron; absent in browser-only mode. */
    readonly cabane?: Platform;
  }
}
