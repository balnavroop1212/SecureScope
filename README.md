# SecureScope — Desktop Website Security Assessment Platform

> **A Production-Oriented Desktop Cybersecurity SaaS Platform for Authorized Educational Security Assessments.**  
> Built with Electron, React 18, TypeScript, Tailwind CSS, SQLite, and Chrome Manifest V3 Native Messaging.

---

## 1. Executive Summary & Purpose

**SecureScope** is a modern, high-end desktop application engineered for web developers, DevSecOps engineers, and academic researchers to assess the security posture of websites they own or have explicit authorization to test. 

Designed for a **final-year computer science project showcase**, SecureScope demonstrates production-grade full-stack architecture, strict security boundaries, robust local persistence, explainable vulnerability scoring, executive report generation, and bidirectional desktop-to-browser extension integration.

### Core Philosophy:
- **Non-Destructive & Passive**: Zero aggressive fuzzing, zero denial-of-service, zero exploit payloads. All checks evaluate defensive configurations, cryptographic parameters, and information leaks.
- **SSRF Hardened**: Automatic pre-flight DNS inspection strictly isolates loopback (`127.0.0.0/8`), RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and AWS/cloud link-local metadata IP (`169.254.169.254`).
- **Explainable Scoring**: Provides a deterministic 0–100 posture score and letter grade (A–F) directly correlated to identified severity penalties, mapped to **CWE** and **OWASP Top 10** standards.
- **Enterprise Aesthetics**: Styled with an **Obsidian Black** base (`#090E17`), **Graphite Navy** surfaces (`#111B2A`), **Electric Cyan** primary highlights (`#37C8F2`), and **Neon Violet** accents (`#A58BFA`).

---

## 2. System Architecture & Process Isolation

SecureScope adheres to a strict 3-tier Electron boundary:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      ELECTRON MAIN PROCESS                             │
│  - Independent Entitlement Enforcement (canScanMode, canExportPdf)     │
│  - SSRF Pre-flight DNS Validation (ScopeValidator)                     │
│  - Passive Security Engine (TlsCheck, HeadersCheck, CookiesCheck, etc) │
│  - Local Auth Repository (Atomic users.json + Scrypt)                  │
│  - SQLite Database (sql.js scans.db with ACID compliance)              │
│  - Native PDF Vector Renderer (printToPDF)                             │
│  - Native Messaging Host Server (32-bit Little-Endian wire protocol)   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                      Strict IPC (Typed & Sandboxed)
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│                         PRELOAD BRIDGE                                 │
│  - nodeIntegration: false, contextIsolation: true, sandbox: true       │
│  - Narrow window.electronAPI exposed via contextBridge                 │
│  - Zero raw Node.js APIs (fs, net, child_process) leaked to frontend    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                             Window Context
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│                      VITE / REACT RENDERER                             │
│  - React 18 + Strict TypeScript + React Router (HashRouter)            │
│  - Tailwind CSS Cyber Palette + JetBrains Mono & Inter typography      │
│  - Dynamic Recharts Visualizations (Severity Breakdown & Posture Bar) │
│  - React Hook Form + Zod Schema Validation                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tiered Business & Subscription Model

SecureScope features a dual-tier entitlement architecture enforced at both the UI layer and independently validated in the Electron Main process:

| Capability | Free Tier (₹0) | Pro Tier (₹299 + GST placeholder) |
| :--- | :---: | :---: |
| **Dashboard & Assessment KPIs** | ✅ Full Access | ✅ Full Access |
| **Normal Passive Assessment** | ✅ Included | ✅ Included |
| **In-App Vulnerability Reports** | ✅ Full Interactive View | ✅ Full Interactive View |
| **Scan History & Metrics** | ✅ SQLite Persistence | ✅ SQLite Persistence |
| **User Profile Management** | ✅ Included | ✅ Included |
| **Aggressive Scan Mode** (`security.txt`, `robots.txt`, CORS reflection) | 🔒 Upgrade Required | ✅ Unlocked |
| **Private Scan Mode** (Query/token redaction, zero body retention) | 🔒 Upgrade Required | ✅ Unlocked |
| **Executive PDF Report Export** | 🔒 Upgrade Required | ✅ Vector PDF Download |
| **Companion Chrome Extension** | 🔒 Upgrade Required | ✅ One-Click Browser Scanning |
| **Native Host Diagnostics** | 🔒 View Only | ✅ Full Host Registration |

*Note: The platform features a **Demonstration Payment Mode** that allows instant plan toggling between Free and Pro without live payment gateway dependencies.*

---

## 4. Assessment Engine Modules

