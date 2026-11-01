import { join } from 'node:path';
import { app, BrowserWindow, type IpcMainInvokeEvent, ipcMain, shell } from 'electron';
import { type IpcChannel, ipcContract } from '../shared/ipc';

const rendererDevUrl = process.env.ELECTRON_RENDERER_URL;

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    title: 'Cabane',
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  window.once('ready-to-show', () => window.show());

  // External links open in the system browser; the app window never leaves the app.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== window.webContents.getURL()) event.preventDefault();
  });

  if (!app.isPackaged && rendererDevUrl) {
    void window.loadURL(rendererDevUrl);
  } else {
    void window.loadFile(join(import.meta.dirname, '../renderer/index.html'));
  }
  return window;
}

function isTrustedSender(event: IpcMainInvokeEvent): boolean {
  const url = event.senderFrame?.url ?? '';
  return (
    url.startsWith('file://') ||
    (!app.isPackaged && !!rendererDevUrl && url.startsWith(rendererDevUrl))
  );
}

function handle<C extends IpcChannel>(
  channel: C,
  handler: (...args: never[]) => Promise<unknown> | unknown,
): void {
  const contract = ipcContract[channel];
  ipcMain.handle(channel, async (event, ...rawArgs: unknown[]) => {
    if (!isTrustedSender(event)) throw new Error(`Untrusted IPC sender for ${channel}`);
    const args = contract.args.parse(rawArgs);
    return contract.result.parse(await handler(...(args as never[])));
  });
}

function registerIpcHandlers(): void {
  handle('app:get-info', () => ({ name: app.getName(), version: app.getVersion() }));
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
