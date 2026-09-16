import React, { useState } from 'react';
import { Mail, Instagram, MapPin, Send, CheckCircle2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
          Connect With Us
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white font-['Syne',sans-serif]">
          Get in Touch
        </h1>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          Need partner sponsorships, bulk passes for your friend group, or venue collaborations? Reach out below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Contact Info */}
        <div className="space-y-6 bg-[#060B22] p-8 rounded-3xl border border-[#132252]">
          <h3 className="text-xl font-bold text-white font-['Syne',sans-serif]">
            Direct Channels
          </h3>

          <div className="space-y-4 text-xs text-gray-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0B1538] text-[#3888FF] flex items-center justify-center shrink-0 border border-[#1E3A8A]">
                <Instagram size={18} />
              </div>
              <div>
                <span className="text-gray-500 uppercase text-[10px] block">Instagram</span>
                <a
                  href="https://instagram.com/bawal.social"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-white hover:text-[#3888FF] transition-colors"
                >
                  @bawal.social
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0B1538] text-[#3888FF] flex items-center justify-center shrink-0 border border-[#1E3A8A]">
                <Mail size={18} />
              </div>
              <div>
                <span className="text-gray-500 uppercase text-[10px] block">Email Support</span>
                <span className="font-bold text-white">tickets@bawal.social</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0B1538] text-[#3888FF] flex items-center justify-center shrink-0 border border-[#1E3A8A]">
                <MapPin size={18} />
              </div>
              <div>
                <span className="text-gray-500 uppercase text-[10px] block">Flagship City Hub</span>
                <span className="font-bold text-white">New Delhi, India</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#132252]">
            <p className="text-[11px] text-gray-400">
              Operating Hours: Wednesday to Sunday, 10:00 AM – 9:00 PM IST
            </p>
          </div>
        </div>

        {/* Right: Message Form */}
        <div className="bg-[#060B22] p-8 rounded-3xl border border-[#132252]">
          {sent ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-lg font-bold text-white font-['Syne',sans-serif]">
                Message Dispatched!
              </h4>
              <p className="text-xs text-gray-400">
                Thanks for writing to BAWAL! Our community host will reply to your email within 4 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#02040D] border border-[#132252] text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#0038FF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#02040D] border border-[#132252] text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#0038FF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Message / Inquiry</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ask about events, bulk group passes, or partner opportunities..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#02040D] border border-[#132252] text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#0038FF]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0038FF] hover:bg-[#002DD6] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#0038FF]/20 transition-all flex items-center justify-center gap-2"
              >
                <Send size={14} />
                Send Inquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