The non-destructive scanning engine (`ScannerEngine`) executes a sequential, truthful pipeline:

1. **Scope & Protocol Validation**: Enforces `http:` or `https:`. Resolves target host via DNS and blocks private/loopback IP ranges. Provides a dedicated **Local Sandbox Target** mode (`http://localhost:8080`) explicitly tagged with `[DEMO DATA]`.
2. **TLS / SSL Audit (`TlsCheck`)**: Connects via raw TLS sockets, inspects peer certificates, validates validity periods, remaining days, cipher suites, and flags deprecated TLS 1.0/1.1 protocols.
3. **HTTP Defensive Headers (`HeadersCheck`)**: Audits presence and strength of:
   - `Strict-Transport-Security` (HSTS)
   - `Content-Security-Policy` (CSP)
   - `X-Frame-Options` (Clickjacking protection)
   - `X-Content-Type-Options` (MIME sniffing prevention)
   - `Referrer-Policy`
4. **Cookie Security (`CookiesCheck`)**: Parses all `Set-Cookie` headers for `Secure`, `HttpOnly`, and `SameSite` flags.
5. **Information Disclosure (`InfoDisclosureCheck`)**: Detects banner leaks in `Server` and `X-Powered-By` headers.
6. **Pro Discovery (`AggressiveChecks`)**: Safely fetches `/.well-known/security.txt`, audits `robots.txt`, and tests CORS origin reflection.
7. **Explainable Scoring Formula**:
   $$\text{Penalty} = 30 \times C + 18 \times H + 8 \times M + 3 \times L$$
   $$\text{Posture Score} = \max(0, 100 - \text{Penalty})$$
   - **Grade A**: 90–100 | **Grade B**: 80–89 | **Grade C**: 70–79 | **Grade D**: 60–69 | **Grade F**: 0–59

---

## 5. Technology Stack Decisions

- **Desktop Runtime**: Electron v33+ (configured with `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`).
- **Frontend**: React 18, Vite 6, TypeScript 5 (Strict Mode), Tailwind CSS 3, Lucide React icons, Recharts.
- **Local Persistence**:
  - **Auth**: Versioned JSON schema (`%APPDATA%/SecureScope/data/users.json`) using atomic temporary file renames. Passwords hashed using **Scrypt** with 32-byte cryptographically secure salts and constant-time verification (`crypto.timingSafeEqual`).
  - **Scans & Findings**: **SQLite** via `sql.js` (WebAssembly SQLite). Chosen over native C++ bindings (`better-sqlite3`) to guarantee 100% cross-platform zero-dependency compilation on any Windows machine without requiring Visual Studio C++ build tools.
- **PDF Reporting**: Electron's native `BrowserWindow.webContents.printToPDF` with cyber-executive HTML styling.
- **Browser Extension**: Google Chrome Manifest V3 using Windows Native Messaging (`com.securescope.desktop`) with a 32-bit unsigned little-endian binary framing protocol.

---

## 6. Quick Start & Developer Guide

### Prerequisites
- **Node.js**: v20+ or v22+
- **npm**: v10+
- **Operating System**: Windows 10/11 (or macOS / Linux for desktop core)
- **Google Chrome**: (for companion extension)

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/<your-username>/SecureScope.git
cd SecureScope
npm install
```

### 2. Run in Development Mode
Launches the Vite React development server on `http://localhost:5173` and boots Electron:
```bash
npm run dev
```

### 3. Run Automated Test Suites
SecureScope includes 27 comprehensive automated unit and integration tests across 5 test suites:
```bash
npm test
```
To run specific suites:
- `npm run test:foundation`: Electron window lifecycle and CSP check.
- `npm run test:auth`: Scrypt hashing, duplicate email rejection, session hydration.
- `npm run test:scanner`: SSRF blocking, passive checks, report persistence.
- `npm run test:premium`: Feature gating, simulated demo upgrade, PDF HTML layout, SQLite deletion.
- `npm run test:extension`: 32-bit LE binary framer, Pro entitlement check, SSRF block, Manifest V3 verification.

### 4. Build Desktop Application
Compiles Electron TypeScript backend and packages the Vite frontend into `dist`:
```bash
npm run build
```

### 5. Package for Windows
Creates an unpacked executable in `release/win-unpacked`:
```bash
npm run package
```

---

## 7. Companion Chrome Extension Setup

The companion extension allows initiating authorized assessments directly from your browser toolbar.

