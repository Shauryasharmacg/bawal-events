import React, { useState } from 'react';
import { ShieldCheck, Database, Sliders, CheckCircle2, Save } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [brandName, setBrandName] = useState('BAWAL');
  const [tagline, setTagline] = useState('Weekends Hit Different.');
  const [email, setEmail] = useState('tickets@bawal.social');
  const [instagram, setInstagram] = useState('@bawal.social');
  const [currency, setCurrency] = useState('INR (₹)');
  const [earlyBirdCap, setEarlyBirdCap] = useState(20);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-4xl">
      <div>
        <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
          System & White-Label
        </span>
        <h1 className="text-3xl font-black text-white font-['Syne',sans-serif]">
          Platform Configuration
        </h1>
        <p className="text-xs text-gray-400">
          Customize brand appearance, transactional notices, and event ticketing limits.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Platform settings successfully updated!</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="p-8 rounded-3xl bg-[#121218] border border-[#232330] space-y-6 text-xs">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders size={16} className="text-[#3888FF]" />
            Brand & Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-gray-300">Brand Name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0E] border border-[#262638] text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-gray-300">Brand Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0E] border border-[#262638] text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-gray-300">Support Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0E] border border-[#262638] text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-gray-300">Instagram Handle</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0E] border border-[#262638] text-white"
              />
            </div>
          </div>
        </div>

        {/* Ticketing Rules */}
        <div className="pt-6 border-t border-[#1C1C26] space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Ticketing & Capacity Automation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-gray-300">Default Early Bird Cap</label>
              <input
                type="number"
                value={earlyBirdCap}
                onChange={(e) => setEarlyBirdCap(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0E] border border-[#262638] text-white"
              />
              <span className="text-[10px] text-gray-500">
                System automatically switches pricing to Regular Pass once {earlyBirdCap} tickets are sold.
              </span>
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-gray-300">Default Currency</label>
              <input
                type="text"
                disabled
                value={currency}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0E] border border-[#262638] text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Database & Gateway Info */}
        <div className="pt-6 border-t border-[#1C1C26] space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Database size={16} className="text-emerald-400" />
            Infrastructure Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0D0D12] border border-[#1F1F2C] space-y-1">
              <span className="text-[10px] text-gray-500 uppercase block">Database Engine</span>
              <span className="font-bold text-emerald-400">PostgreSQL (PGlite/Cloud)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0D0D12] border border-[#1F1F2C] space-y-1">
              <span className="text-[10px] text-gray-500 uppercase block">Payment Gateway</span>
              <span className="font-bold text-white">PayU Hosted Checkout Active</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0D0D12] border border-[#1F1F2C] space-y-1">
              <span className="text-[10px] text-gray-500 uppercase block">Gate Scanner Engine</span>
              <span className="font-bold text-amber-400">HMAC-SHA256 Tokenized</span>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#0038FF] hover:bg-[#002DD6] text-white font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#0038FF]/20"
          >
            <Save size={15} />
            Save Platform Settings
          </button>
        </div>
      </form>
    </div>
  );
};
