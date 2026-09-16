import React, { useState } from 'react';
import { fetchApi } from '../../lib/api.js';
import { useAuth } from '../../lib/auth-context.js';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  UserCheck,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const AdminCheckinPage: React.FC = () => {
  const { admin } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    status: 'VALID' | 'ALREADY_CHECKED_IN' | 'INVALID' | 'CANCELLED';
    message: string;
    checkedInAt?: string;
    checkedInBy?: string;
    ticket?: any;
  } | null>(null);
  const [checkinSuccess, setCheckinSuccess] = useState<string | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setResult(null);
    setCheckinSuccess(null);

    try {
      const res = await fetchApi<{
        valid: boolean;
        status: 'VALID' | 'ALREADY_CHECKED_IN' | 'INVALID' | 'CANCELLED';
        message: string;
        checkedInAt?: string;
        checkedInBy?: string;
        ticket?: any;
      }>(`/api/tickets/verify/${encodeURIComponent(identifier.trim())}`);
      setResult(res);
    } catch (err: any) {
      setResult({
        valid: false,
        status: 'INVALID',
        message: err.message || 'INVALID TICKET: Not found in event records.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!result?.ticket?.ticketId && !identifier) return;
    const targetId = result?.ticket?.ticketId || identifier;

    setCheckinLoading(true);
    try {
      const res = await fetchApi<{
        success: boolean;
        message: string;
        attendeeName: string;
        registrationCode: string;
        checkedInAt: string;
      }>('/api/tickets/checkin', {
        method: 'POST',
        body: JSON.stringify({
          ticketId: targetId,
          staffName: admin?.name || 'Gate Officer',
        }),
      });

      setCheckinSuccess(`CHECKED IN: ${res.attendeeName} (${res.registrationCode}) is admitted!`);
      // Update result state to USED
      setResult({
        valid: true,
        status: 'ALREADY_CHECKED_IN',
        message: 'ALREADY CHECKED IN',
        checkedInAt: res.checkedInAt,
        checkedInBy: admin?.name || 'Gate Officer',
        ticket: result?.ticket,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to check in attendee');
    } finally {
      setCheckinLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-4xl">
      
      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
          Gate Operations
        </span>
        <h1 className="text-3xl font-black text-white font-['Syne',sans-serif]">
          QR Ticket Check-In
        </h1>
        <p className="text-xs text-gray-400">
          Verify attendee credentials, authenticate registration IDs, and confirm admission to prevent pass duplicate usage.
        </p>
      </div>

      {/* Input Verification Box */}
      <div className="p-7 rounded-3xl bg-[#121218] border border-[#232330] space-y-4">
        <form onSubmit={handleVerify} className="space-y-3">
          <label className="text-xs font-bold text-gray-300">
            Scan Gate QR Code or Enter Registration Code / Ticket ID
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <QrCode size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                required
                placeholder="e.g. Scan QR token, or enter BW001-XXXXXX"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0D] border border-[#262635] text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#0038FF] font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="px-6 py-3 rounded-xl bg-[#0038FF] hover:bg-[#002DD6] text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-[#0038FF]/20"
            >
              <Search size={14} />
              {loading ? 'Verifying...' : 'Verify Pass'}
            </button>
          </div>
        </form>

        <div className="flex items-center gap-4 text-[11px] text-gray-500 pt-2 border-t border-[#1C1C24]">
          <span>💡 Tip: USB / Bluetooth 2D barcode scanners will paste directly into this field and press enter automatically.</span>
        </div>
      </div>

      {/* Success Banner */}
      {checkinSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm font-bold flex items-center gap-3 animate-bounce">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <span>{checkinSuccess}</span>
        </div>
      )}

      {/* Verification Result Cards */}
      {result && (
        <div className="space-y-6">
          
          {/* Status 1: VALID TICKET */}
          {result.status === 'VALID' && (
            <div className="p-8 rounded-3xl bg-emerald-950/40 border-2 border-emerald-500/60 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={28} />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                      VERIFICATION SUCCESS
                    </span>
                    <h2 className="text-2xl font-black text-white font-['Syne',sans-serif]">
                      VALID ENTRY PASS
                    </h2>
                  </div>
                </div>

                <span className="px-3.5 py-1 rounded-full bg-emerald-500 text-black text-xs font-black uppercase tracking-wider">
                  UNCHECKED
                </span>
              </div>

              {/* Attendee Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0E1B15] p-5 rounded-2xl border border-emerald-800/50 text-xs">
                <div>
                  <span className="text-gray-400 uppercase text-[10px] block">Attendee Name</span>
                  <span className="text-base font-bold text-white block">{result.ticket?.attendeeName}</span>
                  <span className="text-gray-400 text-[11px]">{result.ticket?.attendeePhone || result.ticket?.attendeeEmail}</span>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-[10px] block">Registration ID</span>
                  <span className="text-lg font-mono font-bold text-[#FFB800] block">{result.ticket?.registrationCode}</span>
                  <span className="text-emerald-400 font-bold">{result.ticket?.ticketTypeName}</span>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-emerald-900/50 text-gray-300">
                  <span className="text-gray-400 uppercase text-[10px] block">Event</span>
                  <span className="font-semibold">{result.ticket?.eventTitle} ({result.ticket?.eventNumber})</span>
                </div>
              </div>

              {/* Check-In CTA Button */}
              <div>
                <button
                  onClick={handleCheckin}
                  disabled={checkinLoading}
                  className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <UserCheck size={18} />
                  {checkinLoading ? 'Checking In...' : 'CONFIRM ATTENDEE ENTRY (CHECK IN)'}
                </button>
              </div>
            </div>
          )}

          {/* Status 2: ALREADY CHECKED IN */}
          {result.status === 'ALREADY_CHECKED_IN' && (
            <div className="p-8 rounded-3xl bg-amber-950/40 border-2 border-amber-500/60 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <AlertTriangle size={28} />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block">
                    WARNING: DUPLICATE ENTRY BLOCKED
                  </span>
                  <h2 className="text-2xl font-black text-white font-['Syne',sans-serif]">
                    ALREADY CHECKED IN
                  </h2>
                </div>
              </div>

              <p className="text-xs text-amber-200/90 leading-relaxed">
                This digital pass has already been admitted through the gate. Do NOT allow re-entry unless authorized by supervisory staff.
              </p>

              <div className="bg-[#1C160E] p-5 rounded-2xl border border-amber-800/50 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Attendee:</span>
                  <span className="font-bold text-white">{result.ticket?.attendeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Registration ID:</span>
                  <span className="font-mono text-[#FFB800]">{result.ticket?.registrationCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Checked In At:</span>
                  <span className="font-mono text-white">
                    {result.checkedInAt ? new Date(result.checkedInAt).toLocaleString() : 'Earlier today'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Staff Officer:</span>
                  <span className="text-gray-200">{result.checkedInBy || 'Gate Staff'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Status 3: INVALID TICKET */}
          {result.status === 'INVALID' && (
            <div className="p-8 rounded-3xl bg-red-950/40 border-2 border-red-500/60 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <XCircle size={28} />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest block">
                    VERIFICATION FAILED
                  </span>
                  <h2 className="text-2xl font-black text-white font-['Syne',sans-serif]">
                    INVALID TICKET
                  </h2>
                </div>
              </div>

              <p className="text-xs text-red-300 leading-relaxed">
                No matching registration found in the BAWAL platform database for <strong>"{identifier}"</strong>. Please verify the code or direct attendee to the help desk.
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
