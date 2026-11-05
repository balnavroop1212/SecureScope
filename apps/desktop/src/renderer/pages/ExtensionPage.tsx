import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Puzzle,
  Sparkles,
  Layers,
  Terminal,
  Activity,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface ContextType {
  userPlan: 'free' | 'premium';
}

interface ExtensionHostStatus {
  isWindows: boolean;
  manifestExists: boolean;
  batExists: boolean;
  registryKeyExists: boolean;
  isFullyConfigured: boolean;
  hostDir: string;
  manifestPath: string;
  batPath: string;
  hostId: string;
  userPlan: 'free' | 'premium';
  canUseExtension: boolean;
}

export const ExtensionPage: React.FC = () => {
  const { userPlan } = useOutletContext<ContextType>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [testingEcho, setTestingEcho] = useState(false);
  const [extensionIdInput, setExtensionIdInput] = useState('');
  const [echoResult, setEchoResult] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [status, setStatus] = useState<ExtensionHostStatus | null>(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await window.electronAPI.extension.getStatus();
      setStatus(res);
    } catch (err: any) {
      console.error('Failed to load extension host status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const copyRegCommand = () => {
    navigator.clipboard.writeText('npm run register:extension');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegister = async () => {
    try {
      setRegistering(true);
      setActionMessage(null);
      const res = await window.electronAPI.extension.registerHost(extensionIdInput.trim() || undefined);
      setActionMessage({
        type: 'success',
        text: `Native Host successfully configured! ${res.registryStatus}`,
      });
      await loadStatus();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Registration failed: ${err.message}`,
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleTestEcho = async () => {
    try {
      setTestingEcho(true);
      setEchoResult(null);
      const startTime = performance.now();
      const res = await window.electronAPI.extension.testEcho({
        action: 'ECHO_TEST',
        client: 'SecureScope Desktop UI',
        timestamp: Date.now(),
      });
      const latency = Math.round(performance.now() - startTime);
      setEchoResult(`Wire protocol verified: ${res.roundTripBytes} bytes framed cleanly in ${latency}ms.`);
    } catch (err: any) {
      setEchoResult(`Echo test failed: ${err.message}`);
    } finally {
      setTestingEcho(false);
    }
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
          <Button
            variant="ghost"
            size="sm"
            onClick={loadStatus}
            disabled={loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Status
          </Button>
          {status?.isFullyConfigured ? (
            <Badge variant="success" withDot>
              Host: Registered & Ready
            </Badge>
          ) : (
            <Badge variant="medium" withDot>
              Host: Setup Required
            </Badge>
          )}
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
              : 'bg-red-950/30 border-red-800/50 text-red-300'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

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
          {/* Step-by-Step Installation */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-textMain flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyanBrand" />
                Step-by-Step Chrome Setup
              </h4>
              <Badge variant="premium">Manifest V3</Badge>
            </div>

            <ol className="space-y-3 text-xs text-textMuted list-decimal list-inside leading-relaxed font-sans">
              <li>
                Open Google Chrome and navigate to{' '}
                <span className="font-mono text-cyanBrand select-all">chrome://extensions</span>.
              </li>
              <li>
                Toggle the <strong>Developer mode</strong> switch in the top-right corner.
              </li>
              <li>
                Click <strong>Load unpacked</strong> and select the directory:
                <div className="mt-1 p-2.5 rounded-lg bg-obsidian border border-slateBorder font-mono text-[11px] text-textMain select-all break-all">
                  &lt;ProjectRoot&gt;\apps\chrome-extension
                </div>
              </li>
              <li>
                Register the desktop Native Messaging host in the Windows Registry using the button below or via CLI:
              </li>
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

            <div className="pt-2 border-t border-slateBorder/60 space-y-3">
              <div className="text-xs text-textMuted">
                Optional: specify Chrome Extension ID (defaults to all local IDs):
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. pgkjgchmf..."
                  value={extensionIdInput}
                  onChange={(e) => setExtensionIdInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-obsidian border border-slateBorder text-xs text-textMain font-mono focus:border-cyanBrand outline-none"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRegister}
                  disabled={registering}
                  icon={<Zap className={`w-3.5 h-3.5 ${registering ? 'animate-spin' : ''}`} />}
                >
                  {registering ? 'Registering...' : 'Register Host'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Native Diagnostics & Status */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-textMain flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyanBrand" />
                Native Messaging Diagnostics
              </h4>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestEcho}
                disabled={testingEcho}
                icon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                {testingEcho ? 'Testing...' : 'Test Echo'}
              </Button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-obsidian border border-slateBorder">
                <span className="text-textMuted">Host ID:</span>
                <span className="text-cyanBrand font-semibold">com.securescope.desktop</span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-obsidian border border-slateBorder">
                <span className="text-textMuted">Windows Registry Key:</span>
                <span className={status?.registryKeyExists ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {status?.registryKeyExists ? 'REGISTERED' : 'NOT FOUND'}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-obsidian border border-slateBorder">
                <span className="text-textMuted">Host Manifest File:</span>
                <span className={status?.manifestExists ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {status?.manifestExists ? 'EXISTS' : 'NOT FOUND'}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-obsidian border border-slateBorder">
                <span className="text-textMuted">Batch Launcher Script:</span>
                <span className={status?.batExists ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {status?.batExists ? 'EXISTS' : 'NOT FOUND'}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-obsidian border border-slateBorder">
                <span className="text-textMuted">Wire Framing:</span>
                <span className="text-textMain">32-bit Little-Endian LE (1MB max)</span>
              </div>
            </div>

            {echoResult && (
              <div className="p-3 rounded-lg bg-obsidian border border-cyanBrand/30 text-xs font-mono text-cyanBrand animate-in fade-in">
                {echoResult}
              </div>
            )}

            <div className="p-3 rounded-lg bg-slateBorder/30 border border-slateBorder text-[11px] text-textMuted space-y-1">
              <div className="font-semibold text-textMain">Target Host Manifest Location:</div>
              <div className="font-mono text-cyanBrand/90 select-all break-all">
                {status?.manifestPath || '%APPDATA%\\SecureScope\\host\\com.securescope.desktop.json'}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
