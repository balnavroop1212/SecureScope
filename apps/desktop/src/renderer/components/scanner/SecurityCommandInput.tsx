import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  X,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { ScanMode, UserPlan } from '@shared/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { UpgradeModal } from '../ui/UpgradeModal';

export interface SecurityCommandInputProps {
  userPlan: UserPlan;
  isDemoMode: boolean;
  isScanning: boolean;
  onStartScan: (url: string, mode: ScanMode, authorized: boolean) => void;
}

export const SecurityCommandInput: React.FC<SecurityCommandInputProps> = ({
  userPlan,
  isDemoMode,
  isScanning,
  onStartScan,
}) => {
  const [url, setUrl] = useState(isDemoMode ? 'http://localhost:8000' : '');
  const [selectedMode, setSelectedMode] = useState<ScanMode>('normal');
  const [authorized, setAuthorized] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState({ title: '', desc: '' });

  // Update prefilled URL if demo mode changes
  React.useEffect(() => {
    if (isDemoMode && !url) {
      setUrl('http://localhost:8000');
    }
  }, [isDemoMode]);

  const handleModeSelect = (mode: ScanMode) => {
    if (mode !== 'normal' && userPlan !== 'premium') {
      const modeName = mode === 'aggressive' ? 'Aggressive Scan' : 'Private Scan';
      setUpgradeFeature({
        title: `${modeName} (Pro Feature)`,
        desc:
          mode === 'aggressive'
            ? 'Aggressive Scan extends passive discovery to CORS configuration, robots.txt, and vulnerability disclosure policies.'
            : 'Private Scan enforces strict evidence minimization and token redaction before saving reports.',
      });
      setUpgradeModalOpen(true);
      return;
    }
    setSelectedMode(mode);
  };

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setValidationError('Please enter a target URL or web domain.');
      return;
    }

    if (!authorized) {
      setValidationError('You must certify that you are authorized to evaluate this target.');
      return;
    }

    if (selectedMode !== 'normal' && userPlan !== 'premium') {
      setUpgradeModalOpen(true);
      return;
    }

    onStartScan(trimmed, selectedMode, authorized);
  };

  return (
    <>
      <Card variant="glass" className="p-7 border-slateBorder/90 shadow-2xl relative overflow-hidden">
        <form onSubmit={handleLaunch} className="max-w-3xl mx-auto space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyanBrand/10 border border-cyanBrand/30 text-cyanBrand text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Safe Authorized Assessment Console</span>
            </div>
            <h3 className="text-xl font-bold text-textMain tracking-tight">
              Evaluate Website Security Posture
            </h3>
            <p className="text-xs text-textMuted max-w-lg mx-auto">
              Execute low-impact, passive configuration evaluations. Enforces SSRF boundary guards and strict non-destructive protocols.
            </p>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Signature Command URL Input Container */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyanBrand/30 to-violetBrand/30 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-300 pointer-events-none" />
            <div className="relative flex items-center bg-obsidian-900 border border-slateBorder rounded-xl p-2 gap-2 shadow-inner">
              <span className="pl-3 font-mono text-xs text-cyanBrand font-bold select-none whitespace-nowrap">
                TARGET &gt;
              </span>
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                disabled={isScanning}
                placeholder={
                  isDemoMode
                    ? 'http://localhost:8000 (Sandbox Demo Target)'
                    : 'https://example.com or your-domain.com'
                }
                className="w-full bg-transparent border-none text-textMain font-mono text-xs focus:outline-none placeholder-textMuted/40 disabled:opacity-50"
              />

              {url && !isScanning && (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="p-1 rounded-md text-textMuted hover:text-textMain hover:bg-slateBorder/50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isScanning}
                className="font-mono text-xs whitespace-nowrap shadow-cyan-glow"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {isScanning ? 'Assessing...' : 'Start Scan'}
              </Button>
            </div>
          </div>

          {/* Scan Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* Normal Scan (Free) */}
            <div
              onClick={() => handleModeSelect('normal')}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                selectedMode === 'normal'
                  ? 'bg-graphite border-cyanBrand/80 shadow-cyan-glow'
                  : 'bg-graphite/40 border-slateBorder/70 hover:border-slateBorder hover:bg-graphite/70'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-textMain flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyanBrand" />
                  Normal Scan
                </span>
                <Badge variant="free">Free</Badge>
              </div>
              <p className="text-[11px] text-textMuted leading-relaxed">
                Passive configuration checks, TLS validation, security headers, cookie flags.
              </p>
            </div>

            {/* Aggressive Scan (Pro) */}
            <div
              onClick={() => handleModeSelect('aggressive')}
              className={`p-4 rounded-xl cursor-pointer transition-all border relative ${
                selectedMode === 'aggressive'
                  ? 'bg-graphite border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : 'bg-graphite/40 border-slateBorder/70 hover:border-slateBorder hover:bg-graphite/70'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-textMain flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Aggressive Scan
                </span>
                <Badge variant="premium">Pro</Badge>
              </div>
              <p className="text-[11px] text-textMuted leading-relaxed">
                Extended non-destructive probes: CORS audit, robots.txt, security.txt compliance.
              </p>
            </div>

            {/* Private Scan (Pro) */}
            <div
              onClick={() => handleModeSelect('private')}
              className={`p-4 rounded-xl cursor-pointer transition-all border relative ${
                selectedMode === 'private'
                  ? 'bg-graphite border-violetBrand/80 shadow-violet-glow'
                  : 'bg-graphite/40 border-slateBorder/70 hover:border-slateBorder hover:bg-graphite/70'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-textMain flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-violetBrand" />
                  Private Scan
                </span>
                <Badge variant="premium">Pro</Badge>
              </div>
              <p className="text-[11px] text-textMuted leading-relaxed">
                Evidence minimization, sensitive token redaction, zero local body retention.
              </p>
            </div>
          </div>

          {/* Scope Consent Checkbox */}
          <div className="pt-1 border-t border-slateBorder/60 flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-textMuted select-none">
              <input
                type="checkbox"
                checked={authorized}
                onChange={(e) => {
                  setAuthorized(e.target.checked);
                  if (validationError) setValidationError(null);
                }}
                disabled={isScanning}
                className="w-4 h-4 rounded bg-obsidian border border-slateBorder text-cyanBrand focus:ring-0 cursor-pointer"
              />
              <span>
                I confirm I own or have explicit written permission to test this website.
              </span>
            </label>

            {isDemoMode && (
              <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <Sparkles className="w-3 h-3" /> Sandbox Mode
              </span>
            )}
          </div>
        </form>
      </Card>

      {/* Upgrade Dialog */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureTitle={upgradeFeature.title}
        featureDescription={upgradeFeature.desc}
      />
    </>
  );
};

