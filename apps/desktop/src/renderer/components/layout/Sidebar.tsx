import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  History,
  Puzzle,
  CreditCard,
  User,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface SidebarProps {
  userPlan?: 'free' | 'premium';
  userName?: string;
  userEmail?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userPlan = 'free',
  userName = 'Alex Vance',
  userEmail = 'alex.vance@example.com',
}) => {
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Scan History', path: '/history', icon: History },
    {
      name: 'Chrome Extension',
      path: '/extension',
      icon: Puzzle,
      isPremiumOnly: true,
    },
    { name: 'Subscription', path: '/subscription', icon: CreditCard },
    { name: 'Profile & Settings', path: '/profile', icon: User },
  ];

  return (
    <aside className="w-64 h-screen bg-obsidian-900 border-r border-slateBorder flex flex-col justify-between select-none fixed left-0 top-0 z-30">
      {/* Brand Header */}
      <div>
        <div className="p-5 flex items-center justify-between border-b border-slateBorder/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-graphite border border-cyanBrand/40 flex items-center justify-center shadow-cyan-glow">
              <ShieldAlert className="w-6 h-6 text-cyanBrand" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-textMain tracking-tight">
                  SecureScope
                </span>
              </div>
              <span className="text-[11px] font-mono text-cyanBrand tracking-wider uppercase">
                Enterprise Shield
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slateBorder/60 text-textMuted">
            v1.0
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-graphite text-cyanBrand border-l-2 border-cyanBrand shadow-sm font-semibold'
                      : 'text-textMuted hover:text-textMain hover:bg-graphite/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-colors group-hover:text-cyanBrand" />
                  <span>{item.name}</span>
                </div>
                {item.isPremiumOnly && userPlan === 'free' && (
                  <span className="text-[10px] font-mono uppercase px-1 py-0.2 rounded bg-cyanBrand/10 text-cyanBrand border border-cyanBrand/20">
                    Pro
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Membership & Profile Card */}
      <div className="p-4 border-t border-slateBorder/60 space-y-3">
        {userPlan === 'free' ? (
          <div className="p-3 rounded-xl bg-gradient-to-b from-graphite to-obsidian border border-slateBorder">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-textMain flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyanBrand" />
                Free Plan
              </span>
              <Badge variant="free">Free</Badge>
            </div>
            <p className="text-[11px] text-textMuted leading-relaxed mb-2.5">
              Unlock Aggressive Scan, PDF reports, and Chrome Extension.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="w-full text-xs py-1.5"
              onClick={() => navigate('/subscription')}
              icon={<ArrowUpRight className="w-3.5 h-3.5" />}
            >
              Upgrade — ₹299
            </Button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-cyanBrand/5 border border-cyanBrand/30 shadow-cyan-glow">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-cyanBrand flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyanBrand" />
                Premium Plan
              </span>
              <Badge variant="premium">Active</Badge>
            </div>
            <p className="text-[11px] text-textMuted">
              All scanning modes & companion extension enabled.
            </p>
          </div>
        )}

        {/* User Mini Bar */}
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-graphite transition-colors cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-slateBorder border border-slateBorder-muted flex items-center justify-center font-mono font-semibold text-xs text-cyanBrand">
            {userName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-textMain truncate">{userName}</p>
            <p className="text-[11px] text-textMuted truncate font-mono">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

