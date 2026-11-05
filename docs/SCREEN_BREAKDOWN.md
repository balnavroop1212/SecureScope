# SecureScope — Screen-by-Screen UI/UX Specification

## 1. Design System & Global Layout Overview
SecureScope is crafted using a high-density, professional dark cybersecurity aesthetic.
- **Base Canvas**: `#090E17` (Obsidian Black)
- **Surfaces & Cards**: `#111B2A` (Graphite Navy) with `#1D2A3C` / `#29364A` borders.
- **Primary Accents**: `#37C8F2` (Electric Cyan) and `#A58BFA` (Neon Violet).
- **Typography**: Inter (Body & Controls), JetBrains Mono (URLs, Headers, Findings, Severity badges).
- **Responsive Target**: Optimized for 1440x900 and 1280x800 desktop viewports.

```
+-----------------------------------------------------------------------------------------------+
| SecureScope [Logo]           Top Header: [Page Title]             [Plan: FREE/PREM] [Avatar]  |
+-----------------------------------------------------------------------------------------------+
| [Nav Links]         |                                                                         |
| - Dashboard         |                                                                         |
| - Scan History      |                              MAIN CONTENT AREA                          |
| - Chrome Extension  |                                                                         |
| - Subscription      |                                                                         |
| - Profile & Settings|                                                                         |
|                     |                                                                         |
| [Plan Status Card]  |                                                                         |
| [User Mini Profile] |                                                                         |
+---------------------+-------------------------------------------------------------------------+
```

---

## 2. Authentication Flow

### Screen 1.1: Login Screen (`/login`)
- **Visuals**: Centered cybersecurity portal container with obsidian glassmorphic card, cyan ambient glow, SecureScope shield logo.
- **Components**:
  - Email input with envelope icon and auto-focus.
  - Password input with lock icon and eye/eye-off visibility toggle.
  - "Remember me" checkbox.
  - "Forgot password?" placeholder link with informative dialog explaining local account reset procedure.
  - Primary button: "Sign In to SecureScope" with loading spinner state.
  - Error alert banner (e.g., "Invalid email or password").
  - Navigation footer: "Don't have an account? Create one now".

### Screen 1.2: Signup Screen (`/signup`)
- **Components**:
  - Two-column name row: First Name & Last Name.
  - Email input with inline duplicate email validation feedback.
  - Password input with real-time strength meter (Min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special symbol).
  - Confirm Password input with real-time match validation.
  - Mandatory disclaimer checkbox: "I agree to use SecureScope strictly for assessing targets I own or have explicit authorization to test."
  - Primary button: "Create Secure Account" with spinner.
  - Success toast upon registration, auto-redirecting to Login.

---

## 3. Global App Layout (Authenticated Shell)

### Sidebar (Left, Fixed 260px)
- **Top Brand**: Shield logo with animated cyan glow, "SecureScope" typography, version tag `v1.0.0`.
- **Navigation Links**:
  - `Dashboard`: Home icon, active state highlighted with cyan left border and graphite background.
  - `Scan History`: History / Clock icon with count badge.
  - `Chrome Extension`: Puzzle / Browser icon (with subtle lock badge for Free users).
  - `Subscription`: Sparkles / CreditCard icon.
  - `Profile & Settings`: User / Settings icon.
- **Bottom Membership Widget**:
  - Card displaying Plan: `FREE TIER` or `PREMIUM ACTIVE`.
  - Quick upgrade button if on Free plan.
  - User initials circular avatar with name and email snippet.

### Top Header (Height 68px, Sticky)
- **Left**: Current view title (e.g., "Security Assessment Dashboard") + breadcrumb.
- **Center**: Status indicator ("System Ready • Safe Assessment Mode").
- **Right**:
  - Plan Badge (`FREE` in gray/slate, `PREMIUM` in glowing cyan/gold).
  - Quick action: "Demo Sandbox" toggle pill.
  - User Avatar dropdown button:
    - User name & email header.
    - View Profile (`/profile`).
    - Manage Subscription (`/subscription`).
    - Settings (`/settings`).
    - Separator.
    - Logout action (triggers confirmation modal).

---

## 4. Dashboard View (`/`)

### Section A: Personalized Greeting & Header
- "Welcome back, {User.firstName}" with dynamic time-of-day greeting.
- Subtitle: "Assess your website's defensive posture and verify critical security headers, TLS configuration, and cookie hardening."

### Section B: Statistics KPI Cards (Dynamic, Calculated from User's SQLite Scans)
1. **Total Scans**: Numeric count, trend indicator, icon: `Radar`.
2. **Total Vulnerabilities**: Sum of all findings across user history, icon: `AlertTriangle`.
3. **High-Risk Findings**: Sum of Critical + High severity items requiring urgent remediation, icon: `ShieldAlert` with red/amber accents.
4. **Unique Websites Assessed**: Deduplicated domain count, icon: `Globe`.

### Section C: Signature Security Command Input Bar
- Designed as a prominent cybersecurity command interface:
  - Input field with JetBrains Mono styling, placeholder: `https://example.com or your-domain.com`.
  - "Clear" `(X)` icon button.
  - URL validation feedback pill (validates scheme, format, and resolves target).
  - **Scan Mode Selector Cards**:
    - **Normal Scan (Free)**: Badge `FREE`, description: "Passive configuration checks, TLS validation, security headers, cookie audit."
    - **Aggressive Scan (Premium)**: Badge `PREMIUM`, description: "Extended non-destructive passive discovery, CORS audit, robots/security.txt inspection."
    - **Private Scan (Premium)**: Badge `PREMIUM`, description: "Evidence-minimized assessment, sensitive header redaction, zero local body retention."
  - **Scope Authorization Checkbox**: Mandatory checkbox: *"I confirm I own or possess explicit written authorization to test this target."*
  - **Primary Action Button**: "Launch Assessment" with radar/play icon.
  - Free users selecting Aggressive or Private receive an interactive **Premium Upgrade Modal**.

