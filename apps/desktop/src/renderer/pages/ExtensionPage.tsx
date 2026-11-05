import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Puzzle,
  Sparkles,
  Layers,
  Terminal,
  Activity,
  Copy,
  Check,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface ContextType {
  userPlan: 'free' | 'premium';
}

export const ExtensionPage: React.FC = () => {
  const { userPlan } = useOutletContext<ContextType>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copyRegCommand = () => {
    navigator.clipboard.writeText('npm run register:extension');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-graphite via-graphite-card to-graphite border border-slateBorder flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-textMain tracking-tight">
              Chrome Extension Companion
            </h2>
            <Badge variant="premium">Pro Feature</Badge>
          </div>
          <p className="mt-1 text-sm text-textMuted max-w-2xl leading-relaxed">
            Assess the active website currently open in Google Chrome with a single click. Communicates securely via Windows Chrome Native Messaging.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="neutral" withDot>
            Host: Initializing in M8
          </Badge>
        </div>
      </div>

      {userPlan === 'free' ? (
        /* Free Tier Upgrade Gate */
        <Card className="p-8 border-cyanBrand/30 bg-gradient-to-b from-graphite to-obsidian-900 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyanBrand/10 border border-cyanBrand/30 flex items-center justify-center mx-auto text-cyanBrand shadow-cyan-glow">
              <Puzzle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-textMain">
              Companion Extension is a Premium Feature
            </h3>
            <p className="text-sm text-textMuted leading-relaxed">
              Upgrade to SecureScope Pro (₹299 + GST) to trigger real-time, non-destructive scans directly from your browser toolbar without manual URL copying.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                variant="primary"
                onClick={() => navigate('/subscription')}
                icon={<Sparkles className="w-4 h-4" />}
              >
                View Premium Plans — ₹299
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        /* Premium Setup Guide & Management */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="space-y-4">
            <h4 className="text-sm font-semibold text-textMain flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyanBrand" />
              Installation Instructions
            </h4>
            <ol className="space-y-3 text-xs text-textMuted list-decimal list-inside leading-relaxed font-sans">
              <li>
                Open Google Chrome and navigate to{' '}
                <span className="font-mono text-cyanBrand">chrome://extensions</span>.
              </li>
              <li>Toggle <strong>Developer Mode</strong> in the top-right corner.</li>
              <li>
                Click <strong>Load unpacked</strong> and select the directory:
                <div className="mt-1 p-2 rounded bg-obsidian border border-slateBorder font-mono text-[11px] text-textMain">
                  &lt;SecureScope&gt;\apps\chrome-extension
                </div>
              </li>
              <li>Register the desktop Native Messaging host in the Windows Registry.</li>
            </ol>

            <div className="p-3 rounded-lg bg-obsidian border border-slateBorder flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyanBrand" />
                <span className="font-mono text-xs text-textMain">npm run register:extension</span>
              </div>
              <Button variant="ghost" size="sm" onClick={copyRegCommand}>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </Card>

          <Card className="space-y-4">
            <h4 className="text-sm font-semibold text-textMain flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyanBrand" />
              Native Messaging Status & Diagnostics
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-obsidian border border-slateBorder">
                <span className="text-textMuted">Host Protocol:</span>
                <span className="text-textMain">32-bit Little-Endian stdio</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-obsidian border border-slateBorder">
                <span className="text-textMuted">Host ID:</span>
                <span className="text-cyanBrand">com.securescope.desktop</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-obsidian border border-slateBorder">
                <span className="text-textMuted">Status:</span>
                <span className="text-amber-400">Ready for Host Build (M8)</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
