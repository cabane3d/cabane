import { Button } from '../components/button';

export interface StartScreenProps {
  /** Version of the application, or `null` while it is being read from the platform. */
  readonly version: string | null;
  readonly onNewProject: () => void;
}

/** Shown when the application opens, before any project is open (docs/design/main-window.md). */
export function StartScreen({ version, onNewProject }: StartScreenProps) {
  return (
    <main
      aria-label="Start screen"
      className="flex h-screen flex-col items-center justify-center gap-6 bg-background text-foreground"
    >
      <div className="flex flex-col items-center gap-1">
        <h1 className="font-semibold text-2xl">Cabane</h1>
        {version !== null && (
          <p className="text-muted-foreground text-sm tabular-nums">Version {version}</p>
        )}
      </div>
      <Button variant="primary" onClick={onNewProject}>
        New project
      </Button>
    </main>
  );
}
