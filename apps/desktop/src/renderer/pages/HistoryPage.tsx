import React, { useState, useEffect } from 'react';
import {
  Search,
  History as HistoryIcon,
  Filter,
  ArrowUpDown,
  Eye,
  Download,
  Trash2,
  Globe,
  Clock,
  FileCheck2,
} from 'lucide-react';
import { ScanRecord, ScanReport } from '@shared/types';
import { Card } from '../components/ui/Card';
import { Badge, BadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { UpgradeModal } from '../components/ui/UpgradeModal';
import { VulnerabilityReportView } from '../components/scanner/VulnerabilityReportView';
import { useAuth } from '../context/AuthContext';

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const userPlan = user?.plan || 'free';

  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');

  // Modal States
  const [viewingReport, setViewingReport] = useState<ScanReport | null>(null);
  const [deleteTargetScanId, setDeleteTargetScanId] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      if (window.electronAPI?.reports) {
        const data = await window.electronAPI.reports.getHistory();
        setScans(data);
      }
    } catch (err) {
      console.error('[History] Error loading scans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  // View Report Handler
  const handleViewReport = async (scanId: string) => {
    try {
      const rep = await window.electronAPI.reports.getReport(scanId);
      setViewingReport(rep);
    } catch (err) {
      console.error('[History] Failed to get report:', err);
    }
  };

  // Export PDF Handler
  const handleExportPdf = async (scanId: string) => {
    if (userPlan !== 'premium') {
      setUpgradeModalOpen(true);
      return;
    }

    try {
      setExportNotice('Exporting PDF document...');
      const res = await window.electronAPI.reports.exportPdf(scanId);
      if (res.success && res.filePath) {
        setExportNotice(`Exported successfully to: ${res.filePath}`);
        setTimeout(() => setExportNotice(null), 5000);
      } else if (res.error) {
        setExportNotice(`Export failed: ${res.error}`);
        setTimeout(() => setExportNotice(null), 4000);
      }
    } catch (err: any) {
      setExportNotice(`Error: ${err.message}`);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deleteTargetScanId) return;
    try {
      await window.electronAPI.reports.deleteScan(deleteTargetScanId);
      setDeleteTargetScanId(null);
      await loadHistory();
    } catch (err) {
      console.error('[History] Failed to delete scan:', err);
    }
  };

  // Filtered and Sorted Scans
  const filteredScans = scans
    .filter((s) => {
      const matchesSearch =
        !searchTerm ||
        s.targetUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.normalizedTarget.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMode = selectedMode === 'ALL' || s.scanMode === selectedMode.toLowerCase();
      const matchesSeverity = selectedSeverity === 'ALL' || s.highestSeverity === selectedSeverity;
      return matchesSearch && matchesMode && matchesSeverity;
    })
    .sort((a, b) => {
      const timeA = new Date(a.startedAt).getTime();
      const timeB = new Date(b.startedAt).getTime();
      return sortOrder === 'latest' ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Export Notification Toast */}
      {exportNotice && (
        <div className="p-3 rounded-lg bg-cyanBrand/10 border border-cyanBrand/30 flex items-center justify-between text-xs text-cyanBrand font-mono">
          <div className="flex items-center gap-2 truncate">
            <FileCheck2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-textMuted hover:text-textMain ml-3">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-graphite border border-slateBorder">
        <div>
          <h2 className="text-lg font-bold text-textMain tracking-tight">
            Security Assessment History
          </h2>
          <p className="text-xs text-textMuted mt-0.5">
            Access previous scans, inspect historical vulnerability reports, or export executive summaries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">
            {scans.length} Saved {scans.length === 1 ? 'Record' : 'Records'}
          </Badge>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-graphite border border-slateBorder">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by URL or domain..."
            className="w-full bg-obsidian border border-slateBorder rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-textMain placeholder-textMuted focus:outline-none focus:border-cyanBrand"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Mode Filter */}
          <div className="flex items-center gap-1.5 bg-obsidian border border-slateBorder rounded-lg px-2.5 py-1.5 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-cyanBrand" />
            <span className="text-textMuted">Mode:</span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="bg-transparent text-textMain focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Modes</option>
              <option value="normal">Normal</option>
              <option value="aggressive">Aggressive</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 bg-obsidian border border-slateBorder rounded-lg px-2.5 py-1.5 text-xs font-mono">
            <span className="text-textMuted">Risk:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-transparent text-textMain focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Risks</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Sort Button */}
          <button
            onClick={() => setSortOrder(sortOrder === 'latest' ? 'oldest' : 'latest')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian border border-slateBorder text-xs font-mono text-textMuted hover:text-textMain transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-cyanBrand" />
            <span>{sortOrder === 'latest' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* History Data Table */}
      <Card className="p-0 overflow-hidden border-slateBorder shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slateBorder bg-obsidian-900/80 text-textMuted text-[11px] font-mono uppercase tracking-wider select-none">
                <th className="py-3 px-5">Target Website</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-3">Posture</th>
                <th className="py-3 px-3">Highest Risk</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slateBorder/60 text-xs font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-textMuted">
                    Loading historical assessments...
                  </td>
                </tr>
              ) : filteredScans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-graphite border border-slateBorder flex items-center justify-center mx-auto text-textMuted">
                        <HistoryIcon className="w-6 h-6 text-cyanBrand/50" />
                      </div>
                      <h4 className="text-sm font-semibold text-textMain">No Assessment Records Found</h4>
                      <p className="text-xs text-textMuted">
                        {scans.length === 0
                          ? 'You have not executed any website security scans yet. Start an assessment from the Dashboard.'
                          : 'No saved scans match your current search and filter criteria.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredScans.map((s) => {
                  const severityVariant: BadgeVariant =
                    s.highestSeverity === 'NONE'
                      ? 'neutral'
                      : (s.highestSeverity.toLowerCase() as BadgeVariant);

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-graphite/60 transition-colors group"
                    >
                      {/* Target Website */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <Globe className="w-4 h-4 text-cyanBrand flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-textMain truncate block">
                              {s.normalizedTarget}
                            </span>
                            <span className="text-[10px] text-textMuted font-mono truncate block">
                              {s.targetUrl}
                            </span>
                          </div>
                          {s.isDemo && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              DEMO
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-textMuted whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-textMuted" />
                          <span>{new Date(s.startedAt).toLocaleDateString()}</span>
                          <span className="text-[10px] text-textMuted/70">
                            {new Date(s.startedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Mode */}
                      <td className="py-3.5 px-3">
                        <Badge variant={s.scanMode === 'normal' ? 'free' : 'premium'}>
                          {s.scanMode}
                        </Badge>
                      </td>

                      {/* Posture Score */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-textMain">{s.postureScore}</span>
                        <span className="text-[10px] text-textMuted">/100</span>
                      </td>

                      {/* Highest Severity */}
                      <td className="py-3.5 px-3">
                        <Badge variant={severityVariant} withDot>
                          {s.highestSeverity}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[11px] uppercase font-bold ${
                            s.status === 'completed'
                              ? 'text-emerald-400'
                              : s.status === 'cancelled'
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewReport(s.id)}
                            icon={<Eye className="w-3.5 h-3.5 text-cyanBrand" />}
                            title="View In-App Report"
                          >
                            View
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportPdf(s.id)}
                            className="p-1.5 hover:text-cyanBrand"
                            title="Download PDF Report"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTargetScanId(s.id)}
                            className="p-1.5 text-textMuted hover:text-red-400"
                            title="Delete Scan Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Full Report Details Modal */}
      {viewingReport && (
        <Modal
          isOpen={!!viewingReport}
          onClose={() => setViewingReport(null)}
          title={`Security Assessment Report — ${viewingReport.scan.normalizedTarget}`}
          description={`Conducted on ${new Date(viewingReport.createdAt).toLocaleString()} (${viewingReport.scan.scanMode} mode)`}
          maxWidth="xl"
        >
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            <VulnerabilityReportView
              report={viewingReport}
              userPlan={userPlan}
              onResetScan={() => setViewingReport(null)}
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTargetScanId}
        onClose={() => setDeleteTargetScanId(null)}
        title="Delete Assessment Record"
        description="Are you sure you want to delete this scan record and its associated findings from your local SQLite database? This action cannot be undone."
      >
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setDeleteTargetScanId(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
            Confirm Deletion
          </Button>
        </div>
      </Modal>

      {/* Upgrade Dialog */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureTitle="Executive PDF Report Downloads"
        featureDescription="PDF Report export is a SecureScope Pro capability. Upgrade to generate formatted, stakeholder-ready security assessment documents."
      />
    </div>
  );
};
