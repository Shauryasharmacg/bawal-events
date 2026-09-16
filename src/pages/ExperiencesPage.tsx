import React, { useEffect, useState } from 'react';
import { EventItem } from '../types/index.js';
import { fetchApi } from '../lib/api.js';
import { EventCard } from '../components/EventCard.js';
import { Search, Compass } from 'lucide-react';

interface ExperiencesPageProps {
  navigate: (path: string) => void;
}

export const ExperiencesPage: React.FC<ExperiencesPageProps> = ({ navigate }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<{ events: EventItem[] }>('/api/events');
        setEvents(data.events || []);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.city.toLowerCase().includes(search.toLowerCase()) ||
    e.venue.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Page Header */}
      <div className="space-y-3">
        <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
          All Social Calendar
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white font-['Syne',sans-serif]">
          Upcoming Experiences
        </h1>
        <p className="text-sm text-gray-400 max-w-xl">
          Reserve your spot in high-energy bowling championships, nitro glow showdowns, acoustic socials, and urban gaming nights.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#060B22] p-4 rounded-2xl border border-[#132252]">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by city, venue, experience..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#02040D] border border-[#132252] text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-[#0038FF]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Compass size={14} className="text-[#3888FF]" />
          <span>Showing {filtered.length} active experience{filtered.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Event Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-2xl bg-[#060B22] animate-pulse border border-[#132252]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[#060B22] border border-[#132252] space-y-3">
          <p className="text-white font-bold text-lg">No experiences matched your search</p>
          <p className="text-xs text-gray-400">Try searching for "Bowling" or "New Delhi"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
};
