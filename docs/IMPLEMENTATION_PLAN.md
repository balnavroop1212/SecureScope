# SecureScope — Master Implementation Plan & Milestone Roadmap

> **Tracking Directive**: This document is updated after completing each milestone to log implemented features, files modified, test verification results, and any technical decisions.

---

## Milestone Summary & Progress Dashboard

| Milestone | Title | Focus Area | Status | Target Completion |
| :---: | :--- | :--- | :---: | :---: |
| **M1** | **Planning & Architecture** | Blueprint, Docs, Schemas, Standards | **COMPLETED** | Day 1 |
| **M2** | **Foundation & Design System** | Electron, React, Vite, Tailwind, Shell | **COMPLETED** | Day 2 |
| **M3** | **Authentication Module** | JSON Store, Hashing, Signup, Login | **COMPLETED** | Day 3 |
| **M4** | **Dashboard & Scan Interface** | KPI Cards, Command Input, Gates | **COMPLETED** | Day 4 |
| **M5** | **Assessment Engine & Reports** | Passive Checks, SSL, Headers, Reports | **COMPLETED** | Day 5 |
| **M6** | **History Module** | SQLite Persistence, Filters, Deletion | *READY TO START* | Day 6 |
| **M7** | **Profile & Premium System** | Entitlements, Demo Checkout, PDF | *PLANNED* | Day 7 |
| **M8** | **Chrome Extension Companion** | Manifest V3, Native Messaging Host | *PLANNED* | Day 8 |
| **M9** | **Testing, Packaging & Delivery** | Full E2E, Installer, Final Showcase | *PLANNED* | Day 9 |

---

## Detailed Milestone Task Breakdown

### Milestone 1 — Planning & Architecture
**Goal**: Establish comprehensive system architecture, persistent project rules, repository abstractions, database schemas, scanner pipeline design, and execution roadmap before writing code.

- [x] Inspect workspace and development environment (Node v24, npm 11, Windows 11).
- [x] Create persistent project guidelines in `AGENTS.md`.
- [x] Author system architecture document (`docs/ARCHITECTURE.md`).
- [x] Author database schema specification for JSON & SQLite (`docs/DATABASE_SCHEMA.md`).
- [x] Author security assessment engine design (`docs/SCANNER_DESIGN.md`).
- [x] Author security architecture and threat model (`docs/SECURITY.md`).
- [x] Author complete screen-by-screen UX breakdown (`docs/SCREEN_BREAKDOWN.md`).
- [x] Author Chrome extension and Native Messaging setup guide (`docs/CHROME_EXTENSION_SETUP.md`).
- [x] Author Master Implementation Plan with milestone tracking (`docs/IMPLEMENTATION_PLAN.md`).
- [x] Present architecture and plan to User for review and formal approval (Approved).

---

### Milestone 2 — Foundation & Design System
**Goal**: Scaffold monorepo / directory layout, configure Electron with Vite and React/TypeScript, establish cybersecurity dark theme, build navigation shell (sidebar + header), and verify window lifecycle.

- [x] Initialize root `package.json` with workspace configuration and dependencies.
- [x] Configure TypeScript (`tsconfig.json`, `tsconfig.electron.json`, `tsconfig.renderer.json`).
- [x] Scaffold `apps/desktop`:
  - [x] Configure Vite for Electron (`apps/desktop/vite.config.ts`).
  - [x] Configure Electron main entry (`apps/desktop/src/main/index.ts`) with security preferences (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, CSP).
  - [x] Configure Preload script (`apps/desktop/src/preload/index.ts`) with typed `window.electronAPI`.
  - [x] Configure React 18, React Router DOM (HashRouter), and Tailwind CSS.
- [x] Implement Cybersecurity Dark Theme:
  - [x] Configure color tokens in Tailwind (`#090E17`, `#111B2A`, `#1D2A3C`, `#37C8F2`, `#A58BFA`, Severity scale).
  - [x] Setup Inter and JetBrains Mono typography fonts and custom cyber scrollbar.
