import React, { useState } from 'react';
import { fetchApi } from '../lib/api.js';
import { useAuth } from '../lib/auth-context.js';
import { Mail, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { BawalLogo } from '../components/BawalLogo.js';

interface LoginPageProps {
  navigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { loginWithToken, loginAdmin } = useAuth();
  const [tab, setTab] = useState<'attendee' | 'admin'>('attendee');

  // Attendee state (Email-only)
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  // Admin state (Empty initial values)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // General state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return setError('Please enter a valid email address.');
    }

    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; message: string }>('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail }),
      });
      setOtpSent(true);
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP to your email.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp.trim()) return setError('Please enter the 6-digit OTP.');

    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; token: string; user: any }>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });

      loginWithToken(res.token, res.user);
      navigate('/my-tickets');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminEmail.trim() || !adminPassword.trim()) {
      return setError('Please enter both email and password.');
    }

    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; token: string; user?: any; admin?: any }>('/api/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({ email: adminEmail.trim(), password: adminPassword.trim() }),
      });

      const adminObj = res.admin || res.user;
      if (res.success && res.token && adminObj) {
        loginAdmin(res.token, adminObj);
        navigate('/admin/dashboard');
      } else {
        setError('Admin authentication failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 space-y-8">
      
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <BawalLogo variant="full" size="sm" className="w-52 h-34" />
        </div>
        <h1 className="text-2xl font-black text-white font-['Syne',sans-serif]">
          Welcome to BAWAL
        </h1>
        <p className="text-xs text-gray-400">
          Access your digital passes, manage tournament RSVPs, or enter organizer administration.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="p-1 rounded-2xl bg-[#060B22] border border-[#132252] flex">
        <button
          onClick={() => {
            setTab('attendee');
            setError(null);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            tab === 'attendee'
              ? 'bg-[#0038FF] text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Attendee Sign In (OTP)
        </button>
        <button
          onClick={() => {
            setTab('admin');
            setError(null);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            tab === 'admin'
              ? 'bg-[#0038FF] text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Organizer Admin
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success alert */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Attendee OTP Login Box */}
      {tab === 'attendee' && (
        <div className="p-7 rounded-3xl bg-[#060B22] border border-[#132252] space-y-6">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#02040D] border border-[#132252] text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#0038FF]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#0038FF] hover:bg-[#002DD6] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#0038FF]/20 transition-all"
              >
                {loading ? 'Sending Code...' : 'Send Login OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-gray-300">Enter 6-Digit OTP</label>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-xs text-[#3888FF] hover:underline font-bold"
                  >
                    Change Email
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#02040D] border border-[#132252] text-white text-center tracking-[0.5em] font-mono text-lg font-bold focus:outline-none focus:border-[#0038FF]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#0038FF] hover:bg-[#002DD6] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#0038FF]/20 transition-all"
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            </form>
          )}

          <div className="pt-2 text-center">
            <span className="text-[11px] text-gray-500">
              No password needed. We verify you safely using instant email OTP.
            </span>
          </div>
        </div>
      )}

      {/* Admin Login Box */}
      {tab === 'admin' && (
        <div className="p-7 rounded-3xl bg-[#060B22] border border-[#132252] space-y-6">
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Admin Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#02040D] border border-[#132252] text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#0038FF]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#02040D] border border-[#132252] text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#0038FF]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0038FF] to-[#3888FF] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#0038FF]/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In as Organizer Admin'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};