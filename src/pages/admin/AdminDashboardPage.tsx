import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api.js';
import { useAuth } from '../../lib/auth-context.js';
import {
  Calendar,
  Users,
  CreditCard,
  Ticket,
  TrendingUp,
  Download,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface AdminDashboardPageProps {
  navigate: (path: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ navigate }) => {
  const { adminToken } = useAuth();
  const [data, setData] = useState<{
    stats: any;
    recentRegistrations: any[];
    recentPayments: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!adminToken && !localStorage.getItem('bawal_admin_token')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<{
        stats: any;
        recentRegistrations: any[];
        recentPayments: any[];
      }>('/api/admin/stats');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve admin metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [adminToken]);

  const handleExportCsv = () => {
    const token = localStorage.getItem('bawal_admin_token') || localStorage.getItem('bawal_user_token');
    window.location.href = `/api/admin/registrations/export-csv?token=${token}`;
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-[#181822] rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#181822] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-7xl">
      
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
            Operations Center
          </span>
          <h1 className="text-3xl font-black text-white font-['Syne',sans-serif]">
            Admin Overview
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/admin/checkin')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <QrCode size={16} />
            Gate QR Scanner
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-[#1D1D28] hover:bg-[#2A2A38] text-gray-200 text-xs font-bold flex items-center gap-2 border border-[#2B2B3C] transition-all"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Revenue */}
        <div className="p-6 rounded-3xl bg-[#121218] border border-[#232330] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white font-['Syne',sans-serif]">
              ₹{stats.totalRevenue?.toLocaleString('en-IN') || 0}
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 block font-medium">
            From {stats.confirmedRegistrations || 0} verified passes
          </span>
        </div>

        {/* Total Registrations */}
        <div className="p-6 rounded-3xl bg-[#121218] border border-[#232330] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Registrations</span>
            <div className="w-8 h-8 rounded-xl bg-[#0038FF]/10 text-[#3888FF] flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white font-['Syne',sans-serif]">
              {stats.totalRegistrations || 0}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 block">
            {stats.confirmedRegistrations || 0} Confirmed • {stats.pendingRegistrations || 0} Pending
          </span>
        </div>

        {/* Tickets Sold / Capacity */}
        <div className="p-6 rounded-3xl bg-[#121218] border border-[#232330] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Tickets Sold</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFB800]/10 text-[#FFB800] flex items-center justify-center">
              <Ticket size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white font-['Syne',sans-serif]">
              {stats.ticketsSold || 0}
            </span>
            <span className="text-xs text-gray-500 font-mono">/ 100 max</span>
          </div>
          <span className="text-[11px] text-[#FFB800] block font-medium">
            {stats.ticketsRemaining} spots remaining for BAWAL #001
          </span>
        </div>

        {/* Early Bird vs Regular */}
        <div className="p-6 rounded-3xl bg-[#121218] border border-[#232330] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Tier Breakdown</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Early Bird:</span>
              <span className="font-bold text-white font-mono">{stats.earlyBirdSold || 0} / 20</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Regular:</span>
              <span className="font-bold text-white font-mono">{stats.regularSold || 0}</span>
            </div>
          </div>
          <span className="text-[11px] text-gray-500 block">
            Gate Checked In: {stats.checkedInAttendees || 0} attendees
          </span>
        </div>

      </div>

      {/* Recent Registrations Table */}
      <div className="p-6 rounded-3xl bg-[#121218] border border-[#232330] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white font-['Syne',sans-serif]">
            Recent Registrations
          </h2>
          <button
            onClick={() => navigate('/admin/registrations')}
            className="text-xs text-[#3888FF] hover:underline font-bold"
          >
            View All Registrations →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-gray-400 border-b border-[#20202A] uppercase">
              <tr>
                <th className="pb-3 font-semibold">Reg ID</th>
                <th className="pb-3 font-semibold">Attendee</th>
                <th className="pb-3 font-semibold">Pass Tier</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C24] text-gray-300">
              {data?.recentRegistrations?.map((r: any) => (
                <tr key={r.id} className="hover:bg-[#16161F]">
                  <td className="py-3.5 font-mono text-[#FFB800] font-bold">
                    {r.registration_id}
                  </td>
                  <td className="py-3.5">
                    <p className="font-bold text-white">{r.attendee_name}</p>
                    <p className="text-[10px] text-gray-500">{r.attendee_phone || r.attendee_email}</p>
                  </td>
                  <td className="py-3.5 font-medium">{r.ticket_type_name}</td>
                  <td className="py-3.5 font-mono text-white">₹{r.amount}</td>
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
                  <td className="py-3.5 text-gray-500">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