- [x] Build Reusable UI Atoms & Components:
  - [x] `Button` (variants: primary cyan, secondary slate, danger red, ghost, violet; sizes: sm, md, lg; loading spinner).
  - [x] `Card` (variants: default, interactive, glass; subtle cyan glow options).
  - [x] `Badge` (severity badges: Critical, High, Medium, Low, Info, Success; plan badges: Free, Premium with animated pulse dot).
  - [x] `Modal` (accessible glassmorphic dialog with escape key binding and blur backdrop).
  - [x] `Skeleton` (rectangular, circular, text pulse loaders).
- [x] Build Global Layout:
  - [x] Fixed Left Sidebar (`Sidebar.tsx`) with SecureScope branding, navigation links, and plan status badge.
  - [x] Sticky Top Header (`Header.tsx`) with page title, breadcrumbs, sandbox demo mode toggle, and avatar dropdown menu with logout confirmation modal.
  - [x] Main content container (`AppLayout.tsx`) with smooth route navigation.
- [x] Build Page Foundations & Routing:
  - [x] `DashboardPage` with personalized greeting, 4 dynamic KPI cards, and signature command input preview.
  - [x] `HistoryPage` with URL search input, mode filter, sort controls, and empty state.
  - [x] `ExtensionPage` with installation guide, Native Messaging host status, and Pro upgrade gate.
  - [x] `SubscriptionPage` with Free (₹0) vs Pro (₹299 + GST) comparison and interactive simulated checkout.
  - [x] `ProfilePage` with initials avatar, editable personal details, membership card, and preferences.
- [x] Verification:
  - [x] Ran TypeScript typechecking (`npm run typecheck`) across both Electron and React targets (0 errors).
  - [x] Ran complete production build (`npm run build`) generating `dist/` and `dist-electron/` bundles.
  - [x] Built and executed automated window verification test (`node scripts/verify-foundation.js`).
  - [x] Verified window opens at 1440x900 with dark theme, mounts React cleanly, registers `window.electronAPI`, and handles route switching.

---

### Milestone 3 — Authentication Module
**Goal**: Build robust local authentication using versioned JSON file storage, secure Scrypt password hashing, session management, and polished Login/Signup screens.

- [x] Define Auth Domain interfaces in `apps/desktop/src/shared/types.ts`:
  - [x] `User`, `StoredUserRecord`, `UsersJsonSchema`, `UserSession`, `SignupDTO`, `LoginDTO`, `AuthResponse`.
- [x] Implement `PasswordHasher` (`apps/desktop/src/main/services/auth/PasswordHasher.ts`):
  - [x] High-entropy 32-byte salt generation via `crypto.randomBytes`.
  - [x] Scrypt hashing ($N=16384, r=8, p=1$, keylen 64 bytes).
  - [x] Constant-time password verification via `crypto.timingSafeEqual` (zero timing side-channel leakage).
- [x] Implement `LocalAuthRepository` (`apps/desktop/src/main/services/auth/LocalAuthRepository.ts`):
  - [x] Resolve `%APPDATA%/SecureScope/data/users.json` with fallback for testing.
  - [x] Implement atomic file writing via `.tmp` write and rename.
  - [x] Email normalization (trim, lowercase) and unique email check.
  - [x] Real-time password complexity validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol).
  - [x] Sanitized user records (password hashes stripped before exposure).
  - [x] Session persistence in `%APPDATA%/SecureScope/data/session.json`.
- [x] Wire IPC Auth channels in Preload & Main:
  - [x] `auth:signup`, `auth:login`, `auth:logout`, `auth:getCurrentUser`, `auth:updateProfile`, `auth:updatePlan`.
