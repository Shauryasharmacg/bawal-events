import React, { useEffect, useState } from 'react';
import { Ticket } from '../types/index.js';
import { fetchApi } from '../lib/api.js';
import { TicketView } from '../components/TicketView.js';
import { CheckCircle2, ArrowLeft, Ticket as TicketIcon } from 'lucide-react';

interface TicketConfirmationPageProps {
  ticketId: string;
  navigate: (path: string) => void;
}

export const TicketConfirmationPage: React.FC<TicketConfirmationPageProps> = ({ ticketId, navigate }) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<{ ticket: Ticket }>(`/api/tickets/${ticketId}`);
        setTicket(data.ticket);
      } catch (err: any) {
        setError(err.message || 'Unable to find digital ticket.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 animate-pulse space-y-4">
        <div className="h-16 rounded-2xl bg-[#121218]" />
        <div className="h-96 rounded-3xl bg-[#121218]" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-white font-bold">Ticket not found</p>
        <p className="text-xs text-gray-400">{error || 'This digital pass could not be retrieved.'}</p>
        <button
          onClick={() => navigate('/experiences')}
          className="px-6 py-2.5 rounded-xl bg-[#0038FF] hover:bg-[#002DD6] text-white text-xs font-bold transition-all"
        >
          Return to Experiences
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      
      {/* Top Success Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 to-[#121218] border border-emerald-800/40 text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 size={28} />
        </div>
        <h1 className="text-2xl font-black text-white font-['Syne',sans-serif]">
          You're Officially Registered for BAWAL!
        </h1>
        <p className="text-xs text-emerald-300/80 max-w-md mx-auto leading-relaxed">
          Your payment is verified and your pass is active. An official confirmation email with your entry QR code has been dispatched.
        </p>
      </div>

      {/* Ticket Pass Display */}
      <TicketView ticket={ticket} />

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-[#1C1C24] text-xs">
        <button
          onClick={() => navigate('/experiences')}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Explore more experiences
        </button>

        <button
          onClick={() => navigate('/my-tickets')}
          className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition-colors"
        >
          <TicketIcon size={14} />
          View all my passes
        </button>
      </div>

    </div>
  );
};
