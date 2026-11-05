import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login({ email, password, rememberMe });
    setIsSubmitting(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-obsidian text-textMain relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyanBrand/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violetBrand/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-graphite border border-cyanBrand/40 flex items-center justify-center mx-auto shadow-cyan-glow">
            <ShieldAlert className="w-8 h-8 text-cyanBrand" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-textMain">
            SecureScope
          </h1>
          <p className="text-xs font-mono text-cyanBrand uppercase tracking-widest">
            Desktop Security Assessment Platform
          </p>
        </div>

        {/* Login Card */}
        <Card variant="glass" className="p-8 border-slateBorder/90 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-textMain">Sign In</h2>
            <p className="text-xs text-textMuted mt-1">
              Enter your credentials to access your security assessment console.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-mono text-textMuted mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoFocus
                  required
                  className="w-full bg-obsidian border border-slateBorder rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-textMain placeholder-textMuted focus:outline-none focus:border-cyanBrand transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono text-textMuted">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-[11px] text-cyanBrand hover:underline focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-obsidian border border-slateBorder rounded-lg pl-9 pr-10 py-2 text-xs font-mono text-textMain placeholder-textMuted focus:outline-none focus:border-cyanBrand transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-obsidian border border-slateBorder text-cyanBrand focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-textMuted">Remember this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2 font-mono text-xs"
              isLoading={isSubmitting}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Console
            </Button>
          </form>

          {/* Navigation to Signup */}
          <div className="mt-6 pt-5 border-t border-slateBorder/60 text-center">
            <p className="text-xs text-textMuted">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-cyanBrand font-semibold hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Account Recovery"
        description="SecureScope operates with local cryptographic password hashing."
      >
        <div className="space-y-3 pt-2 text-xs text-textMuted leading-relaxed">
          <p>
            Because SecureScope stores user accounts in your local application directory (<code>%APPDATA%/SecureScope/data/users.json</code>), automated cloud reset emails are not applicable.
          </p>
          <div className="p-3 rounded-lg bg-obsidian border border-slateBorder flex items-start gap-2.5 text-textMain">
            <HelpCircle className="w-4 h-4 text-cyanBrand flex-shrink-0 mt-0.5" />
            <span>
              If you forgot your password during testing, you can register a new account on the signup page or reset <code>users.json</code> in your local application data directory.
            </span>
          </div>
          <div className="flex justify-end pt-3">
            <Button variant="secondary" size="sm" onClick={() => setForgotModalOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

