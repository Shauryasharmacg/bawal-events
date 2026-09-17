import React, { useEffect, useState } from 'react';
import { EventItem } from '../types/index.js';
import { fetchApi } from '../lib/api.js';
import { EventCard } from '../components/EventCard.js';
import { BawalLogo } from '../components/BawalLogo.js';
import {
  Sparkles,
  Users,
  Trophy,
  Music,
  Flame,
  ArrowRight,
  Instagram,
  Compass,
  CheckCircle,
  Zap,
} from 'lucide-react';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const evData = await fetchApi<{ events: EventItem[] }>('/api/events');
        setEvents(evData.events || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20 overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden pt-8 sm:pt-12">
        {/* Background Visual Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://cdn.district.in/assets/events/publisher/event_gallery/01KTKV2BHFYR016Z0YQM5A6RF0.jpg"
            alt="BAWAL Social Bowling"
            className="w-full h-full object-cover opacity-25 scale-105 filter brightness-90 contrast-125"
          />
          {/* Radial & Angular Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#02040D]/80 via-[#02040D]/90 to-[#02040D]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,56,255,0.18)_0%,transparent_70%)]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8">
          
          {/* Official Brand Crest */}
          <div className="flex justify-center -mb-2">
            <BawalLogo variant="full" size="sm" className="w-44 xs:w-56 h-28 xs:h-36 max-w-full hover:scale-105 transition-transform duration-300" />
          </div>

          {/* Tag badge */}
          <div className="inline-flex max-w-full items-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-1.5 rounded-full bg-[#060B22]/90 border border-[#132252] text-gray-300 text-[11px] xs:text-xs font-semibold backdrop-blur-md shadow-xl">
            <span className="w-2 h-2 rounded-full bg-[#0038FF] animate-ping shrink-0" />
            <span className="text-[#3888FF] font-bold shrink-0">BAWAL #001</span>
            <span className="text-gray-500 shrink-0">•</span>
            <span className="truncate">The Bowling Social passes now live</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl xs:text-4xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight font-['Syne',sans-serif] uppercase leading-[1.05] sm:leading-[0.95]">
              Weekends <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3888FF] via-[#60A5FA] to-[#0038FF]">
                Hit Different.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-lg text-gray-300 font-normal leading-relaxed px-2">
              Bawal is a social club built for people who want to do more than just hang out. Come for the experience. Stay for the community.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4 max-w-md sm:max-w-none mx-auto w-full">
            <button
              onClick={() => navigate('/experiences/bawal-001-the-bowling-social')}
              className="w-full sm:w-auto min-h-[48px] px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-[#0038FF] hover:bg-[#002DD6] text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-2xl shadow-[#0038FF]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
            >
              <Zap size={16} />
              Register Now (Early Bird ₹599)
            </button>
            <button
              onClick={() => navigate('/experiences')}
              className="w-full sm:w-auto min-h-[48px] px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-[#060B22] hover:bg-[#0E1B4D] text-white border border-[#132252] font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2"
            >
              <Compass size={16} />
              Explore Experiences
            </button>
          </div>

          {/* Social Proof Bar */}
          <div className="pt-6 sm:pt-10 flex flex-col xs:flex-row flex-wrap items-center justify-center gap-3 xs:gap-6 sm:gap-12 text-gray-400 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle size={15} className="text-[#3888FF] shrink-0" />
              <span className="text-gray-200 font-medium">100 Max Spot Capacity</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={15} className="text-[#3888FF] shrink-0" />
              <span className="text-gray-200 font-medium">1 Free Mocktail Included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={15} className="text-[#3888FF] shrink-0" />
              <span className="text-gray-200 font-medium">Nitro Bowling Championship</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. UPCOMING EXPERIENCES */}
      <section id="experiences" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#0E1B4D] pb-6">
          <div className="space-y-2">
            <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
              Live On Schedule
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Syne',sans-serif]">
              Upcoming Experiences
            </h2>
          </div>
          <button
            onClick={() => navigate('/experiences')}
            className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            View all experiences <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-[#121218] animate-pulse border border-[#20202A]" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#121218] border border-[#20202A] text-gray-400">
            No active experiences scheduled right now. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <EventCard key={event.id} event={event} navigate={navigate} />
            ))}
          </div>
        )}
      </section>

      {/* 3. WHAT IS BAWAL? */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#060B22] to-[#02040D] border border-[#132252] p-5 sm:p-8 md:p-14 overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="relative z-10 lg:col-span-8 space-y-4 sm:space-y-6">
              <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
                About Us
              </span>
              <h2 className="text-2xl xs:text-3xl sm:text-5xl font-black text-white font-['Syne',sans-serif] tracking-tight leading-snug">
                What is Bawal?
              </h2>
              <div className="space-y-3 text-gray-300 text-xs sm:text-base leading-relaxed">
                <p>
                  Bawal is a social club built for people who want to do more than just hang out.
                </p>
                <p>
                  We bring people together through experiences, games, challenges, and events designed to turn strangers into a crew and ordinary days into stories worth telling.
                </p>
                <p>
                  From competitive socials to unexpected experiences, every Bawal event has its own energy, its own people, and its own kind of Bawal.
                </p>
                <p className="text-white font-semibold text-sm sm:text-lg pt-1">
                  Come for the experience. Stay for the community.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 pt-4 sm:pt-6">
                <div className="p-3 sm:p-4 rounded-xl bg-[#0B1538] border border-[#1E3A8A]">
                  <Users size={18} className="text-[#3888FF] mb-1.5 sm:mb-2" />
                  <p className="font-extrabold text-white text-xs sm:text-sm">Real People</p>
                  <p className="text-[10px] sm:text-[11px] text-gray-400">Strangers into a crew</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-[#0B1538] border border-[#1E3A8A]">
                  <Trophy size={18} className="text-[#60A5FA] mb-1.5 sm:mb-2" />
                  <p className="font-extrabold text-white text-xs sm:text-sm">Challenges</p>
                  <p className="text-[10px] sm:text-[11px] text-gray-400">Competitive socials</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-[#0B1538] border border-[#1E3A8A]">
                  <Music size={18} className="text-[#3888FF] mb-1.5 sm:mb-2" />
                  <p className="font-extrabold text-white text-xs sm:text-sm">Live Music</p>
                  <p className="text-[10px] sm:text-[11px] text-gray-400">High-energy vibes</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-[#0B1538] border border-[#1E3A8A]">
                  <Flame size={18} className="text-[#60A5FA] mb-1.5 sm:mb-2" />
                  <p className="font-extrabold text-white text-xs sm:text-sm">Unmatched Energy</p>
                  <p className="text-[10px] sm:text-[11px] text-gray-400">Stories worth telling</p>
                </div>
              </div>
            </div>

            {/* Official BAWAL Logo Emblem Showcase */}
            <div className="lg:col-span-4 flex justify-center items-center pt-2 lg:pt-0">
              <div className="p-4 sm:p-6 rounded-2xl bg-black/60 border border-[#1E3A8A] shadow-2xl backdrop-blur-sm max-w-full">
                <BawalLogo variant="full" size="md" className="w-52 xs:w-64 h-36 xs:h-44 max-w-full hover:scale-105 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHY BAWAL? */}
      <section id="why" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
            Why Bawal?
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Syne',sans-serif]">
            Because the usual plans get boring.
          </h2>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            Bawal is about breaking the routine and doing something different. We create experiences where you can meet new people, compete, play, laugh, and actually be part of the moment.
          </p>
          <p className="text-[#60A5FA] font-medium text-xs sm:text-sm">
            No awkward introductions. No boring schedules. Just good people, unexpected experiences, and a little bit of Bawal.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Break The Routine',
              desc: 'Usual weekend plans get monotonous. We craft fresh social settings designed to do something genuinely different.',
              icon: Sparkles,
            },
            {
              title: 'Zero Awkwardness',
              desc: 'No forced networking or boring icebreakers. Activities and team play make meeting new people natural and fun.',
              icon: Users,
            },
            {
              title: 'Compete, Play & Win',
              desc: 'Exciting team challenges, games, and genuine competitions where everyone stays engaged and part of the moment.',
              icon: Trophy,
            },
            {
              title: 'Good People, Pure Vibes',
              desc: 'A curated crew of attendees who bring authentic energy, laughter, and high spirits to every gathering.',
              icon: Flame,
            },
            {
              title: 'Unexpected Experiences',
              desc: 'From nitro glow bowling to live music sets, every single event carries its own unique flair and twist.',
              icon: Compass,
            },
            {
              title: 'Community First',
              desc: 'Come for an exciting weekend activity, stay for the friendships and exclusive access to upcoming social drops.',
              icon: CheckCircle,
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="p-7 rounded-2xl bg-[#060B22] border border-[#132252] hover:border-[#0038FF]/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#0B1538] text-[#3888FF] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Icon size={22} />
                </div>
                <h3 className="font-extrabold text-xl text-white font-['Syne',sans-serif] mb-2">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. PREVIOUS EXPERIENCES & GALLERY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#0E1B4D] pb-6">
          <div className="space-y-2">
            <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
              Vibe Check
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Syne',sans-serif]">
              Social Archive & Energy
            </h2>
          </div>
          <p className="text-xs text-gray-400 max-w-sm">
            Snapshots from our energetic community sessions, bowling showdowns, and live musical evenings.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
              title: 'Acoustic Singalongs',
              tag: 'Live Sets',
            },
            {
              img: 'https://cdn.district.in/assets/events/publisher/event_gallery/01KTKV2BHFYR016Z0YQM5A6RF0.jpg',
              title: 'Nitro Glow Lanes',
              tag: 'Bowling Arena',
            },
            {
              img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
              title: 'Team Celebrations',
              tag: 'Championship',
            },
            {
              img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
              title: 'Solo to Squad',
              tag: 'Community',
            },
          ].map((item, i) => (
            <div key={i} className="relative rounded-2xl overflow-hidden aspect-[4/5] group bg-gray-900">
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 space-y-1">
                <span className="text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider font-mono">
                  {item.tag}
                </span>
                <h4 className="font-bold text-white text-base font-['Syne',sans-serif]">
                  {item.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. COMMUNITY & INSTAGRAM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#060B22] to-[#0B1538] border border-[#132252] p-6 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-3 max-w-lg text-center md:text-left">
            <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
              Follow The Vibe
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Syne',sans-serif]">
              Join the BAWAL Tribe on Instagram
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Catch behind-the-scenes footage, challenge winner announcements, team highlights, and flash pass drops.
            </p>
            <div className="pt-1 sm:pt-2">
              <span className="text-xl sm:text-2xl font-extrabold text-[#60A5FA] tracking-wide font-mono">
                @bawal.social
              </span>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <a
              href="https://instagram.com/bawal.social"
              target="_blank"
              rel="noreferrer"
              className="w-full md:w-auto min-h-[48px] px-8 py-4 rounded-2xl bg-[#0038FF] hover:bg-[#002DD6] text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Instagram size={18} />
              Open @bawal.social
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};