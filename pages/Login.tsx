
import React, { useState, useEffect } from 'react';
import { signUp, signIn, getAuthErrorMessage, resetPassword } from '../services/auth';

interface LoginProps {
  onLogin: (uid: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const validatePassword = (pass: string) => {
    if (mode === 'signin') {
      setPasswordError('');
      return true;
    }

    const requirements = [
      { regex: /.{8,}/, label: 'At least 8 characters' },
      { regex: /[A-Z]/, label: 'One uppercase letter' },
      { regex: /[a-z]/, label: 'One lowercase letter' },
      { regex: /[0-9]/, label: 'One number' },
      { regex: /[^A-Za-z0-9]/, label: 'One special character' }
    ];

    const missing = requirements.filter(r => !r.regex.test(pass));
    if (missing.length > 0) {
      setPasswordError(`Required: ${missing.map(m => m.label).join(', ')}`);
      return false;
    }

    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (mode === 'signup') {
      if (!validatePassword(password)) {
        setError('Please fix password errors.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!agreedToTerms) {
        setError('You must agree to the Terms of Service.');
        return;
      }
    }

    setLoading(true);

    try {
      let user;
      if (mode === 'signup') {
        user = await signUp(email, password);
      } else {
        user = await signIn(email, password);
      }

      // Save email for future logins
      localStorage.setItem('bookly_saved_email', email);
      onLogin(user.uid);
    } catch (err: any) {
      const errorCode = err?.code || '';
      setError(getAuthErrorMessage(errorCode));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
      setError('');
    } catch (err: any) {
      setError('Failed to send reset email. Check your email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif' }}>
      <div className="bg-white w-full max-w-sm p-8 rounded-[40px] shadow-2xl shadow-teal-100 relative overflow-hidden">

        {/* Decorative */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 to-teal-400"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="relative z-10 space-y-8">
          {/* Logo */}
          {mode !== 'forgot' && (
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-teal-500 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl shadow-xl shadow-teal-200 rotate-6 mb-4 font-black">
                <span>B.</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Bookly
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                Performance audit & automated bookkeeping.
              </p>
            </div>
          )}

          {/* Sign-in / Sign-up Toggle */}
          {mode !== 'forgot' && (
            <div className="flex bg-slate-100 rounded-2xl p-1">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'signin' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'signup' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}
              >
                Sign Up
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Forgot Password</h2>
              <p className="text-slate-500 text-xs">Enter your email and we'll send you a link to reset your password.</p>
            </div>
          )}


          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-teal-500 transition-all placeholder:text-slate-300"
                  placeholder="name@business.com"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center pr-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Password</label>
                  {mode === 'signin' && (
                    <button type="button" onClick={() => setMode('forgot')} className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Forgot Password?</button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <i className="fa-solid fa-lock"></i>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      validatePassword(e.target.value);
                    }}
                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-12 py-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-teal-500 transition-all placeholder:text-slate-300"
                    placeholder={mode === 'signup' ? '8+ chars, upper, number, special' : 'Enter your password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-500 transition-colors"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {passwordError && mode === 'signup' && (
                  <p className="text-[9px] text-red-500 font-bold px-2 leading-tight">
                    {passwordError}
                  </p>
                )}
              </div>
            )}

            {/* Confirm Password (Sign Up only) */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Confirm Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <i className="fa-solid fa-lock"></i>
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-12 py-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-teal-500 transition-all placeholder:text-slate-300"
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-500 transition-colors"
                  >
                    <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
            )}

            {/* Terms Agreement (Sign Up only) */}
            {mode === 'signup' && (
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-teal-500 rounded"
                  />
                  <span className="text-xs text-slate-500 leading-relaxed">
                    I agree to the{' '}
                    <button type="button" onClick={() => setShowTerms(!showTerms)} className="text-teal-600 font-bold underline underline-offset-2">
                      Terms of Service
                    </button>{' '}
                    regarding AI usage, data processing, and data ownership.
                  </span>
                </label>

                {/* Expandable Terms */}
                {showTerms && (
                  <div className="bg-slate-50 rounded-2xl p-4 text-[11px] text-slate-500 leading-relaxed space-y-2 max-h-40 overflow-y-auto">
                    <p className="font-black text-slate-700 uppercase text-[10px] tracking-widest">Terms of Service</p>
                    <p><strong>AI Usage:</strong> Bookly uses AI to extract order details from text you provide. AI-processed data is used solely to populate your sales records and is not shared with third parties.</p>
                    <p><strong>Data Ownership:</strong> All business data (orders, inventory, expenses, customer information) entered into Bookly remains your property. You may export or delete your data at any time.</p>
                    <p><strong>Data Storage:</strong> Your data is stored securely in the cloud using Firebase and synced to your account. We employ industry-standard encryption to protect your information.</p>
                    <p><strong>Privacy:</strong> We do not sell, rent, or share your personal or business data with any third party without your explicit consent.</p>
                  </div>
                )}
              </div>
            )}

            {/* Success message */}
            {resetSent && (
              <div className="bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl px-4 py-3 flex items-center gap-2">
                <i className="fa-solid fa-circle-check"></i>
                Password reset link sent to your email.
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 text-red-600 text-xs font-bold rounded-xl px-4 py-3 flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}

            <button
              type={mode === 'forgot' ? 'button' : 'submit'}
              onClick={mode === 'forgot' ? handleForgotPassword : undefined}
              disabled={loading || (mode === 'signup' && !agreedToTerms)}
              className="w-full bg-teal-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-teal-200 hover:bg-teal-600 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <i className="fa-solid fa-circle-notch animate-spin"></i>
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                  <i className="fa-solid fa-arrow-right"></i>
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="w-full bg-transparent text-slate-500 py-2 font-bold text-xs uppercase tracking-widest hover:text-teal-600 transition-all"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Back to Login
              </button>
            )}
          </form>

          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            v2.0 • Bookly MVP
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
