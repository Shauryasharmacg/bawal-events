import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api.js';
import { useAuth } from '../../lib/auth-context.js';
import { Search, Download, Filter, Eye, RefreshCw, XCircle, DollarSign, CheckCircle2 } from 'lucide-react';

interface AdminRegistrationsPageProps {
  navigate: (path: string) => void;
}

export const AdminRegistrationsPage: React.FC<AdminRegistrationsPageProps> = ({ navigate }) => {
  const { adminToken } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!adminToken && !localStorage.getItem('bawal_admin_token')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let url = '/api/admin/registrations?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`;
      const res = await fetchApi<{ registrations: any[] }>(url);
      setRegistrations(res.registrations || []);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, adminToken]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this registration?')) return;
    try {
      await fetchApi(`/api/admin/registrations/${id}/cancel`, { method: 'POST' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel');
    }
  };

  const handleRefund = async (id: string) => {
    if (!confirm('Mark this registration and payment as REFUNDED?')) return;
    try {
      await fetchApi(`/api/admin/registrations/${id}/refund`, { method: 'POST' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to refund');
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
            Attendee Database
          </span>
          <h1 className="text-3xl font-black text-white font-['Syne',sans-serif]">
            Registrations ({registrations.length})
          </h1>
        </div>

        <a
          href="/api/admin/registrations/export-csv"
          className="px-4 py-2.5 rounded-xl bg-[#1D1D28] hover:bg-[#2A2A38] text-gray-200 text-xs font-bold flex items-center gap-2 border border-[#2B2B3C] w-fit"
        >
          <Download size={15} />
          Export All CSV
        </a>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[#121218] p-4 rounded-2xl border border-[#232330]">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or registration ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B0B0E] border border-[#242432] text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#0038FF]"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#0B0B0E] border border-[#242432] text-white text-xs focus:outline-none focus:border-[#0038FF]"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PENDING">PENDING</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-[#1C1C26] text-gray-300 hover:text-white border border-[#2B2B3A]"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="p-6 rounded-3xl bg-[#121218] border border-[#232330] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-gray-400 border-b border-[#20202A] uppercase">
              <tr>
                <th className="pb-3 font-semibold">Reg ID</th>
                <th className="pb-3 font-semibold">Attendee Details</th>
                <th className="pb-3 font-semibold">Event / Tier</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Ticket Status</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C24] text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Loading registrations...
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No registrations found matching criteria.
                  </td>
                </tr>
              ) : (
                registrations.map((r) => (
                  <tr key={r.id} className="hover:bg-[#16161F]">
                    <td className="py-3.5 font-mono text-[#FFB800] font-bold">
                      {r.registration_id}
                    </td>
                    <td className="py-3.5">
                      <p className="font-bold text-white">{r.attendee_name}</p>
                      <p className="text-[10px] text-gray-400">{r.attendee_email}</p>
                      <p className="text-[10px] text-gray-500">{r.attendee_phone} • Age: {r.attendee_age} {r.attendee_instagram ? `• @${r.attendee_instagram}` : ''}</p>
                    </td>
                    <td className="py-3.5">
                      <p className="font-semibold text-white">{r.event_title}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#1F1F2B] text-amber-400 font-medium">
                        {r.ticket_type_name}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono text-white font-bold">
                      ₹{r.amount}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'CONFIRMED'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                            : r.status === 'PENDING'
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800'
                            : 'bg-red-950/60 text-red-400 border border-red-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5">
                      {r.ticket_status === 'USED' ? (
                        <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px] font-bold">
                          Checked In
                        </span>
                      ) : r.ticket_status === 'CONFIRMED' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 text-[10px] font-bold">
                          Unchecked
                        </span>
                      ) : (
                        <span className="text-gray-500 text-[10px]">
                          {r.ticket_status || 'N/A'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5">
                        {r.ticket_id && (
                          <button
                            onClick={() => navigate(`/tickets/${r.ticket_id}`)}
                            title="View Digital Pass"
                            className="p-1.5 rounded-lg bg-[#1F1F2A] hover:bg-[#0038FF] text-white transition-colors"
                          >
                            <Eye size={13} />
                          </button>
                        )}
                        {r.status === 'CONFIRMED' && (
                          <>
                            <button
                              onClick={() => handleRefund(r.id)}
                              title="Refund"
                              className="p-1.5 rounded-lg bg-[#1F1F2A] hover:bg-purple-900/50 text-purple-300 transition-colors"
                            >
                              <DollarSign size={13} />
                            </button>
                            <button
                              onClick={() => handleCancel(r.id)}
                              title="Cancel"
                              className="p-1.5 rounded-lg bg-[#1F1F2A] hover:bg-red-900/50 text-red-400 transition-colors"
                            >
                              <XCircle size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
