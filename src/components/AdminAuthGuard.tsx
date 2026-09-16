import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context.js';
import { Shield, Lock, ArrowRight, Zap, CheckCircle2, ArrowLeft } from 'lucide-react';
import { fetchApi } from '../lib/api.js';

interface AdminAuthGuardProps {
  navigate: (path: string) => void;
}

export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ navigate }) => {
  const { loginAdmin, loginAsDemoAdmin } = useAuth();
  const [email, setEmail] = useState('admin@bawal.social');
  const [password, setPassword] = useState('BawalAdmin@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetchApi<{
        success: boolean;
        token: string;
        admin: { id: string; email: string; name: string; role: string };
      }>('/api/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      if (res.success && res.token && res.admin) {
        loginAdmin(res.token, res.admin);
      } else {
        setError('Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const ok = await loginAsDemoAdmin();
      if (!ok) {
        setError('Could not establish admin session. Please try manually entering credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Demo admin sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040D] flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0038FF]/10 border border-[#0038FF]/30 text-[#3888FF] shadow-lg shadow-[#0038FF]/10">
            <Lock size={28} />
          </div>
          <div>
            <span className="text-[11px] font-black tracking-[0.25em] text-[#3888FF] uppercase font-['Syne',sans-serif]">
              Restricted Operations Area
            </span>
            <h1 className="text-3xl font-black text-white font-['Syne',sans-serif] mt-1">
              Organizer Sign In
            </h1>
            <p className="text-xs text-gray-400 mt-2">
              Authentication is required to access attendance analytics, gate scanner, ticketing inventory, and event finances.
            </p>
          </div>
        </div>
        {/* Manual Login Card */}
        <div className="p-6 rounded-3xl bg-[#060B22] border border-[#132252] space-y-5">
          <div className="flex items-center justify-between border-b border-[#132252] pb-3 text-xs">
            <span className="font-bold text-gray-300 uppercase tracking-wider">
              Or Enter Staff Credentials
            </span>
            <span className="text-[10px] text-gray-500 font-mono">Role: ADMIN / STAFF</span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleCustomLogin} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-gray-300">Organizer Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#02040D] border border-[#132252] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#0038FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-gray-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#02040D] border border-[#132252] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#0038FF]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0038FF] hover:bg-[#002DD6] text-white text-xs font-bold transition-all border border-[#132252] flex items-center justify-center gap-2 shadow-lg shadow-[#0038FF]/20"
            >
              Sign In to Command Center <ArrowRight size={14} />
            </button>
          </form>
        </div>

        {/* Back to public website */}
        <div className="text-center pt-2">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={13} /> Return to BAWAL Events Website
          </button>
        </div>

      </div>
    </div>
  );
};
