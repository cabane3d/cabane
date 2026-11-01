import { createNewProject } from '@cabane3d/core';
import type { AppInfo, Platform } from '@cabane3d/platform';
import { useEffect, useState } from 'react';
import { LevelTabs } from './LevelTabs';

export interface WorkspaceProps {
  readonly platform: Platform;
}

/** Root of the editor. The application opens on a new project. */
export function Workspace({ platform }: WorkspaceProps) {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [project] = useState(createNewProject);
  const levels = project.levels;
  // Ephemeral UI state, not stored in the document (ADR-0004).
  const [selectedLevelId, setSelectedLevelId] = useState(() => levels[0]?.id);

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
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: a <header> outside sectioning content is the banner landmark, which supports aria-label (WAI-ARIA 1.2); the name follows docs/design/main-window.md. */}
      <header aria-label="Top bar" className="flex min-h-12 items-center gap-4 border-b px-4">
        <span className="font-semibold text-sm">{project.name}</span>
      </header>
      <main aria-label="Workspace" className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <h1 className="font-semibold text-3xl">Cabane</h1>
          {appInfo && (
            <p className="text-muted-foreground text-sm tabular-nums">Version {appInfo.version}</p>
          )}
        </div>
        <LevelTabs
          levels={levels}
          selectedLevelId={selectedLevelId}
          onSelect={setSelectedLevelId}
        />
      </main>
    </div>
  );
}
