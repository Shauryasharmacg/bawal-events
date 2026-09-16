import React, { useEffect, useState } from 'react';
import { EventItem } from '../types/index.js';
import { fetchApi } from '../lib/api.js';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Flame,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Trophy,
  Music,
  ArrowRight,
  Share2,
  HelpCircle,
  Wine,
} from 'lucide-react';

interface ExperienceDetailPageProps {
  slug: string;
  navigate: (path: string) => void;
}

export const ExperienceDetailPage: React.FC<ExperienceDetailPageProps> = ({ slug, navigate }) => {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      try {
        const data = await fetchApi<{ event: EventItem }>(`/api/events/${slug}`);
        setEvent(data.event);
      } catch (err: any) {
        setError(err.message || 'Failed to load experience');
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 space-y-8 animate-pulse">
        <div className="h-96 rounded-3xl bg-[#121218]" />
        <div className="h-48 rounded-2xl bg-[#121218]" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Experience Not Found</h2>
        <p className="text-sm text-gray-400">{error || 'The requested experience could not be loaded.'}</p>
        <button
          onClick={() => navigate('/experiences')}
          className="px-6 py-2.5 rounded-xl bg-[#0038FF] hover:bg-[#002DD6] text-white text-xs font-bold transition-all"
        >
          View All Experiences
        </button>
      </div>
    );
  }

  // Pricing & spots logic from real database data
  const earlyBirdTier = event.ticketTypes?.find((t) => t.name.toLowerCase().includes('early bird'));
  const regularTier = event.ticketTypes?.find((t) => t.name.toLowerCase().includes('regular'));
  const isEarlyBirdActive = earlyBirdTier && earlyBirdTier.remainingCount > 0;
  const isSoldOut = event.remainingSpots <= 0 || event.status === 'SOLD_OUT';
  const activePrice = isEarlyBirdActive ? earlyBirdTier.price : (regularTier?.price || 600);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-28 lg:pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[48vh] sm:min-h-[65vh] flex items-end pb-8 sm:pb-12 overflow-hidden bg-gray-950">
        <img
          src={event.heroImage}
          alt={event.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-35 filter brightness-90 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/80 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4 sm:space-y-6">
          
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#132252] text-white font-extrabold text-[11px] sm:text-xs tracking-wider font-['Syne',sans-serif]">
              {event.eventNumber}
            </span>
            {isEarlyBirdActive && !isSoldOut && (
              <span className="px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-[#0038FF] text-white font-black text-[10px] sm:text-xs tracking-wider flex items-center gap-1.5 shadow-lg shadow-[#0038FF]/30 animate-pulse">
                <Flame size={12} />
                EARLY BIRD ₹500 ({earlyBirdTier.remainingCount} LEFT)
              </span>
            )}
            <span className="px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-[#060B22] border border-[#132252] text-[#60A5FA] text-[10px] sm:text-xs font-bold flex items-center gap-1.5">
              <Users size={12} />
              {event.remainingSpots} spots of {event.totalCapacity}
            </span>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1.5 sm:space-y-2 max-w-4xl">
            <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-['Syne',sans-serif] leading-tight">
              {event.title}
            </h1>
            {event.subtitle && (
              <p className="text-sm sm:text-lg text-blue-300 font-medium">
                {event.subtitle}
              </p>
            )}
          </div>

          {/* Key Event Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 max-w-3xl pt-1 sm:pt-2 text-xs text-gray-200">
            <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-[#060B22]/90 border border-[#132252] backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-[#0038FF]/20 text-[#3888FF] flex items-center justify-center shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase block">Event Date</span>
                <span className="font-bold text-xs sm:text-sm text-white">{event.dateStr}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-[#060B22]/90 border border-[#132252] backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-[#0038FF]/20 text-[#3888FF] flex items-center justify-center shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase block">Timing</span>
                <span className="font-bold text-xs sm:text-sm text-white">{event.startTime} - {event.endTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-[#060B22]/90 border border-[#132252] backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-[#0038FF]/20 text-[#3888FF] flex items-center justify-center shrink-0">
                <MapPin size={18} />
              </div>
              <div className="truncate">
                <span className="text-[10px] text-gray-400 uppercase block">Venue</span>
                <span className="font-bold text-xs sm:text-sm text-white truncate block">{event.venue}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN LAYOUT: DETAILS + BOOKING SIDEBAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left: Detailed Info */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* About Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white font-['Syne',sans-serif] flex items-center gap-2">
                <span>About The Event</span>
              </h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {event.about}
              </p>
            </div>

            {/* Highlights Grid */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white font-['Syne',sans-serif]">
                Event Highlights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.highlights?.map((highlight, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#121217] border border-[#22222E] flex items-center gap-3 text-sm font-semibold text-gray-200"
                  >
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bowling Championship Feature Block */}
            <div className="p-7 rounded-3xl bg-gradient-to-br from-[#161622] to-[#101018] border border-[#2B2B3C] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFB800]/20 text-[#FFB800] flex items-center justify-center">
                <Trophy size={24} />
              </div>
              <h3 className="text-2xl font-black text-white font-['Syne',sans-serif]">
                The Bowling Championship
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                The Bowling Championship will be a team-based competition. Participants will be divided into different teams and each team will play their bowling rounds. The scores of all the players in a team will be added together to calculate the team’s total score.
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                The team with the highest combined score will be declared the winner. The championship is about teamwork and not just individual performance. The entire winning team will receive prizes and every member of the winning team will get a prize!
              </p>
            </div>

            {/* Animated Nitro Bowling Experience */}
            <div className="p-7 rounded-3xl bg-gradient-to-br from-[#060B22] to-[#02040D] border border-[#132252] space-y-3">
              <div className="flex items-center gap-2 text-[#3888FF]">
                <Sparkles size={20} />
                <span className="font-extrabold text-xs uppercase tracking-widest">Electric Special</span>
              </div>
              <h3 className="text-xl font-black text-white font-['Syne',sans-serif]">
                Special Animated Nitro Bowling Experience
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Participants will also get to experience a special Animated Nitro Bowling experience, adding an exciting, high-energy neon twist to the bowling alley.
              </p>
            </div>

            {/* Special Bawal Challenges & Live Music & Free Mocktail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-[#060B22] border border-[#132252] space-y-2">
                <Music size={20} className="text-[#3888FF]" />
                <h4 className="font-bold text-white text-base font-['Syne',sans-serif]">Live Music & Acoustic Sets</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Artists, guitarists and singers performing live throughout the event to create a proper social and entertainment atmosphere.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#060B22] border border-[#132252] space-y-2">
                <Wine size={20} className="text-[#60A5FA]" />
                <h4 className="font-bold text-white text-base font-['Syne',sans-serif]">1 Free Crafted Mocktail</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Every registered attendee receives 1 complimentary crafted mocktail included directly with their pass.
                </p>
              </div>
            </div>

            {/* Who Should Join */}
            <div className="space-y-3">
              <h3 className="text-xl font-black text-white font-['Syne',sans-serif]">
                Who Should Join
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {event.whoShouldJoin}
              </p>
            </div>

            {/* What Your Pass Includes */}
            <div className="p-6 rounded-2xl bg-[#060B22] border border-[#132252] space-y-4">
              <h3 className="text-lg font-black text-white font-['Syne',sans-serif]">
                What Your Pass Includes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {event.whatsIncluded?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-200">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Venue & Location Map */}
            <div className="space-y-4">
              <h3 className="text-xl font-black text-white font-['Syne',sans-serif] flex items-center gap-2">
                <MapPin size={18} className="text-[#3888FF]" />
                <span>Venue & Location</span>
              </h3>
              <div className="p-4 rounded-2xl bg-[#060B22] border border-[#132252] space-y-3">
                <div>
                  <h4 className="font-bold text-white text-sm">{event.venue}</h4>
                  <p className="text-xs text-gray-400">{event.address}</p>
                </div>
                {/* Embed Map iframe */}
                <div className="w-full h-64 rounded-xl overflow-hidden bg-gray-900 border border-[#132252]">
                  <iframe
                    title="Venue Location Map"
                    src={event.mapEmbedUrl || "https://maps.google.com/maps?q=Pacific+Mall+Tagore+Garden+Delhi&t=&z=13&ie=UTF8&iwloc=&output=embed"}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>

            {/* FAQs Accordion */}
            {event.faqs && event.faqs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-black text-white font-['Syne',sans-serif] flex items-center gap-2">
                  <HelpCircle size={18} className="text-[#3888FF]" />
                  <span>Frequently Asked Questions</span>
                </h3>
                <div className="space-y-2">
                  {event.faqs.map((faq, idx) => (
                    <div
                      key={faq.id || idx}
                      className="rounded-xl bg-[#060B22] border border-[#132252] overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full p-4 text-left flex items-center justify-between text-sm font-bold text-white hover:text-[#3888FF] transition-colors"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          size={16}
                          className={`text-gray-400 transition-transform ${openFaq === idx ? 'rotate-180 text-[#3888FF]' : ''}`}
                        />
                      </button>
                      {openFaq === idx && (
                        <div className="px-4 pb-4 text-xs text-gray-300 leading-relaxed border-t border-[#132252] pt-3">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Sticky Booking Box */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              
              <div className="p-6 rounded-3xl bg-[#060B22] border border-[#132252] shadow-2xl shadow-black/60 space-y-6">
                
                {/* Header / Pricing */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Current Entry Pass
                  </span>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold text-white font-['Syne',sans-serif]">
                        ₹{activePrice}
                      </span>
                      <span className="text-xs text-gray-400">/ attendee</span>
                    </div>

                    {isEarlyBirdActive ? (
                      <span className="px-2.5 py-1 rounded-full bg-[#0038FF]/20 text-[#60A5FA] text-[10px] font-black uppercase tracking-wider border border-[#0038FF]/40 animate-pulse">
                        Early Bird ₹100 Off
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/40">
                        Regular Pass
                      </span>
                    )}
                  </div>
                </div>

                {/* Spot progress meter */}
                <div className="space-y-2 pt-2 border-t border-[#132252]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium">Spots Claimed</span>
                    <span className="font-bold text-[#60A5FA] font-mono">
                      {event.registeredCount} / {event.totalCapacity}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0B1538] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0038FF] to-[#3888FF] rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (event.registeredCount / event.totalCapacity) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {isSoldOut ? 'Event is completely sold out!' : `Only ${event.remainingSpots} spots remaining. Registration closes at 100.`}
                  </p>
                </div>

                {/* What happens to pricing */}
                <div className="p-3.5 rounded-xl bg-[#02040D] border border-[#132252] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Early Bird Pass:</span>
                    <span className="font-bold text-white">₹500 (20 passes total)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Regular Pass:</span>
                    <span className="font-bold text-white">₹600 (After Early Bird)</span>
                  </div>
                </div>

                {/* Register CTA Button */}
                <button
                  onClick={() => navigate(`/register/${event.slug}`)}
                  disabled={isSoldOut}
                  className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider uppercase shadow-xl transition-all flex items-center justify-center gap-2 ${
                    isSoldOut
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-[#0038FF] hover:bg-[#002DD6] text-white shadow-[#0038FF]/30 hover:-translate-y-0.5'
                  }`}
                >
                  {isSoldOut ? 'SOLD OUT' : 'REGISTER NOW'}
                  {!isSoldOut && <ArrowRight size={16} />}
                </button>

                {/* Share Link */}
                <button
                  onClick={handleShare}
                  className="w-full py-2.5 rounded-xl bg-[#0B1538] hover:bg-[#132252] text-gray-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Share2 size={13} />
                  {copied ? 'Link Copied to Clipboard!' : 'Share with Friends'}
                </button>
              </div>

              {/* Need help box */}
              <div className="p-4 rounded-2xl bg-[#060B22] border border-[#132252] text-xs text-gray-400 space-y-1">
                <p className="font-bold text-white">Questions about booking?</p>
                <p>DM us on Instagram <a href="https://instagram.com/bawal.social" target="_blank" rel="noreferrer" className="text-[#3888FF] font-bold">@bawal.social</a> or email tickets@bawal.social</p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Sticky Mobile Booking Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#02040D]/95 backdrop-blur-xl border-t border-[#132252] p-3 sm:p-4 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="shrink-0">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-white font-['Syne',sans-serif]">
                ₹{activePrice}
              </span>
              <span className="text-[10px] text-gray-400">/ pass</span>
            </div>
            <span className="text-[10px] font-bold text-[#60A5FA] font-mono block">
              {isSoldOut ? 'Sold Out' : `${event.remainingSpots} spots remaining`}
            </span>
          </div>

          <button
            onClick={() => navigate(`/register/${event.slug}`)}
            disabled={isSoldOut}
            className={`flex-1 min-h-[46px] py-3 px-4 rounded-xl font-extrabold text-xs tracking-wider uppercase shadow-xl transition-all flex items-center justify-center gap-1.5 ${
              isSoldOut
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-[#0038FF] hover:bg-[#002DD6] text-white shadow-[#0038FF]/30'
            }`}
          >
            {isSoldOut ? 'SOLD OUT' : 'REGISTER NOW'}
            {!isSoldOut && <ArrowRight size={14} />}
          </button>
        </div>
      </div>

    </div>
  );
};
