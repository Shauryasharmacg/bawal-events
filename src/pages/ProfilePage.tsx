import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context.js';
import { fetchApi } from '../lib/api.js';
import { User, Mail, Phone, Instagram, CheckCircle2, Ticket } from 'lucide-react';

interface ProfilePageProps {
  navigate: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ navigate }) => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');
  const [saved, setSaved] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await fetchApi(`/api/admin/users/${user.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: user.role }),
      });
      setSaved(true);
      refreshUser();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-white font-bold">Please sign in to view your profile</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 rounded-xl bg-[#0038FF] hover:bg-[#002DD6] text-white text-xs font-bold transition-all"
        >
          Sign In with OTP
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <div>
        <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
          Member Hub
        </span>
        <h1 className="text-3xl font-black text-white font-['Syne',sans-serif]">
          Your Profile
        </h1>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Profile updated!</span>
        </div>
      )}

      <div className="p-8 rounded-3xl bg-[#060B22] border border-[#132252] space-y-6 text-xs">
        <div className="flex items-center gap-4 border-b border-[#132252] pb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0038FF] to-[#3888FF] text-white font-extrabold text-2xl flex items-center justify-center">
            {user.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-['Syne',sans-serif]">
              {user.name || 'Member'}
            </h3>
            <p className="text-gray-400">{user.email || user.mobile}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#0B1538] text-[#60A5FA] font-mono text-[10px] font-bold border border-[#1E3A8A]">
              {user.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-gray-300">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#02040D] border border-[#132252] text-white focus:outline-none focus:border-[#0038FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-gray-300">Email Address</label>
              <input
                type="text"
                disabled
                value={user.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#02040D] border border-[#132252] text-gray-400 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-gray-300">Mobile Phone</label>
              <input
                type="text"
                disabled
                value={user.mobile || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#02040D] border border-[#132252] text-gray-400 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-gray-300">Instagram Handle</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@handle"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#02040D] border border-[#132252] text-white focus:outline-none focus:border-[#0038FF]"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/my-tickets')}
              className="px-5 py-2.5 rounded-xl bg-[#0B1538] hover:bg-[#132252] text-white font-bold flex items-center gap-2 transition-colors border border-[#1E3A8A]"
            >
              <Ticket size={14} className="text-[#3888FF]" />
              View My Passes
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0038FF] hover:bg-[#002DD6] text-white font-bold transition-all shadow-lg shadow-[#0038FF]/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
