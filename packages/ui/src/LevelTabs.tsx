import type { Level } from '@cabane3d/core';
import { type KeyboardEvent, useRef } from 'react';
import { targetTabIndex } from './tabs';

export interface LevelTabsProps {
  readonly levels: readonly Level[];
  readonly selectedLevelId: string | undefined;
  readonly onSelect: (levelId: string) => void;
}

/**
 * Level tabs (docs/design/main-window.md): one tab per level, the selected tab is the
 * current level. Keyboard: arrow keys, Home and End move between tabs (WAI-ARIA tabs pattern).
 */
export function LevelTabs({ levels, selectedLevelId, onSelect }: LevelTabsProps) {
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const target = targetTabIndex(event.key, index, levels.length);
    const level = target === null ? undefined : levels[target];
    if (target === null || !level) return;
    event.preventDefault();
    onSelect(level.id);
    tabs.current[target]?.focus();
  }

  return (
    <div role="tablist" aria-label="Level tabs" className="flex border-t px-2">
      {levels.map((level, index) => {
        const selected = level.id === selectedLevelId;
        return (
          <button
            key={level.id}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(level.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className="-mt-px min-h-8 border-transparent border-t-2 px-3 text-muted-foreground text-sm hover:bg-muted aria-selected:border-accent-strong aria-selected:font-semibold aria-selected:text-foreground"
          >
            {level.name}
          </button>
        );
      })}
    </div>
  );
}