- [x] Build React Authentication Layer:
  - [x] Global `AuthContext` (`apps/desktop/src/renderer/context/AuthContext.tsx`) for user state, session hydration, login, signup, logout.
  - [x] Protected Route wrapper (`ProtectedRoute` and `PublicRoute`) redirecting unauthenticated users to `/login`.
  - [x] Professional `LoginPage` (`apps/desktop/src/renderer/pages/LoginPage.tsx`) with visibility toggle, remember me, error alerts, and account reset guidance modal.
  - [x] Professional `SignupPage` (`apps/desktop/src/renderer/pages/SignupPage.tsx`) with real-time password strength meter, match validation, and authorized scope consent checkbox.
  - [x] Integrated `ProfilePage` and `AppLayout` with live authenticated user state.
- [x] Verification & Automated Tests:
  - [x] Auth test suite in `tests/auth.test.js` covering 9 critical cases (100% passed).
  - [x] Verification test in `scripts/verify-foundation.js` (100% passed).
  - [x] Production build and strict TypeScript typecheck verified (0 errors).

---

### Milestone 4 — Dashboard & Scan Interface
**Goal**: Build the flagship security command interface, dynamic KPI metrics cards, scan mode selection, and feature entitlement gating.

- [x] Implement Dashboard Layout (`apps/desktop/src/renderer/pages/DashboardPage.tsx`):
  - [x] Section A: Personalized welcome greeting dynamically displaying authenticated user name.
  - [x] Section B: 4 dynamic KPI cards (Total Scans, Total Findings, High-Risk Findings, Unique Websites) queried from SQLite persistence.
- [x] Build Signature Security Command Input Component (`SecurityCommandInput.tsx`):
  - [x] ChatGPT-inspired large rounded command container with cyan glow and clean internal layout.
  - [x] URL input with clear button, auto-protocol prefixing (`https://`), and live validation.
  - [x] Three Scan Mode selector cards: Normal (Free), Aggressive (Pro), Private (Pro).
  - [x] Mandatory Scope Authorization declaration checkbox.
  - [x] "Start Scan" button with radar pulse animation and loading states.
- [x] Implement Feature Gating & Entitlement:
  - [x] Dual-layer gating (Main process `EntitlementService` + UI `UpgradeModal` component).
  - [x] Interactive upgrade modal when a Free user selects Aggressive or Private scan mode.
- [x] Build Scan Progress UI (`ScanProgressPanel.tsx`):
  - [x] Stage-by-stage truthful progress tracker (Validating Target -> Authorized Scope -> Public TLS Info -> Security Config -> Findings Analysis -> Report Generation).
  - [x] Current check indicator, percentage bar, and completed checks counter.
  - [x] Safe "Cancel Scan" button utilizing `AbortController`.
- [x] Verification:
  - [x] Verified URL validation rejects empty or invalid schemes.
  - [x] Verified Free user selecting Aggressive/Private triggers upgrade modal.
  - [x] Verified cancellation cleanly terminates in-flight assessment.

---

### Milestone 5 — Assessment Engine & Vulnerability Reports
**Goal**: Implement the modular scanning engine with safe, passive checks, SSRF protection, finding normalization, report generation, and in-place dashboard rendering.

- [x] Build `ScannerEngine` Service in `apps/desktop/src/main/services/scanner/`:
  - [x] `ScopeValidator.ts`: Protocol verification (`http:` / `https:`), DNS pre-flight resolution, strict rejection of loopback (`127.0.0.0/8`, `::1`), private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and link-local (`169.254.0.0/16`).
  - [x] `TlsCheck.ts`: Native socket peer certificate inspection, expiration audit, days remaining, cipher, and legacy TLS 1.0/1.1 deprecation checks.
  - [x] `HeadersCheck.ts`: Analysis of HSTS, CSP, X-Frame-Options (Clickjacking), X-Content-Type-Options (MIME Sniffing), and Referrer-Policy.
  - [x] `CookiesCheck.ts`: Inspection of `Set-Cookie` for `Secure`, `HttpOnly`, and `SameSite` flags.
  - [x] `InfoDisclosureCheck.ts`: Evaluation of `Server` banner and `X-Powered-By` technology leak headers.
  - [x] `AggressiveChecks.ts` (Pro Mode): Safe passive discovery of `/.well-known/security.txt` compliance, `robots.txt`, and safe CORS origin reflection audit.
  - [x] `DemoTargetCheck.ts`: Realistic instructional findings for local sandbox mode, unambiguously tagged with `[DEMO DATA]` and `isDemo: true`.
  - [x] Private Mode Handler: Sensitive token and query parameter redaction, zero full-body retention.
