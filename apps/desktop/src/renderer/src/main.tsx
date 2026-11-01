import { createFakePlatform, type Platform } from '@cabane3d/platform';
import { Workspace } from '@cabane3d/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './main.css';

function resolvePlatform(): Platform {
  // Browser-only mode (dev:web and Chromium E2E tests) runs on the fake platform.
  if (import.meta.env.VITE_PLATFORM === 'fake') return createFakePlatform();
  if (!window.cabane) throw new Error('Platform bridge missing: the preload script did not run.');
  return window.cabane;
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <Workspace platform={resolvePlatform()} />
  </StrictMode>,
);
