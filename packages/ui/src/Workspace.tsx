import type { AppInfo, Platform } from '@cabane3d/platform';
import { useEffect, useState } from 'react';

export interface WorkspaceProps {
  readonly platform: Platform;
}

/** Root of the editor. For now it only proves the renderer reaches the platform. */
export function Workspace({ platform }: WorkspaceProps) {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    platform.getAppInfo().then((info) => {
      if (!cancelled) setAppInfo(info);
    });
    return () => {
      cancelled = true;
    };
  }, [platform]);

  return (
    <main
      aria-label="Workspace"
      className="flex h-screen flex-col items-center justify-center gap-2 bg-background text-foreground"
    >
      <h1 className="font-semibold text-3xl">Cabane</h1>
      {appInfo && (
        <p className="text-muted-foreground text-sm tabular-nums">Version {appInfo.version}</p>
      )}
    </main>
  );
}
