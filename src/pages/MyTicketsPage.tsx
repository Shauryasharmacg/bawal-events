import React, { useState, useEffect } from 'react';
import { Ticket } from '../types/index.js';
import { fetchApi } from '../lib/api.js';
import { useAuth } from '../lib/auth-context.js';
import { TicketView } from '../components/TicketView.js';
import { Ticket as TicketIcon, Search, AlertCircle, ArrowRight } from 'lucide-react';

interface MyTicketsPageProps {
  navigate: (path: string) => void;
}

export const MyTicketsPage: React.FC<MyTicketsPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchIdentifier, setSearchIdentifier] = useState(user?.email || user?.mobile || '');
  const [searched, setSearched] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const fetchTickets = async (ident: string) => {
    if (!ident.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await fetchApi<{ tickets: Ticket[] }>(`/api/registrations/my-tickets?identifier=${encodeURIComponent(ident.trim())}`);
      setTickets(data.tickets || []);
      if (data.tickets && data.tickets.length > 0) {
        setSelectedTicket(data.tickets[0]);
      } else {
        setSelectedTicket(null);
      }
    } catch (err) {
      console.error('Failed to retrieve passes:', err);
      setTickets([]);
      setSelectedTicket(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email || user?.mobile) {
      const target = user.email || user.mobile || '';
      setSearchIdentifier(target);
      fetchTickets(target);
    }
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="space-y-2">
        <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
          Attendee Portal
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white font-['Syne',sans-serif]">
          My Digital Passes
        </h1>
        <p className="text-xs text-gray-400 max-w-lg">
          Access your confirmed BAWAL passes with live gate QR codes for check-in.
        </p>
      </div>

      {/* Search by Email or Phone */}
      <div className="p-6 rounded-2xl bg-[#060B22] border border-[#132252] max-w-xl space-y-3">
        <label className="text-xs font-semibold text-gray-300">
          Search passes by Email, Phone, or Registration Code
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="e.g. your email, 98710..., or REG-XXXXXX"
              value={searchIdentifier}
              onChange={(e) => setSearchIdentifier(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTickets(searchIdentifier)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#02040D] border border-[#132252] text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#0038FF]"
            />
          </div>
          <button
            onClick={() => fetchTickets(searchIdentifier)}
            disabled={loading || !searchIdentifier.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#0038FF] hover:bg-[#002DD6] text-white text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-[#0038FF]/20"
          >
            {loading ? 'Searching...' : 'Find Passes'}
          </button>
        </div>
      </div>

      {/* Display Results */}
      {searched && !loading && tickets.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#060B22] border border-[#132252] text-center space-y-3 max-w-lg">
          <AlertCircle size={28} className="text-gray-500 mx-auto" />
          <p className="text-white font-bold text-sm">No passes found for this identifier</p>
          <p className="text-xs text-gray-400">
            Please check the email or mobile number used during registration, or register for an upcoming experience.
          </p>
          <button
            onClick={() => navigate('/experiences')}
            className="px-4 py-2 rounded-xl bg-[#0038FF] text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#002DD6] shadow-lg shadow-[#0038FF]/20"
          >
            Explore Experiences <ArrowRight size={13} />
          </button>
        </div>
      ) : tickets.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Ticket list selector */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Your Passes ({tickets.length})
            </h3>
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedTicket?.id === t.id
                      ? 'bg-[#0B1538] border-[#0038FF] shadow-lg shadow-[#0038FF]/20'
                      : 'bg-[#060B22] border-[#132252] hover:border-[#1E3A8A]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/50 text-[#3888FF] text-[10px] font-mono font-bold border border-[#132252]">
                      {t.eventNumber}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      t.status === 'USED' ? 'text-gray-400' : 'text-emerald-400'
                    }`}>
                      {t.status === 'USED' ? 'Checked In' : 'Active'}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm font-['Syne',sans-serif]">
                    {t.eventTitle}
                  </h4>
                  <p className="text-xs text-[#3888FF] font-mono mt-1 font-bold">
                    {t.registrationCode}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 pt-2 border-t border-[#132252]">
                    <span>{t.attendeeName}</span>
                    <span>{t.eventDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket pass view */}
          <div className="lg:col-span-2">
            {selectedTicket && <TicketView ticket={selectedTicket} />}
          </div>

        </div>
      ) : null}

    </div>
  );
};
