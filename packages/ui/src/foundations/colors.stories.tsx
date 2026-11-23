import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';

export default { title: 'Foundations / Colors' } satisfies Meta;

const GROUPS: ReadonlyArray<{ readonly title: string; readonly tokens: readonly string[] }> = [
  { title: 'Brand', tokens: ['pumpkin-spice', 'jet-black', 'snow'] },
  {
    title: 'Interface',
    tokens: ['background', 'foreground', 'muted', 'muted-foreground', 'border', 'input'],
  },
  { title: 'Floating layers', tokens: ['popover', 'popover-foreground', 'popover-border'] },
  {
    title: 'Accent',
    tokens: ['primary', 'primary-foreground', 'accent-strong', 'accent-text', 'ring'],
  },
  { title: 'Status', tokens: ['destructive', 'success', 'warning', 'info'] },
  {
    title: 'Plan view',
    tokens: [
      'plan-paper',
      'plan-ink',
      'plan-wall',
      'plan-selection',
      'plan-selection-text',
      'plan-handle-fill',
      'plan-handle-stroke',
      'plan-hover',
      'plan-guide',
      'plan-invalid',
    ],
  },
];

/** Resolved value of a token, re-read when the theme switch changes `data-theme`. */
function useTokenValue(token: string): string {
  const [value, setValue] = useState('');
  useEffect(() => {
    const read = () =>
      setValue(getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim());
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [token]);
  return value;
}

function Swatch({ token }: { readonly token: string }) {
  const value = useTokenValue(token);
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-bar shrink-0 rounded-md border"
        style={{ background: `var(--${token})` }}
      />
      <div className="flex flex-col">
        <code className="text-base">{token}</code>
        <code className="text-muted-foreground text-sm">{value}</code>
      </div>
    </div>
  );
}

const TokensDemo = () => (
  <div className="flex flex-col gap-8">
    {GROUPS.map((group) => (
      <section key={group.title} className="flex flex-col gap-3">
        <h2 className="font-semibold text-lg">{group.title}</h2>
        <div className="grid grid-cols-3 gap-4">
          {group.tokens.map((token) => (
            <Swatch key={token} token={token} />
          ))}
        </div>
      </section>
    ))}
  </div>
);

/** The accent in its three roles, which keep WCAG AA in light mode. */
const AccentRolesDemo = () => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-4">
      <span className="rounded-md bg-primary px-3 py-1 font-semibold text-primary-foreground">
        Fill with dark content
      </span>
      <span className="rounded-md border-2 border-accent-strong px-3 py-1 text-accent-strong">
        Strokes and icons
      </span>
      <span className="text-accent-text">Accent text, e.g. a selected dimension</span>
    </div>
    <p className="text-muted-foreground">
      Status colors: <span className="text-destructive">destructive</span> ·{' '}
      <span className="text-success">success</span> · <span className="text-warning">warning</span>{' '}
      · <span className="text-info">info</span>
    </p>
  </div>
);

export const Tokens: StoryObj = { render: () => <TokensDemo /> };
export const AccentRoles: StoryObj = { render: () => <AccentRolesDemo /> };
