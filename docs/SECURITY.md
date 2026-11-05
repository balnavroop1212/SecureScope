# SecureScope — Application Security Architecture (SECURITY.md)

## 1. Security Overview & Threat Model
SecureScope handles security assessment data, target URLs, vulnerability evidence, and user authentication credentials. As a desktop application inspecting external websites, it must maintain rigorous defensive barriers against attacks including:
- Malicious websites attempting to exploit the scanner via malicious HTTP responses or headers.
- Compromised renderer processes attempting to execute arbitrary shell commands or access the host filesystem.
- Server-Side Request Forgery (SSRF) targeting internal private networks or cloud metadata endpoints (`169.254.169.254`).
- Credential stuffing, password cracking, or timing attacks on local authentication stores.
- Chrome extension hijacking or unauthorized Native Messaging commands.

---

## 2. Electron Process Security Configuration

### A. Core BrowserWindow Security Flags
The primary Electron window is created with strictly enforced security flags:

```typescript
const mainWindow = new BrowserWindow({
  width: 1440,
  height: 900,
  minWidth: 1280,
  minHeight: 800,
  webPreferences: {
    // 1. Mandatory context isolation
    contextIsolation: true,
    
    // 2. Strict disablement of Node.js in the renderer
    nodeIntegration: false,
    nodeIntegrationInWorker: false,
    nodeIntegrationInSubFrames: false,
    
    // 3. Sandboxing
    sandbox: true,
    
    // 4. Secure preload injection
    preload: path.join(__dirname, '../preload/index.js'),
    
    // 5. Disable dangerous web features
    webSecurity: true,
    allowRunningInsecureContent: false,
    experimentalFeatures: false
  }
});
```

### B. Content Security Policy (CSP)
A restrictive CSP is injected on all HTTP/file responses:
```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none';
```
- Disallows external script injection or dynamic `eval()`.
- Disallows frame embedding.
- Limits image rendering to safe internal origins and data URLs.

### C. Navigation & Window Open Sandboxing
```typescript
mainWindow.webContents.setWindowOpenHandler(({ url }) => {
  // Disallow opening arbitrary popups inside Electron; open verified external links in system browser
  if (url.startsWith('https://') || url.startsWith('http://')) {
    shell.openExternal(url);
  }
  return { action: 'deny' };
});

mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
  // Prevent renderer from navigating away from the local application bundle
  const parsedUrl = new URL(navigationUrl);
  if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.protocol !== 'file:') {
    event.preventDefault();
  }
});
```

---

## 3. Strict Preload API & IPC Validation
The preload layer exposes only high-level, domain-specific methods via `contextBridge`. No raw `ipcRenderer.send` or `ipcRenderer.on` is accessible to the UI.

In the Electron Main process, every incoming IPC invocation is validated against a **Zod schema** before executing any business logic:

```typescript
// Example: Main Process Scan Trigger IPC Validator
ipcMain.handle('scanner:startScan', async (event, rawPayload) => {
  const schema = z.object({
    url: z.string().url().max(2048),
    scanMode: z.enum(['normal', 'aggressive', 'private']),
    authorizedScopeConfirmed: z.literal(true, {
      errorMap: () => ({ message: 'User must explicitly confirm authorization' })
    })
  });

  const parsed = schema.safeParse(rawPayload);
  if (!parsed.success) {
    throw new Error(`Invalid request payload: ${parsed.error.message}`);
  }

  // Enforce Main-Process Entitlement Check
  const currentUser = authService.getCurrentUser();
  if (parsed.data.scanMode !== 'normal') {
    if (!currentUser || currentUser.plan !== 'premium') {
      throw new Error('ENTITLEMENT_REQUIRED: Mode requires Premium subscription');
    }
  }

  return scannerService.startScan(currentUser.id, parsed.data);
});
```

---

## 4. SSRF & Target Boundary Protection
The scanning engine prevents users or attackers from scanning internal networks or exploiting loopback services:

1. **Protocol Restriction**: Allowed schemes are strictly `http:` and `https:`.
2. **Pre-Flight DNS Resolution**: Target hostnames are resolved to IP addresses via `dns.promises.lookup()`.
3. **CIDR Block Disallowance**:
   - `0.0.0.0/8` (Current network)
   - `10.0.0.0/8` (Private RFC1918)
   - `127.0.0.0/8` (Loopback)
   - `169.254.0.0/16` (Link-Local / AWS Metadata)
   - `172.16.0.0/12` (Private RFC1918)
   - `192.168.0.0/16` (Private RFC1918)
   - `::1` (IPv6 Loopback)
   - `fe80::/10` (IPv6 Link-Local)
4. **Explicit Demo Target Mode**:
   Localhost/loopback testing is permitted exclusively when the user explicitly triggers "Sandbox Demo Mode" (clearly watermarked in findings and disabled in production assessments).

---

## 5. Password Hashing & Local Credential Security
- **Algorithm**: Node.js standard cryptographic Scrypt with 32-byte salt and standard parameters ($N=16384, r=8, p=1$), producing a 64-byte key.
- **Verification**: Verifications use `crypto.timingSafeEqual` on the derived buffers to defend against timing side-channel attacks.
- **Storage Location**: `%APPDATA%/SecureScope/data/users.json`.
- **Atomic File Operations**:
  ```typescript
  async function writeJsonAtomic(filePath: string, data: any) {
    const tmpPath = `${filePath}.${Date.now()}.tmp`;
    await fs.promises.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.promises.rename(tmpPath, filePath);
  }
  ```
- **Zero Credentials in Git**: All runtime data, sessions, and SQLite databases are stored in the OS user directory and excluded via `.gitignore`.

---

## 6. Sensitive Evidence Sanitization
Before findings and reports are written to SQLite or rendered on screen:
- **Authorization Headers**: Stripped of Bearer tokens (`Bearer [REDACTED]`).
- **Cookies**: Session identifiers like `JSESSIONID`, `PHPSESSID`, `connect.sid`, `jwt` are masked (`JSESSIONID=[REDACTED]`).
- **URL Query Parameters**: High-risk query keys (`token`, `key`, `apiKey`, `password`, `secret`) are replaced with `[REDACTED]`.

---

## 7. Chrome Extension Native Messaging Boundary
- **Origin Validation**: Native Messaging Host only accepts messages from the official SecureScope extension ID (`chrome-extension://<EXTENSION_ID>/`).
- **Message Payload Limit**: Payloads over 1MB (1,048,576 bytes) are rejected immediately.
- **No Direct Arbitrary Commands**: The Native Messaging Host only supports three explicit message verbs:
  - `PING`: Verifies host connection.
  - `GET_STATUS`: Queries active session and plan.
  - `REQUEST_SCAN`: Submits URL and mode for Main-process evaluation.

