import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  User,
  Mail,
  Sparkles,
  Sliders,
  LogOut,
  Check,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

interface ContextType {
  userPlan: 'free' | 'premium';
  onPlanToggle?: () => void;
}

export const ProfilePage: React.FC = () => {
  const { userPlan } = useOutletContext<ContextType>();
  const [firstName, setFirstName] = useState('Alex');
  const [lastName, setLastName] = useState('Vance');
  const [saved, setSaved] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Profile Header Card */}
      <Card className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-graphite border-2 border-cyanBrand/40 flex items-center justify-center font-mono font-bold text-xl text-cyanBrand shadow-cyan-glow">
            {firstName[0]}
            {lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-textMain tracking-tight">
                {firstName} {lastName}
              </h2>
              <Badge variant={userPlan === 'premium' ? 'premium' : 'free'}>
                {userPlan === 'premium' ? 'Pro Member' : 'Free Tier'}
              </Badge>
            </div>
            <p className="text-xs text-textMuted font-mono mt-0.5">alex.vance@example.com</p>
          </div>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={() => setLogoutModalOpen(true)}
          icon={<LogOut className="w-4 h-4" />}
        >
          Sign Out
        </Button>
      </Card>

      {/* Account Details & Edit Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold text-textMain flex items-center gap-2">
            <User className="w-4 h-4 text-cyanBrand" />
            Personal Details
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-textMuted mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-obsidian border border-slateBorder rounded-lg px-3 py-2 text-xs font-sans text-textMain focus:outline-none focus:border-cyanBrand"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-textMuted mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-obsidian border border-slateBorder rounded-lg px-3 py-2 text-xs font-sans text-textMain focus:outline-none focus:border-cyanBrand"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-textMuted mb-1">Email Address</label>
              <div className="flex items-center bg-obsidian border border-slateBorder rounded-lg px-3 py-2 text-xs font-mono text-textMuted select-none">
                <Mail className="w-3.5 h-3.5 mr-2" />
                alex.vance@example.com
              </div>
            </div>
            <Button variant="secondary" size="sm" type="submit" className="w-full">
              {saved ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5" /> Changes Saved
                </span>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </Card>

        {/* Membership & Preferences */}
        <div className="space-y-6">
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-textMain flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyanBrand" />
              Membership Status
            </h3>
            <div className="p-4 rounded-xl bg-obsidian border border-slateBorder space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-textMuted">Current Tier:</span>
                <span className="font-semibold text-textMain uppercase font-mono">{userPlan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Status:</span>
                <span className="text-emerald-400 font-mono">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Account ID:</span>
                <span className="text-cyanBrand font-mono">usr_9f4b7a1e2d</span>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-textMain flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyanBrand" />
              Assessment Preferences
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-obsidian border border-slateBorder">
                <span className="text-textMuted">Probe Timeout:</span>
                <span className="font-mono text-textMain">8,000 ms</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-obsidian border border-slateBorder">
                <span className="text-textMuted">SSRF Guard Mode:</span>
                <span className="font-mono text-emerald-400">Enforced</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Logout Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Sign Out of SecureScope"
        description="Are you sure you want to end your current session? You will need to log in again to access your assessments."
      >
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setLogoutModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setLogoutModalOpen(false)}
          >
            Confirm Sign Out
          </Button>
        </div>
      </Modal>
    </div>
  );
};
