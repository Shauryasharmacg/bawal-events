import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context.js';
import { Ticket, User, Menu, X, ShieldAlert, LogOut } from 'lucide-react';
import { BawalLogo } from './BawalLogo.js';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, admin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#02040D]/95 backdrop-blur-md border-b border-[#0E1B4D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Official Brand Logo */}
          <div className="cursor-pointer shrink-0 py-1" onClick={() => handleNav('/')}>
            <BawalLogo variant="horizontal" size="md" />
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-7">
            <button
              onClick={() => handleNav('/experiences')}
              className={`text-sm font-medium transition-colors ${
                currentPath.startsWith('/experiences') ? 'text-[#3888FF] font-semibold' : 'text-[#E2E8F0] hover:text-white'
              }`}
            >
              Experiences
            </button>
            <button
              onClick={() => handleNav('/#about')}
              className="text-sm font-medium text-[#E2E8F0] hover:text-white transition-colors"
            >
              What is BAWAL?
            </button>
            <button
              onClick={() => handleNav('/#why')}
              className="text-sm font-medium text-[#E2E8F0] hover:text-white transition-colors"
            >
              Why BAWAL?
            </button>
            <button
              onClick={() => handleNav('/faq')}
              className={`text-sm font-medium transition-colors ${
                currentPath === '/faq' ? 'text-[#3888FF] font-semibold' : 'text-[#E2E8F0] hover:text-white'
              }`}
            >
              FAQ
            </button>
            <button
              onClick={() => handleNav('/contact')}
              className={`text-sm font-medium transition-colors ${
                currentPath === '/contact' ? 'text-[#3888FF] font-semibold' : 'text-[#E2E8F0] hover:text-white'
              }`}
            >
              Contact
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {/* If Admin logged in */}
            {admin && (
              <button
                onClick={() => handleNav('/admin/dashboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0038FF]/20 border border-[#0038FF]/40 text-[#60A5FA] text-xs font-semibold hover:bg-[#0038FF]/30 transition-all"
              >
                <ShieldAlert size={14} />
                Admin Panel
              </button>
            )}

            {/* My Tickets Button */}
            <button
              onClick={() => handleNav(user ? '/my-tickets' : '/login')}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-[#060B22] border border-[#132252] text-white hover:border-[#3888FF]/50 transition-all"
            >
              <Ticket size={15} className="text-[#3888FF]" />
              My Tickets
            </button>

            {/* User Profile / Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#060B22] border border-[#132252] text-sm text-white hover:border-[#1E3A8A] transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#0038FF] to-[#3888FF] text-white font-bold text-xs flex items-center justify-center">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-medium max-w-[100px] truncate">
                    {user.name || user.email?.split('@')[0] || user.mobile || 'Member'}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#060B22] border border-[#132252] shadow-2xl py-2 z-50">
                    <button
                      onClick={() => handleNav('/profile')}
                      className="w-full text-left px-4 py-2 text-xs text-gray-200 hover:bg-[#0E1A40] transition-colors"
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => handleNav('/my-tickets')}
                      className="w-full text-left px-4 py-2 text-xs text-gray-200 hover:bg-[#0E1A40] transition-colors"
                    >
                      My Tickets
                    </button>
                    <hr className="border-[#132252] my-1" />
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                        handleNav('/');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-[#0E1A40] flex items-center gap-1.5 transition-colors"
                    >
                      <LogOut size={13} />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleNav('/login')}
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-[#060B22] border border-[#132252] text-gray-300 hover:text-white hover:border-[#1E3A8A] transition-all flex items-center gap-1.5"
              >
                <User size={14} />
                OTP Login
              </button>
            )}

            {/* Primary Register CTA */}
            <button
              onClick={() => handleNav('/experiences/bawal-001-the-bowling-social')}
              className="px-5 py-2.5 rounded-xl bg-[#0038FF] hover:bg-[#002DD6] text-white font-bold text-xs tracking-wide shadow-lg shadow-[#0038FF]/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              REGISTER NOW
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => handleNav(user ? '/my-tickets' : '/login')}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#060B22] border border-[#132252] text-white active:scale-95 transition-transform"
              title="My Passes"
              aria-label="My Passes"
            >
              <Ticket size={18} className="text-[#3888FF]" />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#060B22] border border-[#132252] text-white active:scale-95 transition-transform"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#02040D]/98 backdrop-blur-xl border-b border-[#0E1B4D] px-4 pt-4 pb-8 space-y-3 max-h-[calc(100vh-4.5rem)] overflow-y-auto">
          <div className="space-y-1">
            <button
              onClick={() => handleNav('/experiences')}
              className={`w-full flex items-center justify-between py-3 px-3 rounded-xl text-sm font-semibold transition-colors ${
                currentPath.startsWith('/experiences') ? 'bg-[#0038FF]/20 text-[#60A5FA]' : 'text-white hover:bg-[#060B22]'
              }`}
            >
              <span>Upcoming Experiences</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0038FF] text-white font-mono">LIVE</span>
            </button>
            <button
              onClick={() => handleNav('/#about')}
              className="w-full text-left py-3 px-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-[#060B22] transition-colors"
            >
              What is BAWAL?
            </button>
            <button
              onClick={() => handleNav('/#why')}
              className="w-full text-left py-3 px-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-[#060B22] transition-colors"
            >
              Why BAWAL?
            </button>
            <button
              onClick={() => handleNav('/faq')}
              className={`w-full text-left py-3 px-3 rounded-xl text-sm font-medium transition-colors ${
                currentPath === '/faq' ? 'bg-[#0038FF]/20 text-[#60A5FA] font-semibold' : 'text-gray-300 hover:text-white hover:bg-[#060B22]'
              }`}
            >
              Frequently Asked Questions
            </button>
            <button
              onClick={() => handleNav('/contact')}
              className={`w-full text-left py-3 px-3 rounded-xl text-sm font-medium transition-colors ${
                currentPath === '/contact' ? 'bg-[#0038FF]/20 text-[#60A5FA] font-semibold' : 'text-gray-300 hover:text-white hover:bg-[#060B22]'
              }`}
            >
              Contact Support
            </button>
          </div>

          <div className="pt-2 border-t border-[#0E1B4D] space-y-2">
            {user ? (
              <div className="space-y-1.5">
                <button
                  onClick={() => handleNav('/my-tickets')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#060B22] border border-[#132252] text-sm text-white font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Ticket size={16} className="text-[#3888FF]" />
                    My Digital Tickets
                  </span>
                  <span className="text-xs text-[#60A5FA] font-mono font-bold">PASSES →</span>
                </button>
                <button
                  onClick={() => handleNav('/profile')}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 flex items-center justify-between"
                >
                  <span>Signed in as <strong className="text-white">{user.name || user.email || user.mobile}</strong></span>
                  <span className="text-gray-400">View Profile</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    handleNav('/');
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5"
                >
                  <LogOut size={13} />
                  Log Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav('/login')}
                className="w-full min-h-[46px] py-3 rounded-xl bg-[#060B22] border border-[#132252] text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                <User size={15} className="text-gray-400" />
                Sign In with OTP
              </button>
            )}


            <button
              onClick={() => handleNav('/experiences/bawal-001-the-bowling-social')}
              className="w-full min-h-[50px] py-3.5 rounded-2xl bg-[#0038FF] hover:bg-[#002DD6] text-white font-extrabold text-sm text-center tracking-wider uppercase shadow-xl shadow-[#0038FF]/30 flex items-center justify-center gap-2"
            >
              REGISTER FOR BAWAL #001
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
