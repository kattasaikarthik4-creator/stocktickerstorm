import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    login,
    register,
    isLoading,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);

  // Initialize with demo credentials for quick convenience if blank
  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsForgotMode(false);
      setForgotSent(false);
      if (authModalMode === 'login' && !email) {
        setEmail('alex.morgan@tickerstorm.io');
        setPassword('password123');
      }
    }
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isForgotMode) {
      if (!email.trim()) {
        setErrorMessage('Please enter your e-mail.');
        return;
      }
      setForgotSent(true);
      setSuccessMessage('Password reset instructions sent to your e-mail!');
      return;
    }

    if (authModalMode === 'login') {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid e-mail or password.');
      } else {
        setSuccessMessage('Logged in successfully!');
        setTimeout(() => closeAuthModal(), 500);
      }
    } else {
      if (!name.trim()) {
        setErrorMessage("Please enter your name.");
        return;
      }
      const res = await register(name, email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed.');
      } else {
        setSuccessMessage('Account created successfully! Welcome.');
        setTimeout(() => closeAuthModal(), 600);
      }
    }
  };

  const handleQuickDemo = () => {
    setIsForgotMode(false);
    setAuthModalMode('login');
    setEmail('alex.morgan@tickerstorm.io');
    setPassword('password123');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Modal card styled precisely after the reference design */}
      <div className="bg-[#0c0c0e] text-white w-full max-w-[420px] rounded-2xl shadow-2xl border border-white/5 p-8 relative">
        {/* Top-Right Close Button (X) */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Title: Exactly matching "LOGIN OR SIGN UP TO START LEARNING" */}
        <h1 className="text-xl sm:text-[22px] font-black text-center text-white uppercase tracking-tight leading-tight mb-8 px-4 font-sans">
          {isForgotMode
            ? 'RESET YOUR PASSWORD'
            : authModalMode === 'login'
            ? 'LOGIN OR SIGN UP TO START LEARNING'
            : 'CREATE ACCOUNT TO START LEARNING'}
        </h1>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="mb-5 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Inputs matching Reference Design */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Registration Mode Name Input */}
          {authModalMode === 'register' && !isForgotMode && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                What's your name?
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-3 bg-[#222226] text-white placeholder-gray-500 rounded-lg text-sm border border-transparent focus:border-[#5B6EE1] focus:outline-none transition-all"
              />
            </div>
          )}

          {/* Email Input: "What's your e-mail?" */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              What's your e-mail?
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full px-4 py-3 bg-[#222226] text-white placeholder-gray-500 rounded-lg text-sm border border-transparent focus:border-[#5B6EE1] focus:outline-none transition-all"
            />
          </div>

          {/* Password Input: "Your password?" (hidden in forgot mode) */}
          {!isForgotMode && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                {authModalMode === 'login' ? 'Your password?' : 'Choose a password'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 bg-[#222226] text-white placeholder-gray-500 rounded-lg text-sm border border-transparent focus:border-[#5B6EE1] focus:outline-none transition-all"
              />
            </div>
          )}

          {/* Main Action Button: Solid Periwinkle Purple "#5B6EE1" with text "Login" */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-[#5B6EE1] hover:bg-[#4E61DB] active:scale-[0.99] text-white font-bold text-base rounded-lg transition-all shadow-md shadow-[#5B6EE1]/20 mt-6 flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isForgotMode ? (
              'Send Reset Link'
            ) : authModalMode === 'login' ? (
              'Login'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer Links matching Reference Design */}
        <div className="flex items-center justify-between text-xs font-semibold mt-7 pt-2">
          {isForgotMode ? (
            <button
              type="button"
              onClick={() => {
                setIsForgotMode(false);
                setAuthModalMode('login');
              }}
              className="text-[#5B6EE1] hover:underline"
            >
              Back to Login
            </button>
          ) : authModalMode === 'login' ? (
            <>
              {/* Left link: "Create Account" */}
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('register');
                  setErrorMessage(null);
                }}
                className="text-[#5B6EE1] hover:underline"
              >
                Create Account
              </button>

              {/* Right link: "Forgot your password?" */}
              <button
                type="button"
                onClick={() => {
                  setIsForgotMode(true);
                  setErrorMessage(null);
                }}
                className="text-[#5B6EE1] hover:underline"
              >
                Forgot your password?
              </button>
            </>
          ) : (
            <>
              {/* Registration Mode Footer Switch */}
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('login');
                  setErrorMessage(null);
                }}
                className="text-[#5B6EE1] hover:underline"
              >
                Already have an account? Login
              </button>

              <button
                type="button"
                onClick={handleQuickDemo}
                className="text-gray-400 hover:text-white"
              >
                Demo Fill
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
