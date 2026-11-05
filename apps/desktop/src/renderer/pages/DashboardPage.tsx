import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Radar,
  AlertTriangle,
  ShieldAlert,
  Globe,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

interface ContextType {
  isDemoMode: boolean;
  userPlan: 'free' | 'premium';
  onPlanToggle?: () => void;
}

export const DashboardPage: React.FC = () => {
  const { isDemoMode, userPlan } = useOutletContext<ContextType>();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
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

      {/* SECTION B: Dynamic Statistics KPI Cards */}
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
            <span className="text-3xl font-mono font-bold text-textMain">0</span>
            <p className="mt-1 text-xs text-textMuted">No scans recorded yet</p>
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
            <span className="text-3xl font-mono font-bold text-textMain">0</span>
            <p className="mt-1 text-xs text-textMuted">Discovered issues</p>
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
            <span className="text-3xl font-mono font-bold text-textMain">0</span>
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
            <span className="text-3xl font-mono font-bold text-textMain">0</span>
            <p className="mt-1 text-xs text-textMuted">Unique domains</p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-cyanBrand/5 rounded-full blur-xl pointer-events-none group-hover:bg-cyanBrand/10 transition-colors" />
        </Card>
      </div>

      {/* SECTION C: Signature Security Command Input Area (Milestone 2 Foundation Preview) */}
      <Card variant="glass" className="p-8 border-slateBorder/90 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyanBrand/10 border border-cyanBrand/30 text-cyanBrand text-xs font-mono mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Non-Destructive Assessment Console</span>
            </div>
            <h3 className="text-xl font-bold text-textMain tracking-tight">
              Initiate Website Security Assessment
            </h3>
            <p className="text-sm text-textMuted">
              Enter any publicly accessible or authorized web domain to evaluate its security architecture.
            </p>
          </div>

          {/* Large Command-style Input */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyanBrand/30 to-violetBrand/30 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300" />
            <div className="relative flex items-center bg-obsidian-900 border border-slateBorder rounded-xl p-2 gap-3 shadow-inner">
              <div className="pl-3 font-mono text-sm text-cyanBrand font-semibold select-none">
                URL &gt;
              </div>
              <input
                type="text"
                disabled
                placeholder={isDemoMode ? "http://localhost:8000 (Sandbox Mode Enabled)" : "https://yourdomain.com"}
                className="w-full bg-transparent border-none text-textMain font-mono text-sm focus:outline-none placeholder-textMuted/50 cursor-not-allowed"
              />
              <Button
                variant="primary"
                size="md"
                disabled
                className="whitespace-nowrap font-mono text-xs opacity-80"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Scan Target
              </Button>
            </div>
          </div>

          {/* Mode Selector Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-graphite/60 border border-cyanBrand/40 shadow-cyan-glow relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-textMain flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyanBrand" />
                  Normal Scan
                </span>
                <Badge variant="free">Free</Badge>
              </div>
              <p className="text-[11px] text-textMuted">
                Safe passive configuration checks, TLS validation, security headers, cookie flags.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-graphite/40 border border-slateBorder relative opacity-75">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-textMain flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Aggressive Scan
                </span>
                <Badge variant="premium">Pro</Badge>
              </div>
              <p className="text-[11px] text-textMuted">
                Extended non-destructive probes: CORS audit, robots.txt, security.txt compliance.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-graphite/40 border border-slateBorder relative opacity-75">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-textMain flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-violetBrand" />
                  Private Scan
                </span>
                <Badge variant="premium">Pro</Badge>
              </div>
              <p className="text-[11px] text-textMuted">
                Evidence minimization, sensitive header sanitization, zero response retention.
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[11px] font-mono text-textMuted">
              Architecture & UI Foundation verified. Full scanning engine connects in Milestone 5.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

