import React from 'react';
import { Instagram, ArrowUpRight, ShieldCheck, Mail, MapPin } from 'lucide-react';
import { BawalLogo } from './BawalLogo.js';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-[#00020A] border-t border-[#0E1B4D] text-[#A0A0A8] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#0E1B4D]">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="cursor-pointer" onClick={() => navigate('/')}>
              <BawalLogo variant="horizontal" size="lg" />
            </div>
            
            <p className="text-xl font-bold text-white tracking-tight font-['Syne',sans-serif]">
              Weekends Hit Different.
            </p>

            <p className="text-sm text-gray-400 max-w-md leading-relaxed">
              BAWAL creates social entertainment experiences where people come together to play, compete, connect, and have an unforgettable time in modern Indian cities.
            </p>

            {/* Instagram CTA */}
            <div className="pt-2">
              <a
                href="https://instagram.com/bawal.social"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#060B22] border border-[#132252] text-white hover:border-[#0038FF] transition-all group"
              >
                <Instagram size={18} className="text-[#3888FF] group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold tracking-wide">@bawal.social</span>
                <ArrowUpRight size={14} className="text-gray-400 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-widest">
              Experiences
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => navigate('/experiences/bawal-001-the-bowling-social')}
                  className="hover:text-white transition-colors"
                >
                  BAWAL #001: The Bowling Social
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/experiences')} className="hover:text-white transition-colors">
                  Upcoming Socials
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/my-tickets')} className="hover:text-white transition-colors">
                  My Digital Passes
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/faq')} className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </button>
              </li>
            </ul>
          </div>

          {/* Support & Venue */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-widest">
              Connect & Support
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-xs">
                <Mail size={14} className="text-[#3888FF]" />
                <span className="text-gray-300">tickets@bawal.social</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <MapPin size={14} className="text-[#3888FF] shrink-0 mt-0.5" />
                <span className="text-gray-300">New Delhi • Bangalore • Mumbai</span>
              </div>
              <div className="flex items-center gap-2 text-xs pt-2">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className="text-gray-400">100% Verified Digital QR Tickets</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 gap-4 text-center md:text-left">
          <p>© {new Date().getFullYear()} BAWAL Experiences. All rights reserved. Designed for modern Indian weekend culture.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <button onClick={() => navigate('/contact')} className="hover:text-gray-300">Privacy Policy</button>
            <button onClick={() => navigate('/contact')} className="hover:text-gray-300">Terms of Service</button>
            <button onClick={() => navigate('/faq')} className="hover:text-gray-300">Refund Policy</button>
          </div>
        </div>
      </div>
    </footer>
  );
};