- [x] Implement Finding Classification & Scoring:
  - [x] Severity classification (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFORMATIONAL`).
  - [x] Explainable 0–100 posture score calculation formula ($\text{Score} = \max(0, 100 - \sum \text{penalties})$) and Grade classification (A, B, C, D, F).
  - [x] CWE and OWASP Top 10 references attached to every observation.
- [x] Build In-Place Report UI (`VulnerabilityReportView.tsx`):
  - [x] Renders seamlessly below the command bar on the same dashboard page.
  - [x] Prominent `[DEMO DATA]` indicator banner when assessment is conducted in Sandbox Mode.
  - [x] Assessment metadata header (domain, timestamp, duration, score badge, IP).
  - [x] Executive summary box.
  - [x] Severity distribution cards + Recharts bar chart visualization.
  - [x] Interactive Findings Accordion with search, severity filter tabs, expandable impact/remediation drawers, and "Copy Evidence" button.
  - [x] Assessment Coverage & Limitations card.
  - [x] Action toolbar (PDF download gate, reset assessment).
- [x] SQLite Report Persistence:
  - [x] Built `SQLiteScanRepository` (`apps/desktop/src/main/services/storage/SQLiteScanRepository.ts`) using `sql.js` (zero build tool compilation issues, ACID compliance, atomic persistence to `scans.db`).
- [x] Verification:
  - [x] Automated test suite in `tests/scanner.test.js` covering 6 critical cases (100% passed).
  - [x] Total automated test suite (`npm test`) passes 16/16 tests across Foundation, Auth, and Scanner.

---

### Milestone 6 — History Module
**Goal**: Persist all scan records and findings in SQLite, build the History screen with multi-criteria filters, report details viewer, and deletion handling.

- [ ] Implement `SQLiteScanRepository`:
  - [ ] Initialize SQLite database at `%APPDATA%/SecureScope/data/scans.db`.
  - [ ] Execute schema migrations (`scans`, `findings`, `reports`, `scan_checks`).
  - [ ] Implement methods: `saveScan`, `saveReport`, `getScansByUser`, `getReportByScanId`, `deleteScan`, `getDashboardMetrics`.
- [ ] Build History Screen (`/history`):
  - [ ] Top filter bar: URL search input, Scan Mode filter, Severity filter, Status filter, Clear button.
  - [ ] Data table with columns: Website, Scan Date, Mode, Findings summary pills, Highest Severity, Status, Actions.
  - [ ] Actions: "View Report" modal, "Download PDF" (premium gated), "Delete" with confirmation dialog.
  - [ ] Loading skeleton, empty state ("No scans found"), and error banner.
- [ ] Verification:
  - [ ] Perform a scan on Dashboard, navigate to History, and verify record is present.
  - [ ] Test filtering by severity and search keyword.
  - [ ] Test report deletion updates both the table and dashboard KPI statistics.
  - [ ] Verify user data isolation (users cannot see other users' scans).

---

### Milestone 7 — Profile & Premium Subscription System
**Goal**: Implement user profile management, membership status cards, transparent pricing page, simulated checkout flow, and PDF report export.

- [ ] Build Profile Screen (`/profile`):
  - [ ] Circular initials avatar with dynamic color.
  - [ ] Editable First and Last name form.
  - [ ] Membership Card displaying plan status (`FREE` vs `PREMIUM`), start date, expiration.
  - [ ] Logout button with confirmation modal.
- [ ] Build Subscription Screen (`/subscription`):
  - [ ] Dual-tier pricing layout: Free (₹0) vs Premium (₹299 + GST placeholder).
  - [ ] Features checklist matrix.
  - [ ] Demonstration Checkout modal:
    - Clearly marked: "Demonstration Payment — No Real Charges".
    - Simulated card / test payment button.
    - Instant entitlement upgrade via `EntitlementService`.
    - Developer toggle to switch back to Free for test verification.
- [ ] Build PDF Report Generator (Premium):
  - [ ] Server-side or Electron print-to-PDF / PDFKit implementation.
  - [ ] Executive layout: title, executive summary, posture score, findings table, remediation roadmap.
  - [ ] Strict entitlement check in Main process (Free users receive 403).
- [ ] Verification:
  - [ ] Test upgrading Free user to Premium in Demo checkout.
  - [ ] Verify Aggressive Scan and PDF export unlock immediately upon upgrade.
  - [ ] Verify profile reflects updated Premium status.

---

### Milestone 8 — Chrome Extension & Native Messaging Integration
**Goal**: Build Manifest V3 companion Chrome extension, implement Native Messaging host on Windows, and verify end-to-end browser-to-desktop assessment workflow.

- [ ] Scaffold `apps/chrome-extension/`:
  - [ ] `manifest.json` (Manifest V3, `activeTab`, `nativeMessaging`).
  - [ ] Popup UI (`src/popup/`): SecureScope branding, current tab URL display, desktop connection indicator, scan mode buttons, "Start Scan" button.
  - [ ] Background service worker (`src/service-worker/background.ts`): manages `chrome.runtime.sendNativeMessage`.
- [ ] Implement Native Messaging Host (`services/native-messaging-host/`):
  - [ ] 32-bit length-prefixed binary stdio message framer in Node.js.
  - [ ] Host registration script (`scripts/register-extension.js`) creating registry entry in `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.securescope.desktop`.
  - [ ] Bidirectional IPC bridge between host and Electron Main process.
- [ ] Build Desktop Extension Management Screen (`/extension`):
  - [ ] Real-time connection status pill.
  - [ ] Installation instructions with unpacked extension loading guide.
  - [ ] "Register Native Host" and "Test Connection" buttons.
  - [ ] Premium restriction banner for Free accounts.
- [ ] Verification:
  - [ ] Load extension in Chrome.
  - [ ] Click extension on active tab; verify URL is captured.
  - [ ] Trigger scan from extension; verify desktop app executes scan and returns report.

---

### Milestone 9 — Quality Assurance, Packaging & Delivery
**Goal**: Execute comprehensive automated and manual test suites, verify all error boundaries, build Windows installer, and finalize documentation.

- [ ] Quality Assurance & Testing:
  - [ ] Unit tests for `ScopeValidator` (SSRF IP rejection, protocol verification).
  - [ ] Unit tests for `LocalAuthRepository` (Scrypt hashing, timing-safe equality, duplicate rejection).
  - [ ] Unit tests for `EntitlementService` (Free vs Premium permission enforcement).
  - [ ] Integration test for scanner checks against local HTTP/TLS mock server.
- [ ] UI/UX Polish:
  - [ ] Test window resizing down to 1280x800.
  - [ ] Verify zero broken links, missing icons, or unhandled promise rejections.
  - [ ] Audit all evidence fields for sanitization of sensitive values.
- [ ] Windows Desktop Packaging:
  - [ ] Configure `electron-builder` with Windows NSIS installer target.
  - [ ] Ensure clean packaging without including `users.json`, `scans.db`, or developer secrets.
  - [ ] Build and test the executable installer.
- [ ] Final Documentation:
  - [ ] Comprehensive `README.md` with features, setup, commands, and architecture overview.
  - [ ] Final update to `IMPLEMENTATION_PLAN.md` with complete verification report.

