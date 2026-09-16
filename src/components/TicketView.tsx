import React from 'react';
import { Ticket } from '../types/index.js';
import { downloadTicketPdf } from '../lib/ticket-pdf.js';
import { Download, Printer, CheckCircle2, AlertCircle, Calendar, Clock, MapPin, Sparkles } from 'lucide-react';
import { BawalLogo } from './BawalLogo.js';

interface TicketViewProps {
  ticket: Ticket;
}

export const TicketView: React.FC<TicketViewProps> = ({ ticket }) => {
  const isUsed = ticket.status === 'USED';
  const isCancelled = ticket.status === 'CANCELLED';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#060B22] p-3 sm:p-4 rounded-2xl border border-[#132252]">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          {isUsed ? (
            <span className="px-3 py-1 rounded-full bg-gray-700/60 text-gray-300 border border-gray-600 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              ALREADY CHECKED IN
            </span>
          ) : isCancelled ? (
            <span className="px-3 py-1 rounded-full bg-red-950/60 text-red-400 border border-red-800 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle size={13} />
              PASS CANCELLED
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 size={13} />
              CONFIRMED ENTRY PASS
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none min-h-[42px] px-3 sm:px-4 py-2 rounded-xl bg-[#0E1B4D] hover:bg-[#152B7A] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Printer size={14} />
            Print Ticket
          </button>
          <button
            onClick={() => downloadTicketPdf(ticket)}
            className="flex-1 sm:flex-none min-h-[42px] px-3 sm:px-4 py-2 rounded-xl bg-[#0038FF] hover:bg-[#002DD6] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-[#0038FF]/30 transition-all"
          >
            <Download size={14} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Main Digital Ticket Card (Styled like an ultra-premium VIP lanyard pass) */}
      <div
        id="printable-ticket"
        className="w-full max-w-md mx-auto relative bg-[#030617] rounded-3xl border-2 border-[#152B7A] shadow-2xl shadow-black/80 overflow-hidden"
      >
        {/* Top Glow bar */}
        <div className="h-3 bg-gradient-to-r from-[#0038FF] via-[#3888FF] to-[#0038FF]" />

        {/* Lanyard cutout ring illusion */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-full bg-[#080E28] border border-[#1E3A8A]" />

        <div className="p-5 sm:p-8 pt-8 sm:pt-10 text-center space-y-5 sm:space-y-6">
          {/* Brand Header */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <BawalLogo variant="full" size="sm" className="w-40 sm:w-44 h-24 sm:h-28 max-w-full" />
          </div>

          {/* Event Number & Title */}
          <div className="py-3 border-y border-[#132252] space-y-1">
            <span className="text-xs font-extrabold text-[#60A5FA] uppercase tracking-widest block font-['Syne',sans-serif]">
              {ticket.eventNumber}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white font-['Syne',sans-serif]">
              {ticket.eventTitle}
            </h2>
            <span className="inline-block px-3 py-0.5 rounded-full bg-[#0B1538] border border-[#1E3A8A] text-[#3888FF] text-[11px] font-bold tracking-wide mt-1">
              {ticket.ticketTypeName}
            </span>
          </div>

          {/* Registration Code Display */}
          <div className="bg-[#080E28] p-3.5 sm:p-4 rounded-2xl border border-[#1E3A8A] space-y-1">
            <span className="text-[10px] text-[#8090B0] uppercase tracking-wider font-semibold block">
              Official Registration ID
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#60A5FA] tracking-widest font-mono">
              {ticket.registrationCode}
            </span>
          </div>

          {/* Attendee Details */}
          <div className="text-left bg-[#060B20] p-3.5 sm:p-4 rounded-2xl border border-[#132252] space-y-3 text-xs">
            <div>
              <span className="text-gray-400 uppercase text-[10px] block">Attendee Name</span>
              <span className="text-sm font-bold text-white">{ticket.attendeeName}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#132252]">
              <div>
                <span className="text-gray-400 uppercase text-[10px] block">Date</span>
                <span className="font-semibold text-gray-200 flex items-center gap-1 text-[11px] sm:text-xs">
                  <Calendar size={12} className="text-[#3888FF] shrink-0" />
                  <span className="truncate">{ticket.eventDate}</span>
                </span>
              </div>
              <div>
                <span className="text-gray-400 uppercase text-[10px] block">Time</span>
                <span className="font-semibold text-gray-200 flex items-center gap-1 text-[11px] sm:text-xs">
                  <Clock size={12} className="text-[#3888FF] shrink-0" />
                  <span className="truncate">{ticket.eventTime}</span>
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#132252]">
              <span className="text-gray-400 uppercase text-[10px] block">Venue</span>
              <span className="font-semibold text-gray-200 flex items-center gap-1 text-[11px] sm:text-xs">
                <MapPin size={12} className="text-[#3888FF] shrink-0" />
                <span className="truncate">{ticket.eventVenue}</span>
              </span>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl inline-block mx-auto max-w-full">
            {ticket.qrDataUrl ? (
              <img
                src={ticket.qrDataUrl}
                alt="Ticket QR Code"
                className="w-40 sm:w-48 h-40 sm:h-48 mx-auto object-contain"
              />
            ) : (
              <div className="w-40 sm:w-48 h-40 sm:h-48 bg-gray-200 flex items-center justify-center text-black text-xs font-mono">
                QR CODE
              </div>
            )}
            <p className="text-[10px] text-gray-700 font-mono font-bold mt-2 uppercase tracking-wider">
              SCAN FOR GATE CHECK-IN
            </p>
          </div>

          {/* Ticket Security Footer */}
          <div className="space-y-1 text-[11px] text-[#6E7898]">
            <p className="flex items-center justify-center gap-1 text-[#60A5FA] font-medium">
              <Sparkles size={12} />
              Includes 1 Free Craft Mocktail & Nitro Bowling
            </p>
            <p>Non-transferable at gate. Valid Govt ID required.</p>
            <p className="font-mono text-[9px] text-[#556080]">TICKET REF: {ticket.ticketId}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
