import { createProject, type Project } from '@cabane3d/core';
import type { Platform } from '@cabane3d/platform';
import { useEffect, useState } from 'react';
import { TooltipProvider } from '../components/tooltip';
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

  return (
    <TooltipProvider>
      {project ? (
        <MainWindow project={project} />
      ) : (
        <StartScreen version={version} onNewProject={() => setProject(createProject())} />
      )}
    </TooltipProvider>
  );
}
