import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api.js';
import { ChevronDown, HelpCircle, Mail, Instagram } from 'lucide-react';

interface FaqPageProps {
  navigate: (path: string) => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({ navigate }) => {
  const [faqs, setFaqs] = useState<{ id: string; question: string; answer: string }[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<{ faqs: any[] }>('/api/public/faqs');
        setFaqs(data.faqs || []);
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      
      <div className="text-center space-y-3">
        <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
          Got Questions?
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white font-['Syne',sans-serif]">
          Frequently Asked Questions
        </h1>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          Everything you need to know about BAWAL experiences, entry passes, tournament rules, and mocktail inclusions.
        </p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-[#060B22] border border-[#132252] animate-pulse" />
            ))}
          </div>
        ) : (
          faqs.map((faq, idx) => (
            <div
              key={faq.id || idx}
              className="rounded-2xl bg-[#060B22] border border-[#132252] overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-white hover:text-[#3888FF] transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 shrink-0 ml-4 transition-transform duration-300 ${
                    openIdx === idx ? 'rotate-180 text-[#3888FF]' : ''
                  }`}
                />
              </button>
              {openIdx === idx && (
                <div className="px-5 pb-5 pt-1 text-xs text-gray-300 leading-relaxed border-t border-[#132252]">
                  {faq.answer}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Still need help */}
      <div className="p-8 rounded-3xl bg-[#060B22] border border-[#132252] text-center space-y-4">
        <h3 className="text-lg font-black text-white font-['Syne',sans-serif]">
          Still have a question?
        </h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          Our team is available round-the-clock on Instagram DM or email to help you with booking or squad queries.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <a
            href="https://instagram.com/bawal.social"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl bg-[#0B1538] text-white border border-[#1E3A8A] text-xs font-bold hover:border-[#3888FF] transition-all flex items-center gap-2"
          >
            <Instagram size={14} className="text-[#3888FF]" />
            DM on Instagram @bawal.social
          </a>
          <button
            onClick={() => navigate('/contact')}
            className="px-5 py-2.5 rounded-xl bg-[#0038FF] text-white text-xs font-bold hover:bg-[#002DD6] transition-all flex items-center gap-2 shadow-lg shadow-[#0038FF]/20"
          >
            <Mail size={14} />
            Contact Support
          </button>
        </div>
      </div>

    </div>
  );
};