### Step 1: Register the Windows Native Messaging Host
Run the automated registration script (or click **Register Host** on the `/extension` page in the desktop app):
```bash
npm run register:extension
```
*This configures the registry key at `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.securescope.desktop` and writes the host manifest to `%APPDATA%\SecureScope\host\`.*

### Step 2: Load Unpacked in Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the directory:
   `<SecureScope_DIR>/apps/chrome-extension`
5. The SecureScope Companion icon will appear in your Chrome toolbar.

### Step 3: Trigger an Assessment
1. Open any HTTP or HTTPS website in Chrome.
2. Click the SecureScope extension icon in the toolbar.
3. Confirm the target URL and declare authorized scope.
4. Click **Assess Website**. The desktop application securely conducts the scan and saves the full report to `scans.db`!

---

## 8. Repository Structure

```
SecureScope/
├── apps/
│   ├── chrome-extension/            # Companion Chrome Extension (Manifest V3)
│   │   ├── assets/                  # 16px, 48px, 128px PNG icons
│   │   ├── manifest.json            # Manifest V3 specification
│   │   ├── background.js            # Chrome service worker
│   │   ├── popup.html               # Obsidian dark popup interface
│   │   ├── popup.css                # Extension styles
│   │   └── popup.js                 # Native messaging dispatcher
│   └── desktop/                     # Electron Desktop Application
│       ├── src/
│       │   ├── main/                # Main Process (Node runtime)
│       │   │   ├── index.ts         # Main entry & IPC router
│       │   │   └── services/
│       │   │       ├── auth/        # LocalAuthRepository, Scrypt, EntitlementService
│       │   │       ├── native-host/ # NativeFramer, NativeHostEngine, securescope-host
│       │   │       ├── pdf/         # PdfGeneratorService (printToPDF)
│       │   │       ├── scanner/     # ScannerEngine, ScopeValidator, Passive Checks
│       │   │       └── storage/     # SQLiteScanRepository (sql.js scans.db)
│       │   ├── preload/             # Context bridge (window.electronAPI)
│       │   ├── renderer/            # React 18 UI
│       │   │   ├── components/      # UI primitives, layout, command bar, report view
│       │   │   ├── pages/           # Dashboard, History, Extension, Profile, Subscription
│       │   │   └── context/         # AuthContext
│       │   └── shared/              # Common TypeScript interfaces & DTOs
│       ├── tsconfig.electron.json
│       ├── tsconfig.renderer.json
│       └── vite.config.ts
├── docs/                            # Architectural specifications
│   ├── ARCHITECTURE.md              # 3-tier boundary diagrams
│   ├── CHROME_EXTENSION_SETUP.md    # Native messaging protocol specs
│   ├── DATABASE_SCHEMA.md           # SQLite & JSON schemas
│   ├── IMPLEMENTATION_PLAN.md       # Master roadmap & status log
│   ├── SCANNER_DESIGN.md            # Non-destructive check design
│   ├── SCREEN_BREAKDOWN.md          # Screen-by-screen UX specifications
│   └── SECURITY.md                  # Threat model & CSP policies
├── scripts/                         # Operational & verification scripts
│   ├── dev.js                       # Dev runner with Vite + Electron
│   ├── generate-icons.js            # Dependency-free PNG generator
│   ├── register-extension.js        # Windows registry configuration
│   └── verify-foundation.js         # Window lifecycle automated check
├── tests/                           # Automated test suites (27 tests)
│   ├── auth.test.js
│   ├── extension.test.js
│   ├── premium-history.test.js
│   └── scanner.test.js
├── package.json
└── README.md
```

---

## 9. Academic Showcase Highlights

- **Strict Separation of Concerns**: Zero business logic or file operations reside in UI components; all data operations pass through strictly typed Repository interfaces (`IAuthRepository`, `IScanRepository`) allowing future Firebase cloud migration with zero UI changes.
- **Timing Attack Mitigation**: Credential verification employs `crypto.timingSafeEqual` over Scrypt hashes to prevent side-channel timing attacks.
- **SSRF Immunity**: Custom `ScopeValidator` combines DNS pre-flight inspection with subnet boundary enforcement to defeat loopback spoofing and private intranet probing.
- **Explainable Metrics**: Avoids arbitrary black-box scores by documenting deterministic severity penalties for every CWE finding.
- **Binary Wire Protocol**: Implements RFC-compliant 32-bit unsigned little-endian framing for browser-to-desktop Native Messaging.

---

## 10. Ethical & Legal Disclaimer

SecureScope is strictly developed for **authorized educational assessments, defensive configuration auditing, and site owners evaluating their own web properties**. Users must ensure they have explicit, written authorization before assessing any third-party infrastructure. The authors assume no liability for misuse.

