import React from 'react';
import { Loader2, XCircle, Shield, CheckCircle2 } from 'lucide-react';
import { ScanProgressEvent, ScanMode } from '@shared/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface ScanProgressPanelProps {
  targetUrl: string;
  scanMode: ScanMode;
  progress: ScanProgressEvent | null;
  onCancelScan: () => void;
}

export const ScanProgressPanel: React.FC<ScanProgressPanelProps> = ({
  targetUrl,
  scanMode,
  progress,
  onCancelScan,
}) => {
  const percent = progress?.progressPercent || 5;
  const stage = progress?.stage || 'Initializing Assessment Session...';
  const currentCheck = progress?.currentCheckName || 'Pre-flight Scope Validation';
  const checksCompleted = progress?.checksCompleted || 0;
  const totalChecks = progress?.totalChecks || 10;

  const stagesList = [
    'Validating Target',
    'Validating Authorized Scope',
    'Collecting Public Security Information',
    'Assessing Security Configuration',
    'Analyzing Findings',
    'Generating Report',
  ];

  return (
    <Card variant="glass" className="p-6 border-cyanBrand/30 shadow-cyan-glow relative overflow-hidden animate-in fade-in duration-200">
      <div className="space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slateBorder/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyanBrand/10 border border-cyanBrand/30 flex items-center justify-center text-cyanBrand">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-textMain">
                  Active Assessment in Progress
                </span>
                <Badge variant={scanMode === 'normal' ? 'free' : 'premium'}>
                  {scanMode.toUpperCase()} MODE
                </Badge>
              </div>
              <p className="text-xs font-mono text-cyanBrand truncate max-w-md mt-0.5">
                {targetUrl}
              </p>
            </div>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={onCancelScan}
            icon={<XCircle className="w-4 h-4" />}
          >
            Cancel Scan
          </Button>
        </div>

        {/* Progress Bar & Percent */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-textMain font-semibold flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-cyanBrand animate-pulse" />
              {stage}
            </span>
            <span className="text-cyanBrand font-bold">{percent}%</span>
          </div>

          <div className="w-full h-2 bg-obsidian-900 rounded-full overflow-hidden border border-slateBorder/80">
            <div
              className="h-full bg-gradient-to-r from-cyanBrand via-cyanBrand-hover to-violetBrand transition-all duration-300 shadow-cyan-glow"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-textMuted pt-0.5">
            <span>Executing: {currentCheck}</span>
            <span>
              {checksCompleted} / {totalChecks} checks completed
            </span>
          </div>
        </div>

        {/* Real-time Stage Progression Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
          {stagesList.map((s, idx) => {
            const isFinished = stagesList.indexOf(stage) > idx;
            const isCurrent = stage.toLowerCase().includes(s.toLowerCase());

            return (
              <div
                key={s}
                className={`p-2 rounded-lg text-[10px] font-mono flex items-center gap-1.5 border ${
                  isFinished
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : isCurrent
                    ? 'bg-cyanBrand/10 text-cyanBrand border-cyanBrand/30 animate-pulse'
                    : 'bg-obsidian/40 text-textMuted/50 border-slateBorder/40'
                }`}
              >
                {isFinished ? (
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0 text-emerald-400" />
                ) : (
                  <span className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px] flex-shrink-0">
                    {idx + 1}
                  </span>
                )}
                <span className="truncate">{s}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

