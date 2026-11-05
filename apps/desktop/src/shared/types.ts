export type ScanMode = 'normal' | 'aggressive' | 'private';
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
export type ConfidenceLevel = 'CONFIRMED' | 'HIGH' | 'MEDIUM' | 'LOW';
export type UserPlan = 'free' | 'premium';

export interface UserSubscription {
  status: 'active' | 'inactive' | 'trial';
  planId: UserPlan;
  startedAt: string | null;
  expiresAt: string | null;
  priceInr: number;
  currency: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  plan: UserPlan;
  subscription: UserSubscription;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoredUserRecord extends User {
  passwordHash: string;
}

export interface UsersJsonSchema {
  schemaVersion: number;
  updatedAt: string;
  users: StoredUserRecord[];
}

export interface SignupDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  termsAccepted?: boolean;
}

export interface LoginDTO {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface UserSession {
  userId: string;
  email: string;
  rememberMe: boolean;
  createdAt: string;
}

export interface Finding {
  id: string;
  scanId: string;
  title: string;
  category: string;
  severity: SeverityLevel;
  confidence: ConfidenceLevel;
  affectedResource: string;
  description: string;
  impact: string;
  evidence: string;
  remediation: string;
  references: string[];
  detectedAt: string;
}

export interface ScanRecord {
  id: string;
  userId: string;
  targetUrl: string;
  normalizedTarget: string;
  scanMode: ScanMode;
  status: ScanStatus;
  postureScore: number;
  highestSeverity: SeverityLevel | 'NONE';
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  scannerVersion: string;
  targetIp?: string;
  isDemo: boolean;
}

export interface ScanReport {
  id: string;
  scanId: string;
  userId: string;
  scan: ScanRecord;
  findings: Finding[];
  executiveSummary: string;
  findingCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
    passed: number;
  };
  checks: {
    completed: number;
    skipped: number;
    failed: number;
  };
  limitations: string[];
  createdAt: string;
}

export interface ScanProgressEvent {
  scanId: string;
  stage: string;
  progressPercent: number;
  checksCompleted: number;
  totalChecks: number;
  currentCheckName: string;
}

export interface DashboardMetrics {
  totalScans: number;
  totalFindings: number;
  highRiskFindings: number;
  uniqueWebsites: number;
}

export interface ExtensionConnectionStatus {
  isHostRegistered: boolean;
  isExtensionConnected: boolean;
  extensionId?: string;
  lastHeartbeat?: string;
}
