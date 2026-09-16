import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api.js';
import { useAuth } from '../../lib/auth-context.js';
import { Plus, Trash2, ExternalLink } from 'lucide-react';

export const AdminSponsorsPage: React.FC = () => {
  const { adminToken } = useAuth();
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [website, setWebsite] = useState('');

  const loadSponsors = async () => {
    if (!adminToken && !localStorage.getItem('bawal_admin_token')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<{ sponsors: any[] }>('/api/admin/sponsors');
      setSponsors(res.sponsors || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load sponsors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSponsors();
  }, [adminToken]);

  const handleAddSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !logoUrl) return;

    try {
      await fetchApi('/api/admin/sponsors', {
        method: 'POST',
        body: JSON.stringify({ name, logoUrl, website, displayOrder: sponsors.length + 1 }),
      });
      setName('');
      setLogoUrl('');
      setWebsite('');
      loadSponsors();
    } catch (err: any) {
      alert(err.message || 'Failed to add sponsor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this partner brand?')) return;
    try {
      await fetchApi(`/api/admin/sponsors/${id}`, { method: 'DELETE' });
      loadSponsors();
    } catch (err: any) {
      alert(err.message || 'Failed to delete sponsor');
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-5xl">
      <div>
        <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
          Brand Collaborations
        </span>
        <h1 className="text-3xl font-black text-white font-['Syne',sans-serif]">
          Sponsors & Partners
        </h1>
      </div>

      {/* Add New Sponsor Form */}
      <div className="p-6 rounded-3xl bg-[#121218] border border-[#232330] space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Add Partner Brand
        </h3>
        <form onSubmit={handleAddSponsor} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <input
            type="text"
            required
            placeholder="Brand Name (e.g. Red Bull)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-[#0B0B0E] border border-[#262638] text-white"
          />
          <input
            type="text"
            required
            placeholder="Logo Image URL"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-[#0B0B0E] border border-[#262638] text-white"
          />
          <input
            type="text"
            placeholder="Website URL"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-[#0B0B0E] border border-[#262638] text-white"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#0038FF] hover:bg-[#002DD6] text-white font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-[#0038FF]/20"
          >
            <Plus size={15} /> Add Brand
          </button>
        </form>
      </div>

      {/* Sponsors List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sponsors.map((sp) => (
          <div
            key={sp.id}
            className="p-5 rounded-2xl bg-[#121218] border border-[#232330] flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <img
                src={sp.logo_url}
                alt={sp.name}
                className="w-12 h-12 rounded-xl object-cover border border-[#2B2B3C] bg-white/5"
              />
              <div>
                <p className="font-bold text-white text-sm">{sp.name}</p>
                {sp.website && (
                  <a
                    href={sp.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-gray-400 hover:text-[#3888FF] flex items-center gap-1 mt-0.5"
                  >
                    <span>Website</span> <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>

            <button
              onClick={() => handleDelete(sp.id)}
              className="p-2 rounded-lg bg-[#1D1D28] text-gray-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
