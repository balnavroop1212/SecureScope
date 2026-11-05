import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authorizedConsent, setAuthorizedConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time password complexity metrics
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const strengthScore = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (strengthScore <= 2) return { text: 'Weak', color: 'text-red-400 bg-red-500' };
    if (strengthScore <= 4) return { text: 'Moderate', color: 'text-amber-400 bg-amber-500' };
    return { text: 'Strong', color: 'text-emerald-400 bg-emerald-500' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please provide both first and last name.');
      return;
    }

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      setError('Password does not satisfy all complexity requirements.');
      return;
    }

    if (!passwordsMatch) {
      setError('Password confirmation does not match.');
      return;
    }

    if (!authorizedConsent) {
      setError('You must confirm authorized use of the security platform.');
      return;
    }

    setIsSubmitting(true);
    const result = await signup({
      firstName,
      lastName,
      email,
      password,
    });
    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } else {
      setError(result.error || 'Failed to create account.');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-obsidian text-textMain relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyanBrand/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violetBrand/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-graphite border border-cyanBrand/40 flex items-center justify-center mx-auto shadow-cyan-glow">
            <ShieldAlert className="w-6 h-6 text-cyanBrand" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-textMain">
            Create SecureScope Account
          </h1>
          <p className="text-xs font-mono text-cyanBrand uppercase tracking-widest">
            Non-Destructive Assessment Console
          </p>
        </div>

        {/* Card Container */}
        <Card variant="glass" className="p-7 border-slateBorder/90 shadow-2xl">
          {success ? (
            <div className="py-8 text-center space-y-3 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-textMain">Registration Successful</h3>
              <p className="text-xs text-textMuted max-w-xs mx-auto">
                Account created and saved to local secure storage. Redirecting you to sign in...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-textMuted mb-1">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Alex"
                        required
                        className="w-full bg-obsidian border border-slateBorder rounded-lg pl-9 pr-3 py-2 text-xs font-sans text-textMain placeholder-textMuted focus:outline-none focus:border-cyanBrand"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-textMuted mb-1">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Vance"
                        required
                        className="w-full bg-obsidian border border-slateBorder rounded-lg pl-9 pr-3 py-2 text-xs font-sans text-textMain placeholder-textMuted focus:outline-none focus:border-cyanBrand"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-xs font-mono text-textMuted mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.vance@company.com"
                      required
                      className="w-full bg-obsidian border border-slateBorder rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-textMain placeholder-textMuted focus:outline-none focus:border-cyanBrand"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-mono text-textMuted mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full bg-obsidian border border-slateBorder rounded-lg pl-9 pr-10 py-2 text-xs font-mono text-textMain placeholder-textMuted focus:outline-none focus:border-cyanBrand"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1.5 p-2.5 rounded-lg bg-obsidian border border-slateBorder">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-textMuted">Password Strength:</span>
                        <span className={`font-semibold ${getStrengthLabel().color.split(' ')[0]}`}>
                          {getStrengthLabel().text}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slateBorder rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getStrengthLabel().color.split(' ')[1]}`}
                          style={{ width: `${(strengthScore / 5) * 100}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-textMuted pt-1">
                        <span className={hasMinLength ? 'text-emerald-400' : ''}>
                          • 8+ characters
                        </span>
                        <span className={hasUppercase ? 'text-emerald-400' : ''}>
                          • 1 uppercase (A-Z)
                        </span>
                        <span className={hasLowercase ? 'text-emerald-400' : ''}>
                          • 1 lowercase (a-z)
                        </span>
                        <span className={hasNumber ? 'text-emerald-400' : ''}>
                          • 1 number (0-9)
                        </span>
                        <span className={hasSpecial ? 'text-emerald-400' : ''}>
                          • 1 symbol (!@#$)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-mono text-textMuted mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className={`w-full bg-obsidian border rounded-lg pl-9 pr-10 py-2 text-xs font-mono text-textMain placeholder-textMuted focus:outline-none transition-colors ${
                        confirmPassword.length > 0
                          ? passwordsMatch
                            ? 'border-emerald-500 focus:border-emerald-500'
                            : 'border-red-500 focus:border-red-500'
                          : 'border-slateBorder focus:border-cyanBrand'
                      }`}
                    />
                  </div>
                </div>

                {/* Authorized Scope Consent Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-textMuted select-none">
                    <input
                      type="checkbox"
                      checked={authorizedConsent}
                      onChange={(e) => setAuthorizedConsent(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded bg-obsidian border border-slateBorder text-cyanBrand focus:ring-0 cursor-pointer"
                    />
                    <span className="leading-relaxed">
                      I certify that I will use SecureScope strictly to assess web domains that I own or have explicit, documented authorization to evaluate.
                    </span>
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
                  Complete Registration
                </Button>
              </form>

              {/* Login link */}
              <div className="mt-5 pt-4 border-t border-slateBorder/60 text-center">
                <p className="text-xs text-textMuted">
                  Already have an account?{' '}
                  <Link to="/login" className="text-cyanBrand font-semibold hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
