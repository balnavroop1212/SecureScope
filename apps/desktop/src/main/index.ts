import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { LocalAuthRepository } from './services/auth/LocalAuthRepository';
import { SQLiteScanRepository } from './services/storage/SQLiteScanRepository';
import { ScannerEngine } from './services/scanner/ScannerEngine';
import { EntitlementService } from './services/auth/EntitlementService';
import { PdfGeneratorService } from './services/pdf/PdfGeneratorService';
import { ExtensionRegistrationService } from './services/native-host/ExtensionRegistrationService';
import type { SignupDTO, LoginDTO, UserPlan, ScanMode } from '@shared/types';

let mainWindow: BrowserWindow | null = null;
const authRepo = new LocalAuthRepository();
const scanRepo = new SQLiteScanRepository();
const scannerEngine = new ScannerEngine(scanRepo);

const isDev =
  (process.env.NODE_ENV === 'development' || !app.isPackaged) &&
  process.env.USE_LOCAL_DIST !== '1';

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 800,
    backgroundColor: '#090E17',
    show: false,
    title: 'SecureScope — Desktop Website Security Assessment Platform',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, '../preload/index.js'),
    },
  });

  // Gracefully show window once ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Electron Window] Failed to load URL: ${validatedURL} (${errorDescription}, code: ${errorCode})`);
  });

  if (process.env.TEST_EXIT === '1') {
    mainWindow.webContents.once('did-finish-load', () => {
      console.log('[Electron Verification] did-finish-load successfully fired!');
      setTimeout(() => {
        console.log('[Electron Verification] Window initialized and verified. Exiting test run.');
        app.quit();
      }, 1000);
    });
  }

  // Security: prevent rogue navigation inside the renderer
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isAllowed = isDev
      ? url.startsWith('http://localhost:5173')
      : url.startsWith('file://');
    if (!isAllowed) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Security: external links open in system default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open devtools in development if needed
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Foundation IPC handlers
ipcMain.handle('app:getInfo', async () => {
  return {
    name: 'SecureScope',
    version: '1.0.0',
    platform: process.platform,
    isPackaged: app.isPackaged,
  };
});

// Authentication IPC handlers
ipcMain.handle('auth:signup', async (_event, data: SignupDTO) => {
  return authRepo.register(data);
});

ipcMain.handle('auth:login', async (_event, data: LoginDTO) => {
  return authRepo.login(data);
});

ipcMain.handle('auth:getCurrentUser', async () => {
  return authRepo.getCurrentUser();
});

ipcMain.handle(
  'auth:updateProfile',
  async (_event, updates: { firstName?: string; lastName?: string }) => {
    const session = await authRepo.getCurrentSession();
    if (!session) throw new Error('Unauthenticated');
    return authRepo.updateProfile(session.userId, updates);
  }
);

ipcMain.handle('auth:updatePlan', async (_event, plan: UserPlan) => {
  const session = await authRepo.getCurrentSession();
  if (!session) throw new Error('Unauthenticated');
  return authRepo.updatePlan(session.userId, plan);
});

ipcMain.handle('auth:logout', async () => {
  await authRepo.clearSession();
});

// Scanner IPC handlers
ipcMain.handle(
  'scanner:startScan',
  async (
    _event,
    data: {
      url: string;
      scanMode: ScanMode;
      authorizedScopeConfirmed: boolean;
      isDemoMode?: boolean;
    }
  ) => {
    const user = await authRepo.getCurrentUser();
    if (!user) throw new Error('Unauthenticated');

    // Dual-layer Feature Gating: Main process independent verification
    if (!EntitlementService.canExecuteScanMode(user.plan, data.scanMode)) {
      throw new Error(
        `ENTITLEMENT_REQUIRED: Mode "${data.scanMode}" requires an active Premium subscription.`
      );
    }

    return scannerEngine.startScan({
      userId: user.id,
      url: data.url,
      scanMode: data.scanMode,
      authorizedScopeConfirmed: data.authorizedScopeConfirmed,
      isDemoMode: data.isDemoMode,
      onProgress: (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('scanner:progress', progress);
        }
      },
    });
  }
);

ipcMain.handle('scanner:cancelScan', async (_event, scanId: string) => {
  return scannerEngine.cancelScan(scanId);
});

// Reports IPC handlers
ipcMain.handle('reports:getDashboardMetrics', async () => {
  const user = await authRepo.getCurrentUser();
  if (!user) return { totalScans: 0, totalFindings: 0, highRiskFindings: 0, uniqueWebsites: 0 };
  return scanRepo.getDashboardMetrics(user.id);
});

ipcMain.handle('reports:getHistory', async () => {
  const user = await authRepo.getCurrentUser();
  if (!user) return [];
  return scanRepo.getScansByUser(user.id);
});

ipcMain.handle('reports:getReport', async (_event, scanId: string) => {
  const user = await authRepo.getCurrentUser();
  if (!user) return null;
  return scanRepo.getReportByScanId(scanId);
});

ipcMain.handle('reports:deleteScan', async (_event, scanId: string) => {
  const user = await authRepo.getCurrentUser();
  if (!user) return false;
  return scanRepo.deleteScan(scanId, user.id);
});

ipcMain.handle('reports:exportPdf', async (_event, scanId: string) => {
  const user = await authRepo.getCurrentUser();
  if (!user) throw new Error('Unauthenticated');

  // Enforce Main-process premium check
  if (!EntitlementService.canDownloadPdf(user.plan)) {
    throw new Error('ENTITLEMENT_REQUIRED: PDF export requires an active Premium subscription.');
  }

  const report = await scanRepo.getReportByScanId(scanId);
  if (!report) throw new Error('Report not found');

  return PdfGeneratorService.generatePdf(report);
});

// Companion Chrome Extension IPC handlers
ipcMain.handle('extension:getStatus', async () => {
  const user = await authRepo.getCurrentUser();
  const baseStatus = ExtensionRegistrationService.getStatus();
  return {
    ...baseStatus,
    userPlan: user?.plan || 'free',
    canUseExtension: user ? EntitlementService.canUseCompanionExtension(user.plan) : false,
  };
});

ipcMain.handle('extension:registerHost', async (_event, extensionId?: string) => {
  const user = await authRepo.getCurrentUser();
  if (!user) throw new Error('Unauthenticated');
  return ExtensionRegistrationService.registerHost(extensionId);
});

ipcMain.handle('extension:testEcho', async (_event, payload: any) => {
  return ExtensionRegistrationService.testEcho(payload || { ping: true, timestamp: Date.now() });
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
