import React, { useState, useEffect } from 'react';
import { EventItem, TicketType } from '../types/index.js';
import { fetchApi } from '../lib/api.js';
import { useAuth } from '../lib/auth-context.js';
import { TicketPassCard } from '../components/TicketPassCard.js';
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Flame,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface RegistrationPageProps {
  slug: string;
  navigate: (path: string) => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ slug, navigate }) => {
  const { user } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [selectedPass, setSelectedPass] = useState<TicketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.mobile || '');
  const [age, setAge] = useState<number | string>(user?.age || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');

  useEffect(() => {
    // Load event & passes
    async function load() {
      try {
        const data = await fetchApi<{ event: EventItem }>(`/api/events/${slug}`);
        setEvent(data.event);

        // Auto select available pass (Early Bird if available, otherwise Regular)
        const earlyBird = data.event.ticketTypes?.find((t) => t.name.toLowerCase().includes('early bird'));
        const regular = data.event.ticketTypes?.find((t) => t.name.toLowerCase().includes('regular'));

        if (earlyBird && earlyBird.remainingCount > 0) {
          setSelectedPass(earlyBird);
        } else if (regular && regular.remainingCount > 0) {
          setSelectedPass(regular);
        } else if (data.event.ticketTypes && data.event.ticketTypes.length > 0) {
          setSelectedPass(data.event.ticketTypes[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load registration details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Sync user info if logged in
  useEffect(() => {
    if (user) {
      if (!name && user.name) setName(user.name);
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.mobile) setPhone(user.mobile);
      if (!age && user.age) setAge(user.age);
      if (!gender && user.gender) setGender(user.gender);
      if (!instagram && user.instagram) setInstagram(user.instagram);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form Validations
    if (!name.trim()) return setError('Please enter your full name.');
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email address.');
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) return setError('Please enter a valid 10-digit mobile number.');
    if (!age || Number(age) < 0) return setError('You must be at least 0 years old to attend BAWAL experiences.');
    if (!selectedPass) return setError('Please select an entry pass tier.');

    setSubmitting(true);

    try {
      // 1. Initiate PayU order & pending registration
      const createRes = await fetchApi<{
        success: boolean;
        registrationDbId: string;
        registrationCode: string;
        amount: number;
        ticketTypeName: string;
        txnid: string;
        actionUrl: string;
        payuParams: Record<string, string>;
        isTestMode?: boolean;
      }>('/api/registrations/create', {
        method: 'POST',
        body: JSON.stringify({
          eventId: event?.id,
          ticketTypeId: selectedPass.id,
          attendeeName: name.trim(),
          attendeeEmail: email.trim(),
          attendeePhone: phone.trim(),
          attendeeAge: Number(age),
          attendeeGender: gender,
          attendeeInstagram: instagram.trim().replace(/^@/, ''),
        }),
      });

      if (!createRes.success || !createRes.actionUrl || !createRes.payuParams) {
        throw new Error('Failed to initialize PayU payment checkout.');
      }

      // 2. Submit PayU Hosted Checkout Form (Official Web Checkout standard)
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = createRes.actionUrl;
      form.style.display = 'none';

      Object.entries(createRes.payuParams).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value ?? '');
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 animate-pulse space-y-6">
        <div className="h-40 rounded-3xl bg-[#121218]" />
        <div className="h-96 rounded-3xl bg-[#121218]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-white font-bold">Event not found.</p>
        <button onClick={() => navigate('/experiences')} className="px-4 py-2 bg-[#0038FF] hover:bg-[#002DD6] text-white rounded-xl text-xs font-bold transition-all">
          Browse Experiences
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Event Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#060B22] border border-[#132252] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-[#0B1538] text-[#3888FF] text-xs font-black tracking-wider uppercase font-mono border border-[#1E3A8A]">
              {event.eventNumber}
            </span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 size={13} />
              Registration Open
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Syne',sans-serif]">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-[#3888FF]" />
              {event.dateStr}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-[#3888FF]" />
              {event.startTime} - {event.endTime}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <MapPin size={13} className="text-[#3888FF]" />
              {event.venue}
            </span>
          </div>
        </div>

        {/* Spot capacity reminder */}
        <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-[#132252] pt-3 sm:pt-0 sm:pl-6">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Availability</span>
          <span className="text-2xl font-black text-[#60A5FA] font-mono block">
            {event.remainingSpots} / {event.totalCapacity}
          </span>
          <span className="text-[11px] text-gray-400">spots left</span>
        </div>
      </div>

      {/* Main Registration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
        
        {/* Left: Attendee Form */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-center gap-3">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 bg-[#060B22] p-5 sm:p-8 rounded-3xl border border-[#132252]">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white font-['Syne',sans-serif]">
                1. Attendee Information
              </h2>
              <p className="text-xs text-gray-400">
                Your name will appear on the digital entry ticket and tournament scoresheet.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Full Name <span className="text-[#3888FF]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kabir Malhotra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#02040D] border border-[#132252] text-white text-base sm:text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#0038FF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Email Address <span className="text-[#3888FF]">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#02040D] border border-[#132252] text-white text-base sm:text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#0038FF]"
                />
                <span className="text-[10px] text-gray-500">Ticket QR code is sent here</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Phone (WhatsApp) <span className="text-[#3888FF]">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-[#132252] bg-[#0B1538] text-gray-400 text-xs">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="98710 00000"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-r-xl bg-[#02040D] border border-[#132252] text-white text-base sm:text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#0038FF]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Age <span className="text-[#3888FF]">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={18}
                  max={99}
                  placeholder="24"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#02040D] border border-[#132252] text-white text-base sm:text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#0038FF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#02040D] border border-[#132252] text-white text-base sm:text-xs focus:outline-none focus:border-[#0038FF]"
                >
                  <option value="">Select Gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">
                Instagram Handle <span className="text-gray-500 font-normal">(Optional, for community squad tagging)</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-[#132252] bg-[#0B1538] text-gray-400 text-xs">
                  @
                </span>
                <input
                  type="text"
                  placeholder="bawal_fan"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-4 py-3 rounded-r-xl bg-[#02040D] border border-[#132252] text-white text-base sm:text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#0038FF]"
                />
              </div>
            </div>

            {/* Pass Selection */}
            <div className="pt-6 border-t border-[#132252] space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white font-['Syne',sans-serif]">
                  2. Select Entry Pass Tier
                </h3>
                <p className="text-xs text-gray-400">
                  First 20 tickets qualify for Early Bird tier (₹500). Regular tier applies once Early Bird sells out.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.ticketTypes?.map((pass) => (
                  <TicketPassCard
                    key={pass.id}
                    pass={pass}
                    isSelected={selectedPass?.id === pass.id}
                    onSelect={() => setSelectedPass(pass)}
                    disabled={pass.remainingCount <= 0}
                  />
                ))}
              </div>
            </div>

            {/* Terms acceptance */}
            <div className="pt-4 border-t border-[#132252] flex items-start gap-2.5 text-xs text-gray-400">
              <ShieldCheck size={16} className="text-green-400 shrink-0 mt-0.5" />
              <span>
                By proceeding, you agree to wear socks (mandatory at bowling venue), carry a valid Govt ID, and follow the BAWAL community guidelines.
              </span>
            </div>

            {/* Mobile Submit Button inside form for convenience */}
            <div className="block lg:hidden pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-[#0038FF] hover:bg-[#002DD6] text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-[#0038FF]/30"
              >
                {submitting ? 'Processing Order...' : `Pay ₹${selectedPass?.price || 500} & Confirm`}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 space-y-6">
            
            <div className="p-6 rounded-3xl bg-[#060B22] border border-[#132252] shadow-2xl shadow-black/80 space-y-5">
              <h3 className="text-lg font-black text-white font-['Syne',sans-serif]">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs border-b border-[#132252] pb-4">
                <div className="flex justify-between text-gray-300">
                  <span>Experience:</span>
                  <span className="font-semibold text-white">{event.eventNumber}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Selected Pass:</span>
                  <span className="font-semibold text-[#60A5FA]">{selectedPass?.name || 'Entry Pass'}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Attendee:</span>
                  <span className="font-semibold text-white">{name || 'Guest'}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Platform Fee:</span>
                  <span className="text-emerald-400 font-semibold">₹0 (Waived)</span>
                </div>
              </div>

              {/* Total Row */}
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-sm font-bold text-gray-300">Total Payable</span>
                <span className="text-3xl font-black text-white font-['Syne',sans-serif]">
                  ₹{selectedPass?.price || 500}
                </span>
              </div>

              {/* Included Perks */}
              <div className="p-3.5 rounded-xl bg-[#0B1538] border border-[#1E3A8A] space-y-1.5 text-[11px] text-gray-300">
                <p className="font-bold text-white flex items-center gap-1 text-xs text-[#3888FF]">
                  <Sparkles size={12} />
                  Included with your booking:
                </p>
                <p>• Bowling Championship entry</p>
                <p>• 1 Free Craft Mocktail</p>
                <p>• Nitro Bowling Experience</p>
                <p>• Live Singer & Guitarist sets</p>
                <p>• Digital Pass with Gate QR Code</p>
              </div>

              {/* Desktop Submit Button */}
              <div className="hidden lg:block">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-[#0038FF] hover:bg-[#002DD6] text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-[#0038FF]/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? 'Processing Payment...' : `Confirm & Pay ₹${selectedPass?.price || 500}`}
                  {!submitting && <ArrowRight size={16} />}
                </button>
              </div>

              <div className="text-center">
                <p className="text-[10px] text-gray-500">
                  🔒 256-Bit Encrypted PayU Checkout • Instant QR Ticket Delivery
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
