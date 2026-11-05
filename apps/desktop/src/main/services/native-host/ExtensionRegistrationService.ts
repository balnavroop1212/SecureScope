import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { NativeFramer } from './NativeFramer';

export interface ExtensionStatus {
  isWindows: boolean;
  manifestExists: boolean;
  batExists: boolean;
  registryKeyExists: boolean;
  isFullyConfigured: boolean;
  hostDir: string;
  manifestPath: string;
  batPath: string;
  hostId: string;
}

export interface RegisterResult {
  success: boolean;
  hostDir: string;
  manifestPath: string;
  batPath: string;
  registryStatus: string;
}

export class ExtensionRegistrationService {
  private static HOST_ID = 'com.securescope.desktop';

  public static getHostPaths(): { hostDir: string; manifestPath: string; batPath: string } {
    const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || 'C:\\', 'AppData', 'Roaming');
    const hostDir = path.join(appData, 'SecureScope', 'host');
    const manifestPath = path.join(hostDir, `${this.HOST_ID}.json`);
    const batPath = path.join(hostDir, 'securescope-host.bat');
    return { hostDir, manifestPath, batPath };
  }

  public static getStatus(): ExtensionStatus {
    const isWindows = process.platform === 'win32';
    const { hostDir, manifestPath, batPath } = this.getHostPaths();

    const manifestExists = fs.existsSync(manifestPath);
    const batExists = fs.existsSync(batPath);
    let registryKeyExists = false;

    if (isWindows) {
      try {
        const regKey = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${this.HOST_ID}`;
        const output = execSync(`reg query "${regKey}"`, { stdio: 'pipe' }).toString();
        registryKeyExists = output.includes(manifestPath) || output.includes(this.HOST_ID);
      } catch {
        registryKeyExists = false;
      }
    }

    return {
      isWindows,
      manifestExists,
      batExists,
      registryKeyExists,
      isFullyConfigured: manifestExists && batExists && (!isWindows || registryKeyExists),
      hostDir,
      manifestPath,
      batPath,
      hostId: this.HOST_ID,
    };
  }

  public static registerHost(extensionId?: string): RegisterResult {
    const isWindows = process.platform === 'win32';
    const { hostDir, manifestPath, batPath } = this.getHostPaths();

    if (!fs.existsSync(hostDir)) {
      fs.mkdirSync(hostDir, { recursive: true });
    }

    // Locate the launcher script or compiled host
    const launcherJs = path.resolve(__dirname, 'securescope-host.js');
    const batContent = `@echo off\r\nnode "${launcherJs}"\r\n`;
    fs.writeFileSync(batPath, batContent, 'utf-8');

    const origins = ['chrome-extension://*/*'];
    if (extensionId && extensionId.trim()) {
      origins.unshift(`chrome-extension://${extensionId.trim()}/`);
    }

    const manifest = {
      name: this.HOST_ID,
      description: 'SecureScope Desktop Native Messaging Host',
      path: batPath,
      type: 'stdio',
      allowed_origins: origins,
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    let registryStatus = 'Skipped (Non-Windows platform)';
    if (isWindows) {
      try {
        const regKey = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${this.HOST_ID}`;
        const cmd = `reg add "${regKey}" /ve /t REG_SZ /d "${manifestPath}" /f`;
        execSync(cmd, { stdio: 'pipe' });
        registryStatus = 'Registered in Windows Registry successfully';
      } catch (err: any) {
        registryStatus = `Registry update failed: ${err.message}`;
      }
    }

    return {
      success: true,
      hostDir,
      manifestPath,
      batPath,
      registryStatus,
    };
  }

  public static testEcho(payload: object): { success: boolean; roundTripBytes: number; decoded: any } {
    const encoded = NativeFramer.encode(payload);
    const { messages, remainder } = NativeFramer.decode(encoded);

    if (messages.length === 0 || remainder.length > 0) {
      throw new Error('Framing round-trip validation failed');
    }

    return {
      success: true,
      roundTripBytes: encoded.length,
      decoded: messages[0],
    };
  }
}

