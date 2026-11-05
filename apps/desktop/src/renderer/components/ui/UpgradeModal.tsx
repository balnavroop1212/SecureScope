import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Lock, Download } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureTitle?: string;
  featureDescription?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  featureTitle = 'Premium Feature Restricted',
  featureDescription = 'This advanced security capability requires an active SecureScope Pro membership.',
}) => {
  const navigate = useNavigate();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Unlock SecureScope Pro"
      description={featureTitle}
    >
      <div className="space-y-5 pt-2">
        <p className="text-xs text-textMuted leading-relaxed">
          {featureDescription}
        </p>

        {/* Feature Highlights */}
        <div className="p-4 rounded-xl bg-obsidian border border-slateBorder space-y-2.5 text-xs">
          <div className="flex items-center gap-2.5 text-textMain">
            <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span><strong>Aggressive Scan</strong>: Extended passive CORS and metadata discovery</span>
          </div>
          <div className="flex items-center gap-2.5 text-textMain">
            <Lock className="w-4 h-4 text-violetBrand flex-shrink-0" />
            <span><strong>Private Scan</strong>: Evidence minimization and sensitive token redaction</span>
          </div>
          <div className="flex items-center gap-2.5 text-textMain">
            <Download className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <span><strong>Executive PDF Reports</strong>: Downloadable stakeholder summaries</span>
          </div>
          <div className="flex items-center gap-2.5 text-textMain">
            <ShieldCheck className="w-4 h-4 text-cyanBrand flex-shrink-0" />
            <span><strong>Companion Chrome Extension</strong>: 1-click assessments from browser</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-cyanBrand/10 border border-cyanBrand/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-textMain">SecureScope Pro License</span>
            <p className="text-[11px] font-mono text-cyanBrand">₹299 exclusive of applicable GST</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              navigate('/subscription');
            }}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Upgrade Now
          </Button>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Maybe Later
          </Button>
        </div>
      </div>
    </Modal>
  );
};
