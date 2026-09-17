import React from 'react';
import { EventItem } from '../types/index.js';
import { Calendar, Clock, MapPin, Users, Flame, ArrowRight } from 'lucide-react';

interface EventCardProps {
  event: EventItem;
  navigate: (path: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, navigate }) => {
  // Find lowest price
  const prices = event.ticketTypes?.map((t) => t.price) || [500];
  const minPrice = Math.min(...prices);

  // Early Bird availability check
  const earlyBirdTier = event.ticketTypes?.find((t) => t.name.toLowerCase().includes('early bird'));
  const isEarlyBirdActive = earlyBirdTier && earlyBirdTier.remainingCount > 0;
  const isSoldOut = event.remainingSpots <= 0 || event.status === 'SOLD_OUT';

  return (
    <div className="group relative bg-[#060B22] rounded-2xl border border-[#132252] overflow-hidden hover:border-[#0038FF]/60 transition-all duration-300 hover:shadow-2xl hover:shadow-[#0038FF]/20 flex flex-col">
      
      {/* Hero Image & Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-900">
        <img
          src={event.heroImage}
          alt={event.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060B22] via-transparent to-black/40" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#1E3A8A] text-white font-extrabold text-xs tracking-wider font-['Syne',sans-serif]">
            {event.eventNumber}
          </span>
          {isEarlyBirdActive && !isSoldOut && (
            <span className="px-3 py-1 rounded-full bg-[#0038FF] text-white font-black text-xs tracking-wider flex items-center gap-1 shadow-md animate-pulse">
              <Flame size={13} />
              EARLY BIRD ₹599
            </span>
          )}
        </div>

        {/* Capacity / Spots Badge */}
        <div className="absolute bottom-3 right-4">
          {isSoldOut ? (
            <span className="px-3 py-1 rounded-lg bg-red-600/90 text-white font-black text-xs tracking-wider uppercase shadow-lg">
              SOLD OUT
            </span>
          ) : (
            <span className="px-3 py-1 rounded-lg bg-[#0B1538]/90 backdrop-blur-md border border-[#1E3A8A] text-[#60A5FA] font-bold text-xs flex items-center gap-1.5 shadow-md">
              <Users size={13} />
              {event.remainingSpots} spots left
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
        <div className="space-y-3">
          <h3 className="font-extrabold text-2xl text-white font-['Syne',sans-serif] group-hover:text-[#3888FF] transition-colors leading-tight">
            {event.title}
          </h3>

          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {event.description}
          </p>

          {/* Details Row */}
          <div className="space-y-1.5 pt-2 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#3888FF] shrink-0" />
              <span>{event.dateStr}</span>
              <span className="text-gray-600">•</span>
              <Clock size={14} className="text-[#3888FF] shrink-0" />
              <span>{event.startTime} - {event.endTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[#3888FF] shrink-0" />
              <span className="truncate">{event.venue}, {event.city}</span>
            </div>
          </div>
        </div>

        {/* Price & Action Buttons */}
        <div className="pt-4 border-t border-[#132252] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Pass Starts At</span>
            <div className="flex items-baseline gap-1">
              <span className="font-extrabold text-2xl text-white font-['Syne',sans-serif]">
                ₹{minPrice}
              </span>
              <span className="text-[11px] text-gray-400">/ pass</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/experiences/${event.slug}`)}
              className="px-4 py-2 rounded-xl bg-[#0E1B4D] hover:bg-[#152B7A] text-white text-xs font-bold transition-all"
            >
              Details
            </button>
            <button
              onClick={() => navigate(`/register/${event.slug}`)}
              disabled={isSoldOut}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isSoldOut
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-[#0038FF] hover:bg-[#002DD6] text-white shadow-lg shadow-[#0038FF]/30 hover:-translate-y-0.5'
              }`}
            >
              {isSoldOut ? 'Sold Out' : 'Register'}
              {!isSoldOut && <ArrowRight size={13} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
