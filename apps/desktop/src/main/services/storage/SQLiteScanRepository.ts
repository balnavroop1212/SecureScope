import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import initSqlJs, { Database } from 'sql.js';
import {
  ScanRecord,
  Finding,
  ScanReport,
  DashboardMetrics,
} from '@shared/types';

export interface IScanRepository {
  initialize(): Promise<void>;
  saveReport(report: ScanReport): Promise<void>;
  getScansByUser(userId: string): Promise<ScanRecord[]>;
  getReportByScanId(scanId: string): Promise<ScanReport | null>;
  getDashboardMetrics(userId: string): Promise<DashboardMetrics>;
  deleteScan(scanId: string, userId: string): Promise<boolean>;
}

export class SQLiteScanRepository implements IScanRepository {
  private readonly dataDir: string;
  private readonly dbFilePath: string;
  private db: Database | null = null;
  private isInitializing: Promise<void> | null = null;

  constructor(customDataDir?: string) {
    if (customDataDir) {
      this.dataDir = customDataDir;
    } else {
      let userData = '';
      try {
        const { app } = require('electron');
        userData = app.getPath('userData');
      } catch {
        userData = path.join(process.env.APPDATA || process.cwd(), 'SecureScope');
      }
      this.dataDir = path.join(userData, 'data');
    }
    this.dbFilePath = path.join(this.dataDir, 'scans.db');
  }

  public async initialize(): Promise<void> {
    if (this.db) return;
    if (this.isInitializing) return this.isInitializing;

    this.isInitializing = (async () => {
      if (!fs.existsSync(this.dataDir)) {
        await fs.promises.mkdir(this.dataDir, { recursive: true });
      }

      const SQL = await initSqlJs();

      if (fs.existsSync(this.dbFilePath)) {
        const fileBuffer = await fs.promises.readFile(this.dbFilePath);
        this.db = new SQL.Database(fileBuffer);
      } else {
        this.db = new SQL.Database();
      }

      this.db.run(`
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          applied_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS scans (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          target_url TEXT NOT NULL,
          normalized_target TEXT NOT NULL,
          scan_mode TEXT NOT NULL,
          status TEXT NOT NULL,
          posture_score INTEGER DEFAULT 0,
          highest_severity TEXT DEFAULT 'INFORMATIONAL',
          started_at TEXT NOT NULL,
          completed_at TEXT,
          duration_ms INTEGER DEFAULT 0,
          scanner_version TEXT NOT NULL,
          target_ip TEXT,
          is_demo INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS findings (
          id TEXT PRIMARY KEY,
          scan_id TEXT NOT NULL,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          severity TEXT NOT NULL,
          confidence TEXT NOT NULL,
          affected_resource TEXT NOT NULL,
          description TEXT NOT NULL,
          impact TEXT NOT NULL,
          evidence TEXT,
          remediation TEXT NOT NULL,
          references_json TEXT,
          detected_at TEXT NOT NULL,
          FOREIGN KEY(scan_id) REFERENCES scans(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS reports (
          id TEXT PRIMARY KEY,
          scan_id TEXT NOT NULL UNIQUE,
          user_id TEXT NOT NULL,
          executive_summary TEXT NOT NULL,
          count_critical INTEGER DEFAULT 0,
          count_high INTEGER DEFAULT 0,
          count_medium INTEGER DEFAULT 0,
          count_low INTEGER DEFAULT 0,
          count_info INTEGER DEFAULT 0,
          count_passed INTEGER DEFAULT 0,
          checks_completed INTEGER DEFAULT 0,
          checks_skipped INTEGER DEFAULT 0,
          checks_failed INTEGER DEFAULT 0,
          limitations_json TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY(scan_id) REFERENCES scans(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_scans_user_started ON scans(user_id, started_at DESC);
        CREATE INDEX IF NOT EXISTS idx_findings_scan_severity ON findings(scan_id, severity);
      `);

      await this.persistDatabase();
    })();

    await this.isInitializing;
  }

