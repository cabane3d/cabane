import { createProject, type Project } from '@cabane3d/core';
import type { Platform } from '@cabane3d/platform';
import { useEffect, useState } from 'react';
import { MainWindow } from './main-window';
import { StartScreen } from './start-screen';

export interface AppProps {
  readonly platform: Platform;
}

/** Root of the application: the Start screen until a project is open, then the Main window. */
export function App({ platform }: AppProps) {
  const [version, setVersion] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    let cancelled = false;
    platform.getAppInfo().then((info) => {
      if (!cancelled) setVersion(info.version);
    });
    return () => {
      cancelled = true;
    };
  }, [platform]);

  if (project) return <MainWindow project={project} />;
  return <StartScreen version={version} onNewProject={() => setProject(createProject())} />;
}
