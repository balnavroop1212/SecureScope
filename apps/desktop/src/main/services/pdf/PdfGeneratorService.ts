import { BrowserWindow, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { ScanReport } from '@shared/types';

export class PdfGeneratorService {
  /**
   * Generates a professional executive PDF report from ScanReport data using Electron's native printToPDF.
   */
  public static async generatePdf(
    report: ScanReport,
    customOutputPath?: string
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    let offscreenWindow: BrowserWindow | null = null;

    try {
      let targetPath = customOutputPath;

      // If no path specified, prompt user with native save dialog
      if (!targetPath) {
        const sanitizedDomain = report.scan.normalizedTarget.replace(/[^a-zA-Z0-9.-]/g, '_');
        const defaultFilename = `SecureScope-Assessment-${sanitizedDomain}-${Date.now()}.pdf`;

        const saveResult = await dialog.showSaveDialog({
          title: 'Export Executive Security Report (PDF)',
          defaultPath: path.join(process.env.USERPROFILE || process.cwd(), 'Downloads', defaultFilename),
          filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
        });

        if (saveResult.canceled || !saveResult.filePath) {
          return { success: false, error: 'Export cancelled by user.' };
        }
        targetPath = saveResult.filePath;
      }

      // Generate formatted Executive HTML document
      const htmlContent = this.generateHtmlTemplate(report);

      offscreenWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: 1200,
        webPreferences: {
          sandbox: true,
          contextIsolation: true,
        },
      });

      await offscreenWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`
      );

      // Allow DOM to settle
      await new Promise((r) => setTimeout(r, 400));

      const pdfBuffer = await offscreenWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: {
          top: 0.5,
          bottom: 0.5,
          left: 0.5,
          right: 0.5,
        },
      });

      await fs.promises.writeFile(targetPath, pdfBuffer);
      return { success: true, filePath: targetPath };
    } catch (err: any) {
      console.error('[PdfGeneratorService] Failed to export PDF:', err);
      return { success: false, error: err.message || 'PDF Generation failed' };
    } finally {
      if (offscreenWindow && !offscreenWindow.isDestroyed()) {
        offscreenWindow.destroy();
      }
    }
  }

  /**
   * Constructs an executive cybersecurity report HTML template.
   */
  public static generateHtmlTemplate(report: ScanReport): string {
    const s = report.scan;
    const counts = report.findingCounts;

    const severityRows = report.findings
      .map(
        (f) => `
        <div style="margin-bottom: 18px; padding: 14px; border: 1px solid #e2e8f0; border-radius: 8px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${this.escape(f.title)}</div>
            <span style="font-family: monospace; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 12px; background: ${this.getSeverityBadgeBg(f.severity)}; color: ${this.getSeverityTextColor(f.severity)};">
              ${f.severity}
            </span>
          </div>
          <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-bottom: 8px;">
            Category: ${this.escape(f.category)} | Resource: ${this.escape(f.affectedResource)}
          </div>
          <div style="font-size: 11px; color: #334155; margin-bottom: 6px; line-height: 1.5;">
            <strong>Description:</strong> ${this.escape(f.description)}
          </div>
          <div style="font-size: 11px; color: #334155; margin-bottom: 6px; line-height: 1.5;">
            <strong>Potential Impact:</strong> ${this.escape(f.impact)}
          </div>
          ${
            f.evidence
              ? `<div style="font-size: 10px; font-family: monospace; background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px; margin-bottom: 6px; white-space: pre-wrap; word-break: break-all;">${this.escape(
                  f.evidence
                )}</div>`
              : ''
          }
          <div style="font-size: 11px; color: #166534; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px; border-radius: 6px; line-height: 1.5;">
            <strong>Recommended Remediation:</strong> ${this.escape(f.remediation)}
          </div>
        </div>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>SecureScope Assessment Report - ${this.escape(s.normalizedTarget)}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 24px;
            background: #ffffff;
          }
          h1, h2, h3, h4 { margin: 0; }
          .header-table { width: 100%; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 20px; }
          .meta-grid { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          .meta-grid td { padding: 6px 10px; border: 1px solid #e2e8f0; }
          .meta-label { font-weight: bold; background: #f8fafc; width: 25%; color: #475569; }
          .summary-box { background: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin-bottom: 24px; font-size: 12px; line-height: 1.6; color: #334155; }
          .stats-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; text-align: center; font-size: 11px; }
          .stats-table th, .stats-table td { border: 1px solid #cbd5e1; padding: 8px; }
          .stats-table th { background: #f1f5f9; color: #334155; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <h1 style="font-size: 20px; color: #0284c7; font-weight: 800; letter-spacing: -0.5px;">SECURESCOPE</h1>
              <div style="font-size: 11px; color: #64748b; font-family: monospace;">Website Security Assessment Platform • Executive Summary</div>
            </td>
            <td style="text-align: right;">
              <div style="font-size: 18px; font-weight: bold; color: ${this.getGradeColor(s.postureScore)};">
                Posture Score: ${s.postureScore} / 100
              </div>
              <div style="font-size: 10px; font-family: monospace; color: #64748b;">Scan Mode: ${s.scanMode.toUpperCase()}</div>
            </td>
          </tr>
        </table>

        ${
          s.isDemo
            ? '<div style="background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; margin-bottom: 16px;">[DEMO DATA]: Simulated Sandbox Assessment. For educational demonstration only.</div>'
            : ''
        }

        <table class="meta-grid">
          <tr>
            <td class="meta-label">Target Website:</td>
            <td><strong>${this.escape(s.normalizedTarget)}</strong></td>
            <td class="meta-label">Assessment Date:</td>
            <td>${new Date(report.createdAt).toUTCString()}</td>
          </tr>
          <tr>
            <td class="meta-label">Scan ID:</td>
            <td style="font-family: monospace;">${s.id}</td>
            <td class="meta-label">Execution Duration:</td>
            <td>${s.durationMs} ms</td>
          </tr>
          <tr>
            <td class="meta-label">Highest Severity:</td>
            <td style="font-weight: bold; color: ${this.getSeverityTextColor(s.highestSeverity)};">${s.highestSeverity}</td>
            <td class="meta-label">Scanner Engine:</td>
            <td>SecureScope v${s.scannerVersion}</td>
          </tr>
        </table>

        <div class="summary-box">
          <div style="font-weight: bold; color: #0f172a; margin-bottom: 4px;">Executive Risk Overview</div>
          ${this.escape(report.executiveSummary)}
        </div>

        <h3 style="font-size: 13px; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
          Findings Distribution
        </h3>
        <table class="stats-table">
          <tr>
            <th>Critical</th>
            <th>High</th>
            <th>Medium</th>
            <th>Low</th>
            <th>Informational</th>
            <th>Passed Checks</th>
          </tr>
          <tr>
            <td style="color: #dc2626; font-weight: bold;">${counts.critical}</td>
            <td style="color: #ea580c; font-weight: bold;">${counts.high}</td>
            <td style="color: #d97706; font-weight: bold;">${counts.medium}</td>
            <td style="color: #0284c7; font-weight: bold;">${counts.low}</td>
            <td style="color: #64748b;">${counts.informational}</td>
            <td style="color: #16a34a; font-weight: bold;">${counts.passed}</td>
          </tr>
        </table>

        <h3 style="font-size: 13px; color: #0f172a; margin-top: 24px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
          Detailed Security Findings (${report.findings.length})
        </h3>
        ${severityRows}

        <div style="margin-top: 30px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 10px; color: #64748b; line-height: 1.5; page-break-inside: avoid;">
          <strong>Assessment Limitations & Disclaimer:</strong><br />
          This evaluation reflects non-destructive, passive configuration testing of publicly observable HTTP/HTTPS headers and TLS configurations. The absence of findings does not guarantee immunity from application-layer vulnerabilities, authentication flaws, or zero-day exploits.
        </div>
      </body>
      </html>
    `;
  }

  private static escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private static getSeverityBadgeBg(sev: string): string {
    switch (sev) {
      case 'CRITICAL': return '#fee2e2';
      case 'HIGH': return '#ffedd5';
      case 'MEDIUM': return '#fef3c7';
      case 'LOW': return '#e0f2fe';
      default: return '#f1f5f9';
    }
  }

  private static getSeverityTextColor(sev: string): string {
    switch (sev) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#d97706';
      case 'LOW': return '#0284c7';
      default: return '#64748b';
    }
  }

  private static getGradeColor(score: number): string {
    if (score >= 90) return '#16a34a';
    if (score >= 75) return '#0284c7';
    if (score >= 50) return '#d97706';
    if (score >= 30) return '#ea580c';
    return '#dc2626';
  }
}

