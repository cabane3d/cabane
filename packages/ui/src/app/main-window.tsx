import {
  addWall,
  CommandError,
  type LevelId,
  observeProject,
  type Point,
  type Project,
  redo,
  undo,
  type WallId,
} from '@cabane3d/core';
import { type PlanScene, type PlanView, zoomPercent } from '@cabane3d/renderer';
import { BrickWall, MousePointer2, Redo2, Undo2 } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconButton } from '../components/icon-button';
import { Tabs, TabsList, TabsTrigger } from '../components/tabs';
import { ToolButton, Toolbar } from '../components/toolbar';
import { createToolState, TOOL_SHORTCUTS, type ToolId } from '../tool-state';
import { keyPressOf } from './key-press';
import { PlanViewSection } from './plan-view';
import { StatusBar, showCursor } from './status-bar';

export interface MainWindowProps {
  readonly project: Project;
}

/** A change counter of the project: React renders again after every command, undo or redo. */
function useProjectRevision(project: Project): number {
  const [revision, setRevision] = useState(0);
  useEffect(
    () => observeProject(project, () => setRevision((previous) => previous + 1)),
    [project],
  );
  return revision;
}

function TopBar({ project }: { project: Project }) {
  return (
    // A <header> inside <main> has no landmark role of its own: it is given explicitly, with the
    // glossary name.
    // biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: a <header> is not interactive.
    <header
      role="banner"
      aria-label="Top bar"
      className="flex min-h-bar shrink-0 items-center gap-1 border-b bg-background px-1.5"
    >
      <span className="px-2 font-semibold">{project.name}</span>
      <IconButton
        label="Undo"
        shortcut="Ctrl+Z"
        icon={<Undo2 />}
        disabled={!project.canUndo}
        onClick={() => undo(project)}
      />
      <IconButton
        label="Redo"
        shortcut="Ctrl+Shift+Z"
        icon={<Redo2 />}
        disabled={!project.canRedo}
        onClick={() => redo(project)}
      />
    </header>
  );
}

function LevelTabs({
  project,
  selectedId,
  onSelect,
}: {
  project: Project;
  selectedId: LevelId | undefined;
  onSelect: (id: LevelId | undefined) => void;
}) {
  const { levels } = project;

  return (
    <Tabs
      value={selectedId}
      onValueChange={(id) => onSelect(levels.find((level) => level.id === id)?.id)}
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

/** The tools of the Tool bar, from top to bottom. */
const TOOLS: readonly { readonly id: ToolId; readonly label: string; readonly icon: ReactNode }[] =
  [
    { id: 'select', label: 'Select tool', icon: <MousePointer2 /> },
    { id: 'wall', label: 'Wall tool', icon: <BrickWall /> },
  ];

/**
 * The Tool bar, floating over the left side of the Plan view (specs/ui/tool-bar.feature). The
 * active tool is window state, kept out of the project (ADR-0004).
 */
function MainToolBar({
  activeTool,
  onChoose,
}: {
  activeTool: ToolId;
  onChoose: (tool: ToolId) => void;
}) {
  return (
    <Toolbar
      aria-label="Tool bar"
      className="absolute top-2 left-2 rounded-xl border border-popover-border bg-popover p-1 shadow-popover"
    >
      {TOOLS.map((tool) => (
        <ToolButton
          key={tool.id}
          label={tool.label}
          shortcut={TOOL_SHORTCUTS[tool.id]}
          icon={tool.icon}
          active={activeTool === tool.id}
          onClick={() => onChoose(tool.id)}
        />
      ))}
    </Toolbar>
  );
}

/**
 * The undo shortcuts: Ctrl+Z undoes, Ctrl+Shift+Z redoes, except while the focus is in a text
 * field, where they stay the field's own.
 */
function useUndoShortcuts(project: Project): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.defaultPrevented) return;
      const press = keyPressOf(event);
      if (press.inTextField || !press.ctrl || press.alt || press.meta) return;
      if (press.key.toLowerCase() !== 'z') return;
      event.preventDefault();
      if (press.shift) redo(project);
      else undo(project);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [project]);
}

/** The application window once a project is open (docs/design/main-window.md). */
export function MainWindow({ project }: MainWindowProps) {
  const revision = useProjectRevision(project);
  useUndoShortcuts(project);

  // The Main window is mounted when a project is shown, so each shown project gets its own state.
  const [tools] = useState(createToolState);
  // Mirror of `tools.activeTool`, so that React renders again when it changes.
  const [activeTool, setActiveTool] = useState<ToolId>(tools.activeTool);
  const chooseTool = useCallback(
    (tool: ToolId) => {
      tools.choose(tool);
      setActiveTool(tools.activeTool);
    },
    [tools],
  );
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!tools.handleKey(keyPressOf(event))) return;
      event.preventDefault();
      setActiveTool(tools.activeTool);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tools]);

  // The selected level is ephemeral UI state: it is not stored in the project (ADR-0004).
  const { levels } = project;
  const [selectedId, setSelectedId] = useState<LevelId | undefined>(levels[0]?.id);
  const level = levels.find((candidate) => candidate.id === selectedId) ?? levels[0];
  if (!level) throw new Error('A project always has at least one level');

  // Read again after every change of the project (`revision`): the accessors are live.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `revision` stands for the project document.
  const scene = useMemo<PlanScene>(
    () => ({ level, wallThickness: project.wallDefaults.thickness }),
    [project, level.id, revision],
  );

  const levelId = level.id;
  const onDrawWall = useCallback(
    (wall: { readonly start: Point; readonly end: Point }): WallId | null => {
      try {
        return addWall(project, levelId, wall);
      } catch (error) {
        if (error instanceof CommandError) return null;
        throw error;
      }
    },
    [project, levelId],
  );

  // The view is window state, not part of the project (ADR-0004). Only the rounded zoom goes
  // through React: it changes with the wheel only. The cursor coordinates change at every pointer
  // move, so they are written straight to the Status bar element.
  const [zoom, setZoom] = useState<number | null>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  const onCursorMove = useCallback((point: Point | null) => {
    if (cursorRef.current) showCursor(cursorRef.current, point);
  }, []);
  const onViewChange = useCallback((view: PlanView) => {
    setZoom(Math.round(zoomPercent(view)));
  }, []);

  return (
    <main aria-label="Main window" className="flex h-screen flex-col bg-background text-foreground">
      <TopBar project={project} />
      <PlanViewSection
        onCursorMove={onCursorMove}
        onViewChange={onViewChange}
        scene={scene}
        wallTool={activeTool === 'wall'}
        onDrawWall={onDrawWall}
      >
        <MainToolBar activeTool={activeTool} onChoose={chooseTool} />
        <LevelTabs project={project} selectedId={level.id} onSelect={setSelectedId} />
      </PlanViewSection>
      <StatusBar zoom={zoom} cursorRef={cursorRef} />
    </main>
  );
}
