/**
 * The only way the renderer reaches the operating system (ADR-0010).
 *
 * The Electron implementation lives in `apps/desktop` (preload + IPC); the fake
 * implementation below is used by tests and by the browser-only dev mode.
 * Every new capability is added here first, then implemented on both sides.
 */
export interface AppInfo {
  readonly name: string;
  readonly version: string;
}

export interface Platform {
  readonly kind: 'electron' | 'fake';
  getAppInfo(): Promise<AppInfo>;
}

export function createFakePlatform(
  appInfo: AppInfo = { name: 'Cabane', version: '0.0.0-test' },
): Platform {
  return {
    kind: 'fake',
    getAppInfo: async () => appInfo,
  };
}
