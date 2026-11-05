import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ChevronDown,
  User as UserIcon,
  CreditCard,
  LogOut,
  Sliders,
  FlaskConical,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface HeaderProps {
  userPlan?: 'free' | 'premium';
  userName?: string;
  userEmail?: string;
  isDemoMode?: boolean;
  onToggleDemoMode?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userPlan = 'free',
  userName = 'Alex Vance',
  userEmail = 'alex.vance@example.com',
  isDemoMode = false,
  onToggleDemoMode,
  onLogout,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Security Assessment Dashboard';
      case '/history':
        return 'Assessment History & Reports';
      case '/extension':
        return 'Chrome Extension Companion';
      case '/subscription':
        return 'Plans & Subscription';
      case '/profile':
        return 'User Profile & Settings';
      default:
        return 'SecureScope';
    }
  };

  return (
    <>
      <header className="h-[68px] bg-obsidian-900/90 backdrop-blur-md border-b border-slateBorder px-8 flex items-center justify-between sticky top-0 z-20">
        {/* Left: Page Title & Breadcrumb */}
        <div>
          <h1 className="text-base font-semibold text-textMain tracking-tight">
            {getPageTitle(location.pathname)}
          </h1>
          <div className="flex items-center gap-2 text-xs text-textMuted font-mono mt-0.5">
            <span>SecureScope</span>
            <span>/</span>
            <span className="text-cyanBrand">{location.pathname.replace('/', '') || 'dashboard'}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-graphite/60 border border-slateBorder/60 text-xs font-mono text-textMuted">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Safe Mode • Guard Active</span>
          </div>

          {/* Demo Target Sandbox Pill */}
          <button
            onClick={onToggleDemoMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-colors border ${
              isDemoMode
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-graphite text-textMuted border-slateBorder hover:text-textMain'
            }`}
            title="Toggle Localhost Sandbox Assessment Mode"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>{isDemoMode ? 'Sandbox Active' : 'Target: External'}</span>
          </button>

          {/* Plan Badge */}
          <Badge variant={userPlan === 'premium' ? 'premium' : 'free'} withDot>
            {userPlan === 'premium' ? 'Premium' : 'Free Tier'}
          </Badge>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-graphite border border-transparent hover:border-slateBorder transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-slateBorder border border-cyanBrand/30 flex items-center justify-center font-mono font-semibold text-xs text-cyanBrand">
                {userName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-textMuted transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180 text-cyanBrand' : ''
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-graphite border border-slateBorder shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slateBorder/60">
                  <p className="text-xs font-semibold text-textMain">{userName}</p>
                  <p className="text-[11px] text-textMuted font-mono truncate">{userEmail}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-textMuted hover:text-textMain hover:bg-slateBorder/40 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>View Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/subscription');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-textMuted hover:text-textMain hover:bg-slateBorder/40 transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Manage Subscription</span>
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-textMuted hover:text-textMain hover:bg-slateBorder/40 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Preferences</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slateBorder/60">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setLogoutModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Sign Out of SecureScope"
        description="Are you sure you want to end your current session? You will need to log in again to access your assessments."
      >
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setLogoutModalOpen(false)}>
            Stay Signed In
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setLogoutModalOpen(false);
              onLogout?.();
            }}
          >
            Confirm Sign Out
          </Button>
        </div>
      </Modal>
    </>
  );
};

