import React, { useState } from 'react';
import {
  Check,
  Sparkles,
  Zap,
  Lock,
  Download,
  Puzzle,
  CreditCard,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

export const SubscriptionPage: React.FC = () => {
  const { user, updatePlan } = useAuth();
  const userPlan = user?.plan || 'free';

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const handleSimulatedUpgrade = async () => {
    setIsSimulating(true);
    await new Promise((r) => setTimeout(r, 1000));
    await updatePlan('premium');
    setIsSimulating(false);
    setCheckoutModalOpen(false);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4000);
  };

  const handleDowngrade = async () => {
    await updatePlan('free');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-400 font-mono animate-in fade-in">
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong>Upgrade Successful!</strong> Your account now possesses SecureScope Pro entitlements (Aggressive scan, Private scan, PDF report exports, companion extension).
          </div>
        </div>
      )}

      {/* Title Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-textMain tracking-tight">
          Flexible & Transparent Security Plans
        </h2>
        <p className="text-sm text-textMuted max-w-lg mx-auto">
          Choose between our community-tier non-destructive scanner or unlock full pro capabilities with companion extension and executive reports.
        </p>
      </div>

      {/* Two-Column Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* FREE TIER */}
        <Card
          className={`p-6 space-y-6 relative flex flex-col justify-between ${
            userPlan === 'free' ? 'border-slateBorder bg-graphite' : 'border-slateBorder/50 opacity-90'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-textMain">Community Tier</h3>
                <p className="text-xs text-textMuted">Standard website security evaluation</p>
              </div>
              <Badge variant="free">Free Forever</Badge>
            </div>

            <div className="flex items-baseline gap-1 py-2">
              <span className="text-3xl font-mono font-bold text-textMain">₹0</span>
              <span className="text-xs text-textMuted">/ lifetime access</span>
            </div>

            <div className="space-y-3 pt-2 text-xs text-textMuted">
              <div className="flex items-center gap-2.5 text-textMain">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Normal non-destructive passive scanning</span>
              </div>
              <div className="flex items-center gap-2.5 text-textMain">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>SSL / TLS certificate health & expiry audit</span>
              </div>
              <div className="flex items-center gap-2.5 text-textMain">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Critical HTTP security headers analysis</span>
              </div>
              <div className="flex items-center gap-2.5 text-textMain">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Full in-app vulnerability reports</span>
              </div>
              <div className="flex items-center gap-2.5 text-textMain">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Persistent scan history & metrics</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            {userPlan === 'free' ? (
              <Button variant="secondary" size="md" className="w-full" disabled>
                Current Active Plan
              </Button>
            ) : (
              <Button variant="secondary" size="md" className="w-full" onClick={handleDowngrade}>
                Switch to Free Tier (Developer Toggle)
              </Button>
            )}
          </div>
        </Card>

        {/* PREMIUM TIER */}
        <Card
          className={`p-6 space-y-6 relative flex flex-col justify-between border-cyanBrand/50 shadow-cyan-glow bg-gradient-to-b from-graphite via-graphite-card to-obsidian-900 ${
            userPlan === 'premium' ? 'ring-1 ring-cyanBrand' : ''
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-textMain flex items-center gap-2">
                  SecureScope Pro
                  <Sparkles className="w-4 h-4 text-cyanBrand" />
                </h3>
                <p className="text-xs text-textMuted">Full-spectrum security assessment & tools</p>
              </div>
              <Badge variant="premium">Pro</Badge>
            </div>

            <div className="flex items-baseline gap-1 py-2">
              <span className="text-3xl font-mono font-bold text-cyanBrand">₹299</span>
              <span className="text-xs text-textMuted font-mono">exclusive of applicable GST</span>
            </div>

            <div className="space-y-3 pt-2 text-xs text-textMuted">
              <div className="flex items-center gap-2.5 text-textMain font-medium">
                <Check className="w-4 h-4 text-cyanBrand flex-shrink-0" />
                <span>All Free Community features included</span>
              </div>
              <div className="flex items-center gap-2.5 text-textMain">
                <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Aggressive Scan Mode (Passive metadata, CORS audit)</span>
              </div>
              <div className="flex items-center gap-2.5 text-textMain">
                <Lock className="w-4 h-4 text-violetBrand flex-shrink-0" />
                <span>Private Scan Mode (Zero body retention & sanitization)</span>
              </div>
              <div className="flex items-center gap-2.5 text-textMain">
                <Download className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>Executive PDF Report Downloads</span>
              </div>
              <div className="flex items-center gap-2.5 text-textMain">
                <Puzzle className="w-4 h-4 text-cyanBrand flex-shrink-0" />
                <span>Chrome Extension Companion Integration</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            {userPlan === 'premium' ? (
              <Button variant="primary" size="md" className="w-full" disabled>
                Active Premium Membership
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setCheckoutModalOpen(true)}
                icon={<CreditCard className="w-4 h-4" />}
              >
                Upgrade to Pro — ₹299
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Simulated Demo Checkout Modal */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="Demonstration Checkout — SecureScope Pro"
        description="This simulated payment flow updates your account entitlement without real monetary charges."
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
            <p>
              <strong>Academic Demonstration Mode</strong>: Real payment gateway integration is deferred to future cloud milestones. Proceeding will simulate a successful transaction and grant Premium entitlements.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-obsidian border border-slateBorder space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-textMuted">Item:</span>
              <span className="text-textMain">SecureScope Pro License</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textMuted">Base Price:</span>
              <span className="text-textMain">₹299.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textMuted">GST (Configurable):</span>
              <span className="text-textMain">₹0.00 (Demo Mode)</span>
            </div>
            <div className="border-t border-slateBorder/60 pt-2 flex justify-between font-bold text-cyanBrand">
              <span>Total Simulated:</span>
              <span>₹299.00</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="secondary" size="sm" onClick={() => setCheckoutModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSimulating}
              onClick={handleSimulatedUpgrade}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Simulate Upgrade
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
