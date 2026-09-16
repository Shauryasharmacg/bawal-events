import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api.js';
import { EventItem } from '../../types/index.js';
import { Plus, Edit2, Calendar, MapPin, Users, ExternalLink, X } from 'lucide-react';

interface AdminEventsPageProps {
  navigate: (path: string) => void;
}

export const AdminEventsPage: React.FC<AdminEventsPageProps> = ({ navigate }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // New Event Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [eventNumber, setEventNumber] = useState('BAWAL #002');
  const [slug, setSlug] = useState('');
  const [dateStr, setDateStr] = useState('18/10/26');
  const [startTime, setStartTime] = useState('11:00 AM');
  const [endTime, setEndTime] = useState('02:00 PM');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [totalCapacity, setTotalCapacity] = useState(100);
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1545809074-59472b3f5ecc?auto=format&fit=crop&w=1200&q=80');
  const [description, setDescription] = useState('');

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ events: EventItem[] }>('/api/events');
      setEvents(res.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const autoSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await fetchApi('/api/events', {
        method: 'POST',
        body: JSON.stringify({
          title,
          subtitle,
          eventNumber,
          slug: autoSlug,
          dateStr,
          startTime,
          endTime,
          venue,
          address,
          city,
          totalCapacity: Number(totalCapacity),
          heroImage,
          description,
          about: description,
          highlights: ['Bowling Championship', 'Live Music', 'Free Mocktail', 'Nitro Bowling Experience'],
          whatsIncluded: ['1 Bowling Game', '1 Free Mocktail', 'Tournament Entry', 'Digital QR Ticket'],
          rules: ['Socks mandatory', '18+ age limit', 'Govt ID required'],
          faqs: [],
          status: 'PUBLISHED',
          ticketTypes: [
            { name: 'Early Bird Pass', price: 500, capacity: 20, perks: ['Championship Entry', 'Free Mocktail'] },
            { name: 'Regular Pass', price: 600, capacity: totalCapacity - 20, perks: ['Championship Entry', 'Free Mocktail'] },
          ],
        }),
      });

      setModalOpen(false);
      loadEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to create event');
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
            Event Catalog
          </span>
          <h1 className="text-3xl font-black text-white font-['Syne',sans-serif]">
            Experiences Management
          </h1>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#0038FF] hover:bg-[#002DD6] text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#0038FF]/20"
        >
          <Plus size={16} />
          Create New Experience
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((ev) => (
          <div key={ev.id} className="p-6 rounded-3xl bg-[#121218] border border-[#232330] space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#1C1C28] text-[#3888FF] text-xs font-mono font-bold">
                {ev.eventNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-[10px] font-bold uppercase">
                {ev.status}
              </span>
            </div>

            <div className="flex gap-4 items-center">
              <img
                src={ev.heroImage}
                alt={ev.title}
                className="w-20 h-20 rounded-2xl object-cover border border-[#252535] shrink-0"
              />
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-white font-['Syne',sans-serif]">
                  {ev.title}
                </h3>
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#3888FF]" />
                  {ev.dateStr} • {ev.startTime}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#3888FF]" />
                  {ev.venue}, {ev.city}
                </p>
              </div>
            </div>

            {/* Capacity Progress */}
            <div className="p-3.5 rounded-xl bg-[#0D0D12] border border-[#1E1E28] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Registrations:</span>
                <span className="font-mono font-bold text-blue-400">
                  {ev.registeredCount} / {ev.totalCapacity}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#1F1F2B] overflow-hidden">
                <div
                  className="h-full bg-[#0038FF] rounded-full"
                  style={{ width: `${Math.min(100, (ev.registeredCount / ev.totalCapacity) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>Remaining: {ev.remainingSpots}</span>
                <span>Capacity: {ev.totalCapacity}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1C1C24] text-xs">
              <button
                onClick={() => navigate(`/experiences/${ev.slug}`)}
                className="text-[#3888FF] font-semibold hover:underline flex items-center gap-1"
              >
                <ExternalLink size={13} />
                View Public Page
              </button>
              <button
                onClick={() => navigate(`/register/${ev.slug}`)}
                className="text-gray-300 hover:text-white font-medium"
              >
                Open Registration →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for creating new event */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121218] border border-[#262638] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-[#20202A] pb-4">
              <h2 className="text-xl font-bold text-white font-['Syne',sans-serif]">
                Create New BAWAL Experience
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-300">Event Number</label>
                  <input
                    type="text"
                    required
                    value={eventNumber}
                    onChange={(e) => setEventNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0B0E] border border-[#232332] text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-300">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Arcade Showdown"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0B0E] border border-[#232332] text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-300">Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Nitro games, craft sips, and multiplayer battles"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0B0E] border border-[#232332] text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-300">Date (DD/MM/YY)</label>
                  <input
                    type="text"
                    required
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0B0E] border border-[#232332] text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-300">Start Time</label>
                  <input
                    type="text"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0B0E] border border-[#232332] text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-300">End Time</label>
                  <input
                    type="text"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0B0E] border border-[#232332] text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-300">Venue</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smaaash Bowling Arena"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0B0E] border border-[#232332] text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-300">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0B0E] border border-[#232332] text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-300">Address</label>
                <input
                  type="text"
                  required
                  placeholder="Full venue address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0B0E] border border-[#232332] text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-300">Total Capacity</label>
                  <input
                    type="number"
                    required
                    value={totalCapacity}
                    onChange={(e) => setTotalCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0B0E] border border-[#232332] text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-300">Hero Image URL</label>
                  <input
                    type="text"
                    value={heroImage}
                    onChange={(e) => setHeroImage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0B0E] border border-[#232332] text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-300">Short Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief pitch for social cards and listings..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0B0E] border border-[#232332] text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#20202A]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1D1D28] text-gray-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#0038FF] hover:bg-[#002DD6] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#0038FF]/20"
                >
                  Publish Experience
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
