# SecureScope — Agent Guidelines & Project Standards

> This document defines persistent architecture, coding, design, security, and development workflow standards for **SecureScope**. All AI agents and developers working on this codebase must adhere strictly to these rules.

---

## 1. Project Overview & Identity
- **Product Name**: SecureScope
- **Category**: Desktop Website Security Assessment Platform
- **Audience**: Authorized educational assessments, web developers, security engineers, academic showcase.
- **Tone & Identity**: High-end cybersecurity SaaS product. Modern, technical, trustworthy, precise. Obsidian dark aesthetic with electric cyan and neon violet accents. Never a generic admin dashboard or "gamer-neon" toy.

---

## 2. Core Architecture & Process Separation
SecureScope operates as an Electron desktop application with a strict 3-tier boundary:

```
[ Electron Main Process ]  <-- IPC (Typed, Sandboxed) -->  [ Preload Bridge ]  <-- Window Context -->  [ Vite/React Renderer ]
         |
         +--> [ Local Auth Repository (users.json) ]
         +--> [ SQLite Database (scans.db) ]
         +--> [ Security Scanner Engine Service ]
         +--> [ Native Messaging Host for Chrome ]
```

### Strict Process Isolation Rules:
1. **Never enable `nodeIntegration` in renderer**. It must always remain `false`.
2. **Never disable `contextIsolation`**. It must always remain `true`.
3. **Never expose raw `child_process`, `fs`, `net`, or unrestricted `ipcRenderer` to the frontend**.
4. **All frontend-to-backend communication must pass through `window.electronAPI`** exposed via `contextBridge.exposeInMainWorld` with strict TypeScript signatures.
5. **Main Process validates all operations**: Never rely exclusively on UI checks for premium feature gating, URL validation, or file operations. The Main process must independently enforce entitlement and safety boundaries.

---

## 3. Technology Stack Standards
- **Desktop Runtime**: Electron (latest stable, target v33+)
- **Frontend Framework**: React 18+ with TypeScript (strict mode enabled)
- **Bundler & Dev Server**: Vite with `@vitejs/plugin-react`
- **Styling**: Tailwind CSS with custom cybersecurity dark palette
- **Icons**: Lucide React (`lucide-react`)
- **Visualizations**: Recharts for severity breakdown, timeline, and security posture
- **Form Handling**: React Hook Form + Zod schema validation
- **Routing**: React Router DOM (v6+ hash router for seamless desktop file/path resolution)
- **Local Persistence**:
  - Auth: Versioned JSON (`%APPDATA%/SecureScope/data/users.json`) with atomic file writes.
  - Scans & Findings: SQLite database (`%APPDATA%/SecureScope/data/scans.db`).
- **Browser Extension**: Chrome Manifest V3 using Native Messaging (`com.securescope.desktop`).

---

## 4. Visual Design System Rules
Adhere strictly to the color palette and typography:

### Color Palette:
- **Obsidian Black (Background Base)**: `#090E17`
- **Graphite Navy (Card / Surface)**: `#111B2A`
- **Slate Blue (Borders / Inputs / Hover)**: `#1D2A3C`
- **Electric Cyan (Primary Brand Accent)**: `#37C8F2`
- **Neon Violet (Secondary Brand Accent)**: `#A58BFA`
- **Primary Text**: `#F1F5F9`
- **Secondary Text**: `#94A3B8`
- **Muted Border**: `#29364A`

### Severity Colors:
- **Critical**: `#DC2626` (Red-600)
- **High**: `#EF4444` (Red-500)
- **Medium**: `#F59E0B` (Amber-500)
- **Low**: `#38BDF8` (Sky-400)
- **Informational**: `#94A3B8` (Slate-400)
- **Success / Passed**: `#22C55E` (Emerald-500)

### Typography:
- **Interface UI Font**: Inter, system-ui, sans-serif
- **Technical Font**: JetBrains Mono, monospace (URLs, headers, scan IDs, hashes, evidence)

### UI Rules:
- Cards must use rounded corners (`rounded-xl` or `rounded-2xl`) with subtle 1px border (`border border-[#29364A]`).
- Thin subtle glows on focus or active status (`shadow-[0_0_15px_rgba(55,200,242,0.15)]`).
- Avoid heavy drop shadows or rainbow neon clutter.
- Always implement loading skeletons and graceful empty states.
- Support 1280x800 resolution seamlessly while scaling responsively to 1080p, 1440p, and 4K displays.

---

## 5. Security & Safe Scanning Mandates
SecureScope is an educational and authorized assessment platform.

### Permitted Scanning Activities:
- Safe, non-destructive, passive, and low-impact configuration analysis:
  - TLS / SSL certificate validation and expiry monitoring.
  - HTTP Security Headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
  - Cookie security flags (`Secure`, `HttpOnly`, `SameSite`).
  - Response header information leaks (`Server`, `X-Powered-By`).
  - Mixed-content detection and insecure passive references.
  - Safe, controlled metadata inspection (e.g., `robots.txt`, `security.txt`).

### Strictly Prohibited:
- **No exploitation or active attack payloads (SQLi, XSS injections, command injections)**.
- **No brute-force or credential stuffing**.
- **No denial-of-service (DoS) or load flooding**.
- **No evasion, stealthing, or WAF bypass techniques**.
- **No unauthorized host port scanning or vulnerability fuzzing**.

### SSRF & Target Safeguards:
- Always enforce URL scheme `http:` or `https:`.
- Block scanning of loopback (`127.0.0.1`, `localhost`, `::1`), private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and link-local (`169.254.0.0/16`) in normal target mode.
- Provide a dedicated, clearly labeled "Local Demo Target" mode for offline testing.
- Cap redirection limits (maximum 3 hops) and do not follow untrusted cross-origin redirects automatically.
- Enforce request timeouts (10 seconds per check).

---

## 6. Password & Data Security
- Never store plaintext passwords.
- Use secure hashing (e.g. Scrypt with unique salt or Argon2id) and constant-time comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.
- Never write runtime data or credentials into the Git repository.
- Runtime user data lives strictly in `app.getPath('userData')`.
- All file writes must be atomic (write to `.tmp` file then rename).
- Sanitize sensitive data in findings: strip auth tokens, session cookies, and private credentials from logged evidence.

---

## 7. Development & Agent Workflow Rules
1. **Maintain `IMPLEMENTATION_PLAN.md`**: Update task statuses, test outcomes, and notes after finishing every milestone.
2. **Never leave dead controls**: If a button or menu exists, it must either perform its real action or clearly display its functional requirement / upgrade gate.
3. **Repository Pattern for Data**: UI components must never access SQLite or JSON files directly. All persistence must go through typed repository interfaces (`AuthRepository`, `ScanRepository`, `SubscriptionRepository`, etc.) so future Firebase integration requires zero UI rewrites.
4. **No Synthetic / Hallucinated Data in Actual Scans**: If mock data is used for testing or demonstration, it must be explicitly flagged with `isDemo: true` and labeled "DEMO DATA" in the UI. Real scans must only report actual observations.
5. **Strict TypeScript & Zero Linter Suppression**: No `any` escapes without explicit architectural rationale. All IPC message payloads must be strongly typed.