  public async saveReport(report: ScanReport): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const s = report.scan;
    this.db.run(
      `INSERT OR REPLACE INTO scans (
        id, user_id, target_url, normalized_target, scan_mode, status,
        posture_score, highest_severity, started_at, completed_at,
        duration_ms, scanner_version, target_ip, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        s.id,
        s.userId,
        s.targetUrl,
        s.normalizedTarget,
        s.scanMode,
        s.status,
        s.postureScore,
        s.highestSeverity,
        s.startedAt,
        s.completedAt || null,
        s.durationMs,
        s.scannerVersion,
        s.targetIp || null,
        s.isDemo ? 1 : 0,
      ]
    );

    // Remove any previous findings for this scan
    this.db.run(`DELETE FROM findings WHERE scan_id = ?;`, [s.id]);

    for (const f of report.findings) {
      this.db.run(
        `INSERT INTO findings (
          id, scan_id, title, category, severity, confidence,
          affected_resource, description, impact, evidence, remediation,
          references_json, detected_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          f.id,
          f.scanId,
          f.title,
          f.category,
          f.severity,
          f.confidence,
          f.affectedResource,
          f.description,
          f.impact,
          f.evidence || '',
          f.remediation,
          JSON.stringify(f.references || []),
          f.detectedAt,
        ]
      );
    }

    this.db.run(
      `INSERT OR REPLACE INTO reports (
        id, scan_id, user_id, executive_summary,
        count_critical, count_high, count_medium, count_low, count_info, count_passed,
        checks_completed, checks_skipped, checks_failed, limitations_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        report.id,
        report.scanId,
        report.userId,
        report.executiveSummary,
        report.findingCounts.critical,
        report.findingCounts.high,
        report.findingCounts.medium,
        report.findingCounts.low,
        report.findingCounts.informational,
        report.findingCounts.passed,
        report.checks.completed,
        report.checks.skipped,
        report.checks.failed,
        JSON.stringify(report.limitations || []),
        report.createdAt,
      ]
    );

    await this.persistDatabase();
  }

  public async getScansByUser(userId: string): Promise<ScanRecord[]> {
    await this.initialize();
    if (!this.db) return [];

    const stmt = this.db.prepare(
      `SELECT * FROM scans WHERE user_id = ? ORDER BY started_at DESC;`
    );
    stmt.bind([userId]);

    const results: ScanRecord[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      results.push({
        id: row.id,
        userId: row.user_id,
        targetUrl: row.target_url,
        normalizedTarget: row.normalized_target,
        scanMode: row.scan_mode,
        status: row.status,
        postureScore: row.posture_score,
        highestSeverity: row.highest_severity,
        startedAt: row.started_at,
        completedAt: row.completed_at || undefined,
        durationMs: row.duration_ms,
        scannerVersion: row.scanner_version,
        targetIp: row.target_ip || undefined,
        isDemo: row.is_demo === 1,
      });
    }
    stmt.free();
    return results;
  }

  public async getReportByScanId(scanId: string): Promise<ScanReport | null> {
    await this.initialize();
    if (!this.db) return null;

    // 1. Fetch scan
    const scanStmt = this.db.prepare(`SELECT * FROM scans WHERE id = ?;`);
    scanStmt.bind([scanId]);
    if (!scanStmt.step()) {
      scanStmt.free();
      return null;
    }
    const scanRow = scanStmt.getAsObject() as any;
    scanStmt.free();

    const scan: ScanRecord = {
      id: scanRow.id,
      userId: scanRow.user_id,
      targetUrl: scanRow.target_url,
      normalizedTarget: scanRow.normalized_target,
      scanMode: scanRow.scan_mode,
      status: scanRow.status,
      postureScore: scanRow.posture_score,
      highestSeverity: scanRow.highest_severity,
      startedAt: scanRow.started_at,
      completedAt: scanRow.completed_at || undefined,
      durationMs: scanRow.duration_ms,
      scannerVersion: scanRow.scanner_version,
      targetIp: scanRow.target_ip || undefined,
      isDemo: scanRow.is_demo === 1,
    };

    // 2. Fetch report metadata
    const repStmt = this.db.prepare(`SELECT * FROM reports WHERE scan_id = ?;`);
    repStmt.bind([scanId]);
    if (!repStmt.step()) {
      repStmt.free();
      return null;
    }
    const repRow = repStmt.getAsObject() as any;
    repStmt.free();

    // 3. Fetch findings
    const fStmt = this.db.prepare(`SELECT * FROM findings WHERE scan_id = ?;`);
    fStmt.bind([scanId]);
    const findings: Finding[] = [];
    while (fStmt.step()) {
      const fRow = fStmt.getAsObject() as any;
      let references: string[] = [];
      try {
        references = JSON.parse(fRow.references_json || '[]');
      } catch {}

      findings.push({
        id: fRow.id,
        scanId: fRow.scan_id,
        title: fRow.title,
        category: fRow.category,
        severity: fRow.severity,
        confidence: fRow.confidence,
        affectedResource: fRow.affected_resource,
        description: fRow.description,
        impact: fRow.impact,
        evidence: fRow.evidence || '',
        remediation: fRow.remediation,
        references,
        detectedAt: fRow.detected_at,
      });
    }
    fStmt.free();

    let limitations: string[] = [];
    try {
      limitations = JSON.parse(repRow.limitations_json || '[]');
    } catch {}

    return {
      id: repRow.id,
      scanId: repRow.scan_id,
      userId: repRow.user_id,
      scan,
      findings,
      executiveSummary: repRow.executive_summary,
      findingCounts: {
        critical: repRow.count_critical,
        high: repRow.count_high,
        medium: repRow.count_medium,
        low: repRow.count_low,
        informational: repRow.count_info,
        passed: repRow.count_passed,
      },
      checks: {
        completed: repRow.checks_completed,
        skipped: repRow.checks_skipped,
        failed: repRow.checks_failed,
      },
      limitations,
      createdAt: repRow.created_at,
    };
  }

  public async getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
    await this.initialize();
    if (!this.db) {
      return { totalScans: 0, totalFindings: 0, highRiskFindings: 0, uniqueWebsites: 0 };
    }

    // 1. Total Scans & Unique Websites
    const scanMetricsStmt = this.db.prepare(`
      SELECT 
        COUNT(id) AS total_scans,
        COUNT(DISTINCT normalized_target) AS unique_targets
      FROM scans 
      WHERE user_id = ?;
    `);
    scanMetricsStmt.bind([userId]);
    let totalScans = 0;
    let uniqueWebsites = 0;
    if (scanMetricsStmt.step()) {
      const row = scanMetricsStmt.getAsObject() as any;
      totalScans = row.total_scans || 0;
      uniqueWebsites = row.unique_targets || 0;
    }
    scanMetricsStmt.free();

    // 2. Total findings & High-Risk findings (Critical + High)
    const findMetricsStmt = this.db.prepare(`
      SELECT 
        COUNT(f.id) AS total_findings,
        SUM(CASE WHEN f.severity IN ('CRITICAL', 'HIGH') THEN 1 ELSE 0 END) AS high_risk
      FROM findings f
      JOIN scans s ON f.scan_id = s.id
      WHERE s.user_id = ?;
    `);
    findMetricsStmt.bind([userId]);
    let totalFindings = 0;
    let highRiskFindings = 0;
    if (findMetricsStmt.step()) {
      const row = findMetricsStmt.getAsObject() as any;
      totalFindings = row.total_findings || 0;
      highRiskFindings = row.high_risk || 0;
    }
    findMetricsStmt.free();

    return {
      totalScans,
      totalFindings,
      highRiskFindings,
      uniqueWebsites,
    };
  }

  public async deleteScan(scanId: string, userId: string): Promise<boolean> {
    await this.initialize();
    if (!this.db) return false;

    this.db.run(`DELETE FROM scans WHERE id = ? AND user_id = ?;`, [scanId, userId]);
    this.db.run(`DELETE FROM findings WHERE scan_id = ?;`, [scanId]);
    this.db.run(`DELETE FROM reports WHERE scan_id = ?;`, [scanId]);

    await this.persistDatabase();
    return true;
  }

  private async persistDatabase(): Promise<void> {
    if (!this.db) return;
    const binary = this.db.export();
    const tmpPath = `${this.dbFilePath}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    await fs.promises.writeFile(tmpPath, Buffer.from(binary));
    await fs.promises.rename(tmpPath, this.dbFilePath);
  }
}
