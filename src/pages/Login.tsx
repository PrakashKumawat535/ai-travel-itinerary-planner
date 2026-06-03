import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User as UserIcon, Sparkles, AlertCircle } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { setStoredToken, setStoredUser } from '../utils/auth';
import { User } from '../types';

interface LoginProps {
  onAuthSuccess: (user: User) => void;
  onNavigateHome: () => void;
}

export default function Login({ onAuthSuccess, onNavigateHome }: LoginProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Form coordinates
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI States
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validate form outputs against simple boundaries
  const handleValidateForm = (): boolean => {
    setValidationError(null);
    setApiError(null);

    // Regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setValidationError('Please enter a valid email address structure (e.g. pilot@travel.com).');
      return false;
    }

    if (password.length < 6) {
      setValidationError('Your password must contain at least 6 characters.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!handleValidateForm()) return;

    setLoading(true);
    const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password })
      });

      // Synchronize state local storage
      setStoredToken(data.token);
      setStoredUser(data.user);

      // Callback triggers navigation
      onAuthSuccess(data.user);
    } catch (err: any) {
      console.error('Authentication request failed:', err);
      setApiError(err.message || 'Verification connection issues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-page" className="min-h-screen bg-[#050505] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-slate-100">
      
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#c4a661]/5 blur-3xl opacity-30"></div>

      {/* Floating Header */}
      <div className="mb-8 text-center relative cursor-pointer" onClick={onNavigateHome}>
        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-[0.2em] uppercase text-[#c4a661] border border-[#c4a661]/15 px-4 py-1.5 rounded-sm bg-[#c4a661]/5 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          AI TRAVEL ITINERARY PLANNER
        </div>
        <p className="text-[9px] text-white/40 tracking-widest font-mono uppercase">Back to Home page</p>
      </div>

      {/* Auth Card Box */}
      <motion.div
        className="w-full max-w-md p-6 sm:p-8 rounded-sm border border-white/5 bg-[#111111] shadow-2xl relative"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Toggle switches */}
        <div className="flex bg-[#080808] border border-white/5 p-1 rounded-sm mb-6">
          <button
            onClick={() => {
              setActiveTab('login');
              setValidationError(null);
              setApiError(null);
            }}
            className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase rounded-sm tracking-widest transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-[#c4a661] text-black shadow-sm'
                : 'text-white/40 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setValidationError(null);
              setApiError(null);
            }}
            className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase rounded-sm tracking-widest transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-[#c4a661] text-black shadow-sm'
                : 'text-white/40 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Errors view */}
        {(validationError || apiError) && (
          <div className="p-3.5 mb-5 rounded-sm bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span className="font-mono">{validationError || apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email coordinate */}
          <div>
            <label className="block text-[10px] font-mono tracking-widest text-[#c4a661] uppercase mb-1.5">Email Destination</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@travels.com"
                className="w-full bg-[#080808] border border-white/5 rounded-sm pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#c4a661]"
              />
            </div>
          </div>

          {/* Password coordinate */}
          <div>
            <label className="block text-[10px] font-mono tracking-widest text-[#c4a661] uppercase mb-1.5">Access Password</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#080808] border border-white/5 rounded-sm pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#c4a661]"
              />
            </div>
            <div className="text-[9px] font-mono text-white/30 mt-1 uppercase tracking-wide">Must contain at least 6 characters</div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-sm bg-[#c4a661] hover:bg-[#b09352] disabled:bg-[#8c7340]/40 font-semibold text-xs tracking-widest uppercase text-black shadow-lg transition-all duration-200 mt-4 cursor-pointer"
          >
            {loading ? 'Processing...' : activeTab === 'login' ? 'Validate & Sign In' : 'Create Access Profile'}
          </button>
        </form>

        <div className="mt-6 border-t border-white/5 pt-4 text-center">
          <p className="text-[9px] font-mono text-white/35 leading-relaxed uppercase tracking-wider">
            {activeTab === 'login' ? 'Protected cloud validation system' : 'Instant secure passport registration node'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
