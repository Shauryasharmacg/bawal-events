import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api.js';
import { useAuth } from '../../lib/auth-context.js';
import { CreditCard, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminPaymentsPage: React.FC = () => {
  const { adminToken } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!adminToken && !localStorage.getItem('bawal_admin_token')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<{ payments: any[] }>('/api/admin/payments');
      setPayments(res.payments || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load payment transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [adminToken]);

  const totalRev = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((acc, p) => acc + parseFloat(p.amount || '0'), 0);

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
            Financial Ledger
          </span>
          <h1 className="text-3xl font-black text-white font-['Syne',sans-serif]">
            Payments & Transactions ({payments.length})
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-400 text-xs font-bold font-mono">
            Collected: ₹{totalRev.toLocaleString('en-IN')}
          </div>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-[#1C1C26] text-gray-300 hover:text-white border border-[#2B2B3A]"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-[#121218] border border-[#232330] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-gray-400 border-b border-[#20202A] uppercase">
              <tr>
                <th className="pb-3 font-semibold">Payment ID</th>
                <th className="pb-3 font-semibold">Reg Code</th>
                <th className="pb-3 font-semibold">Attendee</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Method / Gateway</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C24] text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#16161F]">
                    <td className="py-3.5 font-mono text-[#FFB800]">
                      {p.payu_mihpayid || p.payu_txnid || p.id}
                    </td>
                    <td className="py-3.5 font-mono font-bold text-white">
                      {p.registration_code}
                    </td>
                    <td className="py-3.5">
                      <p className="font-bold text-white">{p.attendee_name}</p>
                      <p className="text-[10px] text-gray-500">{p.attendee_email}</p>
                    </td>
                    <td className="py-3.5 font-mono text-white font-bold text-sm">
                      ₹{p.amount}
                    </td>
                    <td className="py-3.5 font-mono text-gray-400">
                      {p.payment_method || p.payu_mode || 'PayU / UPI'}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'SUCCESS'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                            : p.status === 'PENDING'
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800'
                            : 'bg-red-950/60 text-red-400 border border-red-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-gray-500 font-mono text-[11px]">
                      {new Date(p.created_at).toLocaleString()}
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
