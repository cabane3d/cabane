import type { Platform } from '@cabane3d/platform';
import { contextBridge, ipcRenderer } from 'electron';
import { ipcContract } from '../shared/ipc';

// Minimal bridge: the renderer only sees the Platform interface (ADR-0010).
const platform: Platform = {
  kind: 'electron',
  getAppInfo: async () =>
    ipcContract['app:get-info'].result.parse(await ipcRenderer.invoke('app:get-info')),
};

contextBridge.exposeInMainWorld('cabane', platform);
