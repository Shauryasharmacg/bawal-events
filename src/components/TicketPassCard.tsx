import React from 'react';
import { TicketType } from '../types/index.js';
import { Check, Flame, Zap, CheckCircle2 } from 'lucide-react';

interface TicketPassCardProps {
  pass: TicketType;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export const TicketPassCard: React.FC<TicketPassCardProps> = ({
  pass,
  isSelected,
  onSelect,
  disabled,
}) => {
  const isEarlyBird = pass.name.toLowerCase().includes('early bird');
  const isSoldOut = pass.remainingCount <= 0 || disabled;

  return (
    <div
      onClick={() => {
        if (!isSoldOut) onSelect();
      }}
      className={`relative p-5 rounded-2xl border transition-all cursor-pointer ${
        isSoldOut
          ? 'bg-[#060B22]/50 border-[#0E1638] opacity-60 cursor-not-allowed'
          : isSelected
          ? 'bg-[#0B1538] border-[#0038FF] shadow-xl shadow-[#0038FF]/20 ring-1 ring-[#0038FF]'
          : 'bg-[#060B22] border-[#132252] hover:border-[#1E3A8A]'
      }`}
    >
      {/* Top Tag */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isEarlyBird ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0038FF]/20 text-[#60A5FA] border border-[#0038FF]/40 text-[11px] font-black uppercase tracking-wider">
              <Flame size={12} />
              Early Bird Tier
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0E1B4D] text-[#93C5FD] border border-[#1E3A8A] text-[11px] font-black uppercase tracking-wider">
              <Zap size={12} />
              Regular Tier
            </span>
          )}
        </div>

        {/* Selected Check icon */}
        {isSelected && !isSoldOut && (
          <CheckCircle2 size={20} className="text-[#3888FF]" />
        )}
      </div>

      {/* Name and Price */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h4 className="font-extrabold text-lg text-white font-['Syne',sans-serif]">
            {pass.name}
          </h4>
          <span className="text-xs text-gray-400">
            {isSoldOut
              ? 'Tier Sold Out'
              : `${pass.remainingCount} spots available at this price`}
          </span>
        </div>
        <div className="text-right">
          <span className="font-extrabold text-2xl text-white font-['Syne',sans-serif]">
            ₹{pass.price}
          </span>
          <span className="text-[11px] text-gray-400 block">per attendee</span>
        </div>
      </div>

      {/* Perks Checklist */}
      <div className="space-y-2 pt-3 border-t border-[#132252]">
        {pass.perks?.map((perk, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
            <Check size={13} className="text-[#3888FF] shrink-0" />
            <span>{perk}</span>
          </div>
        ))}
      </div>

      {isSoldOut && (
        <div className="mt-4 py-1.5 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 text-center text-xs font-bold uppercase tracking-wider">
          SOLD OUT
        </div>
      )}
    </div>
  );
};
