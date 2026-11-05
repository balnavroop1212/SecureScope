import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Radar,
  AlertTriangle,
  ShieldAlert,
  Globe,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { SecurityCommandInput } from '../components/scanner/SecurityCommandInput';
import { ScanProgressPanel } from '../components/scanner/ScanProgressPanel';
import { VulnerabilityReportView } from '../components/scanner/VulnerabilityReportView';
import { ScanMode, ScanReport, ScanProgressEvent, DashboardMetrics } from '@shared/types';

interface ContextType {
  isDemoMode: boolean;
  userPlan: 'free' | 'premium';
  onPlanToggle?: () => void;
}

export const DashboardPage: React.FC = () => {
  const { isDemoMode, userPlan } = useOutletContext<ContextType>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Metrics State
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalScans: 0,
    totalFindings: 0,
    highRiskFindings: 0,
    uniqueWebsites: 0,
  });

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<ScanProgressEvent | null>(null);
  const [activeReport, setActiveReport] = useState<ScanReport | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [currentScanTarget, setCurrentScanTarget] = useState<string>('');
  const [currentScanMode, setCurrentScanMode] = useState<ScanMode>('normal');

  const reportRef = useRef<HTMLDivElement>(null);

  // Load KPI Metrics
  const loadMetrics = async () => {
    try {
      if (window.electronAPI?.reports) {
        const data = await window.electronAPI.reports.getDashboardMetrics();
        setMetrics(data);
      }
    } catch (err) {
      console.error('[Dashboard] Failed to load metrics:', err);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [user]);

  // Subscribe to real-time progress events
  useEffect(() => {
    if (window.electronAPI?.scanner) {
      const unsubscribe = window.electronAPI.scanner.onProgress((prog) => {
        setCurrentProgress(prog);
      });
      return () => unsubscribe();
    }
  }, []);

  const handleStartScan = async (targetUrl: string, mode: ScanMode, authorized: boolean) => {
    setScanError(null);
    setActiveReport(null);
    setCurrentProgress(null);
    setIsScanning(true);
    setCurrentScanTarget(targetUrl);
    setCurrentScanMode(mode);

    try {
      const report = await window.electronAPI.scanner.startScan({
        url: targetUrl,
        scanMode: mode,
        authorizedScopeConfirmed: authorized,
        isDemoMode,
      });

      setActiveReport(report);
      setIsScanning(false);
      loadMetrics(); // dynamically refresh KPI cards

      // Smooth scroll to report
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setScanError(err.message || 'An error occurred during assessment.');
      setIsScanning(false);
    }
  };

  const handleCancelScan = async () => {
    if (currentProgress?.scanId) {
      await window.electronAPI.scanner.cancelScan(currentProgress.scanId);
    }
    setIsScanning(false);
    setCurrentProgress(null);
    setScanError('Assessment cancelled by user.');
  };

  const handleResetScan = () => {
    setActiveReport(null);
    setCurrentProgress(null);
    setScanError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* SECTION A: Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-graphite via-graphite-card to-graphite border border-slateBorder shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-textMain tracking-tight">
              Welcome back, {user?.firstName || 'Operator'}
            </h2>
            <Badge variant={userPlan === 'premium' ? 'premium' : 'free'}>
              {userPlan === 'premium' ? 'Pro Member' : 'Community'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-textMuted max-w-2xl leading-relaxed">
            Assess your website defensive posture, identify TLS vulnerabilities, verify HTTP security headers, and prevent data leakage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/history')}
            icon={<Radar className="w-4 h-4 text-cyanBrand" />}
          >
            Past Reports
          </Button>
          {userPlan === 'free' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/subscription')}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Upgrade to Premium
            </Button>
          )}
        </div>
      </div>

      {/* SECTION B: Dynamic Statistics KPI Cards (Calculated from saved SQLite reports) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <Card className="p-5 relative overflow-hidden group hover:border-cyanBrand/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-textMuted uppercase tracking-wider">
              Total Scans
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyanBrand/10 border border-cyanBrand/20 flex items-center justify-center text-cyanBrand">
              <Radar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-mono font-bold text-textMain">
              {metrics.totalScans}
            </span>
            <p className="mt-1 text-xs text-textMuted">
              {metrics.totalScans === 0 ? 'No scans recorded yet' : 'Completed evaluations'}
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-cyanBrand/5 rounded-full blur-xl pointer-events-none group-hover:bg-cyanBrand/10 transition-colors" />
        </Card>

        {/* Total Vulnerability Findings */}
        <Card className="p-5 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-textMuted uppercase tracking-wider">
              Total Findings
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-mono font-bold text-textMain">
              {metrics.totalFindings}
            </span>
            <p className="mt-1 text-xs text-textMuted">Discovered observations</p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
        </Card>

        {/* High-Risk Findings */}
        <Card className="p-5 relative overflow-hidden group hover:border-red-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-textMuted uppercase tracking-wider">
              High-Risk Issues
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-mono font-bold text-textMain">
              {metrics.highRiskFindings}
            </span>
            <p className="mt-1 text-xs text-textMuted">Critical & High severity</p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-red-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-red-500/10 transition-colors" />
        </Card>

        {/* Unique Websites Assessed */}
        <Card className="p-5 relative overflow-hidden group hover:border-cyanBrand/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-textMuted uppercase tracking-wider">
              Assessed Targets
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyanBrand/10 border border-cyanBrand/20 flex items-center justify-center text-cyanBrand">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-mono font-bold text-textMain">
              {metrics.uniqueWebsites}
            </span>
            <p className="mt-1 text-xs text-textMuted">Unique domains</p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-cyanBrand/5 rounded-full blur-xl pointer-events-none group-hover:bg-cyanBrand/10 transition-colors" />
        </Card>
      </div>

      {/* Error Alert Banner */}
      {scanError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs text-red-400 animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Assessment Halted</p>
            <p className="text-textMuted leading-relaxed">{scanError}</p>
          </div>
        </div>
      )}

      {/* SECTION C: Signature Security Command Input Area */}
      <SecurityCommandInput
        userPlan={userPlan}
        isDemoMode={isDemoMode}
        isScanning={isScanning}
        onStartScan={handleStartScan}
      />

      {/* Scan Progress State */}
      {isScanning && (
        <ScanProgressPanel
          targetUrl={currentScanTarget}
          scanMode={currentScanMode}
          progress={currentProgress}
          onCancelScan={handleCancelScan}
        />
      )}

      {/* In-Place Comprehensive Vulnerability Report */}
      {activeReport && (
        <div ref={reportRef}>
          <VulnerabilityReportView
            report={activeReport}
            userPlan={userPlan}
            onResetScan={handleResetScan}
          />
        </div>
      )}
    </div>
  );
};
