import type { LevelId, Project } from '@cabane3d/core';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '../components/tabs';

export interface MainWindowProps {
  readonly project: Project;
}

function TopBar({ projectName }: { projectName: string }) {
  return (
    // A <header> inside <main> has no landmark role of its own: it is given explicitly, with the
    // glossary name.
    // biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: a <header> is not interactive.
    <header
      role="banner"
      aria-label="Top bar"
      className="flex h-bar shrink-0 items-center gap-1 border-b bg-background px-1.5"
    >
      <span className="px-2 font-semibold">{projectName}</span>
    </header>
  );
}

function LevelTabs({ project }: { project: Project }) {
  const { levels } = project;
  // The selected level is ephemeral UI state: it is not stored in the project (ADR-0004).
  const [selectedId, setSelectedId] = useState<LevelId | undefined>(levels[0]?.id);
  const selected = levels.find((level) => level.id === selectedId) ?? levels[0];

  return (
    <Tabs
      value={selected?.id}
      onValueChange={(id) => setSelectedId(levels.find((level) => level.id === id)?.id)}
      className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full border border-popover-border bg-popover p-0.5 shadow-popover"
    >
      <TabsList aria-label="Level tabs">
        {levels.map((level) => (
          <TabsTrigger key={level.id} value={level.id}>
            {level.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

/** The application window once a project is open (docs/design/main-window.md). */
export function MainWindow({ project }: MainWindowProps) {
  return (
    <main aria-label="Main window" className="flex h-screen flex-col bg-background text-foreground">
      <TopBar projectName={project.name} />
      <section aria-label="Plan view" className="relative min-h-0 flex-1">
        <LevelTabs project={project} />
      </section>
    </main>
  );
}