### Section D: Real-Time Scan Progress Panel (Shown during active scan)
- Displays: Target URL, Scan ID, Selected Mode, Execution timer.
- Dynamic Progress Bar (0% to 100%) tracking authentic stages:
  1. *Validating Target*
  2. *Validating Authorized Scope & SSRF Checks*
  3. *Collecting Public Security Information*
  4. *Assessing Security Configuration & Headers*
  5. *Analyzing Findings & Computing Posture*
  6. *Generating Report*
- Completed checks counter: e.g. `12 / 14 checks completed`.
- "Cancel Scan" button to abort safely.

### Section E: In-Place Comprehensive Vulnerability Report
Appears seamlessly on the **same dashboard page** directly beneath the input bar once completed:
- **Report Header**: Target domain, posture grade pill (Grade A/B/C/D/F), numeric score (0-100), duration, timestamp.
- **Executive Summary Box**: Plain-language risk overview.
- **Severity Distribution Cards**: Counts of Critical, High, Medium, Low, Informational, and Passed checks.
- **Interactive Findings Accordion**:
  - Filter findings by severity (All, Critical, High, Medium, Low, Info).
  - Each item expands to show: Affected Resource, Vulnerability Category, Impact description, Technical Evidence, Remediation steps, and references/CWE codes.
  - "Copy Evidence" button.
- **Coverage & Limitations Card**: Explicit disclosure of what was assessed and what passive testing cannot detect.
- **Action Toolbar**:
  - "Export PDF Report" (Premium feature — opens file save dialog; Free accounts trigger upgrade modal).
  - "View in History".
  - "Assess Another Site" (resets input smoothly).

---

## 5. History View (`/history`)
- **Filter & Search Bar**:
  - Search by target website URL or domain keyword.
  - Scan mode dropdown filter (`All`, `Normal`, `Aggressive`, `Private`).
  - Severity dropdown filter (`All`, `Critical`, `High`, etc.).
  - Status dropdown filter (`Completed`, `Failed`, `Cancelled`).
  - Clear filters button.
- **History Data Table**:
  - Columns: Website / Target, Scan Date & Time, Mode Badge, Findings Summary (color-coded chips), Highest Severity, Status, Actions.
  - Actions column:
    - **View Report**: Opens the full report details modal.
    - **Download PDF**: Available for Premium users (Free users see upgrade prompt).
    - **Delete**: Prompts with confirmation dialog ("Are you sure you want to delete this scan record?").
- **Empty States**: Professional illustration and prompt when no scans match filters.

---

## 6. Subscription & Feature Gating View (`/subscription`)
- **Headline**: "Transparent Cybersecurity Assessment Plans"
- **Two-Column Pricing Table**:
  1. **Free Tier (Current or Default)**:
     - ₹0 / Lifetime.
     - Features: Normal Scan, Full in-app vulnerability reports, Complete scan history, User profile management.
     - Status: "Current Active Plan" button disabled or active pill.
  2. **Premium Tier**:
     - **₹299** *(Exclusive of applicable GST)*.
     - Billing duration: Configurable license badge.
     - Features: Everything in Free, plus:
       - Aggressive Scan Mode
       - Private Scan Mode (Evidence Minimization)
       - Executive PDF Report Downloads
       - Companion Chrome Extension Access
       - Priority scanner bandwidth
     - Action Button: "Upgrade to Premium".
- **Demonstration Checkout Modal**:
  - Clearly displays: **"Demonstration Mode — No Real Charges Will Occur"**.
  - Order summary: Base price ₹299 + GST placeholder.
  - Simulated test card details with instant "Simulate Successful Upgrade" button.
  - Instant state transition to Premium with celebratory notification.
  - Ability for developers to switch between Free and Premium for demonstration verification.

---

## 7. Manage Chrome Extension View (`/extension`)
- **Header**: "Chrome Extension Companion"
- **Status Indicator**:
  - `Desktop Native Host Status`: **Connected** (Green) or **Host Not Registered** (Amber).
  - `Extension Pairing Status`: Displays active extension ID and last heartbeat.
- **Free Account Experience**:
  - An attractive locked preview explaining how the Chrome extension enables one-click assessments from the browser.
  - "Unlock Companion Extension with Premium" button.
- **Premium Account Experience**:
  - Step-by-step setup guide:
    1. Open `chrome://extensions` in Google Chrome and enable **Developer Mode**.
    2. Click **Load Unpacked** and select `<SecureScope>/apps/chrome-extension/`.
    3. Run the Windows registration command to register Native Messaging host in `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.securescope.desktop`.
  - **"Register Native Host" One-Click Button**: Runs desktop registration script.
  - **"Test Native Connection" Button**: Exchanges a test ping packet with Chrome to verify bidirectional messaging.

---

## 8. User Profile & Settings View (`/profile`)
- **Avatar Section**: Circular avatar with user initials (`AV`), dynamic background color based on user ID, and `PREMIUM` or `FREE` badge.
- **Personal Details Card**: First Name, Last Name, Email address, Account Creation timestamp.
- **Edit Profile**: Allows modifying First and Last name with validation.
- **Membership Status Card**: Plan name, status (`active` / `inactive`), start date, renewal date.
- **Scanner Preferences**: Default scan timeout (5s - 15s), Local Test Sandbox toggle.
- **Logout Action**: Prompts confirmation dialog before clearing active session and returning to `/login`.

