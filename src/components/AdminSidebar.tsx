import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context.js';
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  Ticket,
  QrCode,
  Award,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { BawalLogo } from './BawalLogo.js';

interface AdminSidebarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentPath, navigate }) => {
  const { admin, logoutAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Event Management', path: '/admin/events', icon: Calendar },
    { label: 'Registrations', path: '/admin/registrations', icon: Users },
    { label: 'QR Gate Check-In', path: '/admin/checkin', icon: QrCode, badge: 'Scanner' },
    { label: 'Payments & Revenue', path: '/admin/payments', icon: CreditCard },
    { label: 'Digital Tickets', path: '/admin/tickets', icon: Ticket },
    { label: 'Users & Roles', path: '/admin/users', icon: ShieldCheck },
    { label: 'Sponsors & Brands', path: '/admin/sponsors', icon: Award },
    { label: 'White-Label Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Admin Top Navigation Header */}
      <div className="md:hidden sticky top-0 z-40 bg-[#0D0D11]/95 backdrop-blur-md border-b border-[#202028] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5" onClick={() => handleNavClick('/admin/dashboard')}>
          <div className="w-8 h-8 rounded-lg bg-black border border-white/20 p-0.5 flex items-center justify-center">
            <BawalLogo variant="icon" size="sm" />
          </div>
          <div>
            <span className="font-black text-base text-white font-['Syne',sans-serif] italic tracking-wider block leading-none">
              BAWAL
            </span>
            <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
              Organizer Admin
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-xl bg-[#181822] text-white border border-[#2B2B3C]"
          aria-label="Toggle Admin Menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-between p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#202028]">
              <div className="flex items-center gap-2">
                <BawalLogo variant="icon" size="sm" />
                <span className="font-black text-white font-['Syne',sans-serif]">BAWAL Admin Menu</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl bg-[#1A1A24] text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Links */}
            <nav className="space-y-1">
              {links.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full min-h-[44px] flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#0038FF] text-white shadow-lg shadow-[#0038FF]/20'
                        : 'text-gray-300 hover:text-white hover:bg-[#16161E]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={isActive ? 'text-white' : 'text-[#3888FF]'} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        isActive ? 'bg-black/30 text-white' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer in mobile drawer */}
          <div className="pt-4 border-t border-[#202028] space-y-3">
            <button
              onClick={() => handleNavClick('/')}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3 rounded-xl bg-[#16161E] border border-[#252530] text-xs font-semibold text-gray-300"
            >
              <ExternalLink size={14} />
              View Public Site
            </button>
            <button
              onClick={() => {
                logoutAdmin();
                handleNavClick('/admin/dashboard');
              }}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3 rounded-xl bg-red-950/40 border border-red-800/40 text-xs font-bold text-red-400"
            >
              <LogOut size={14} />
              Log Out Admin
            </button>
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0D0D11] border-r border-[#202028] flex-col justify-between h-screen sticky top-0 shrink-0">
        <div className="p-5 space-y-6">
          {/* Brand header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
              <div className="w-8 h-8 rounded-lg bg-black border border-white/20 p-0.5 flex items-center justify-center">
                <BawalLogo variant="icon" size="sm" />
              </div>
              <div>
                <span className="font-black text-lg text-white font-['Syne',sans-serif] italic tracking-wider block leading-none">
                  BAWAL
                </span>
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                  Organizer Admin
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#0038FF] text-white shadow-lg shadow-[#0038FF]/20'
                      : 'text-gray-400 hover:text-white hover:bg-[#16161E]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isActive ? 'text-white' : 'text-gray-400'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      isActive ? 'bg-black/30 text-white' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin Profile & Actions */}
        <div className="p-4 border-t border-[#1C1C24] space-y-3 bg-[#0A0A0E]">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#16161E] border border-[#252530] text-xs font-semibold text-gray-300 hover:text-white transition-all"
          >
            <ExternalLink size={13} />
            View Public Site
          </button>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1F1F2C] border border-[#303040] flex items-center justify-center text-white text-xs font-bold">
                {admin?.name?.charAt(0) || 'A'}
              </div>
              <div className="max-w-[120px]">
                <p className="text-xs font-bold text-white truncate">{admin?.name || 'Administrator'}</p>
                <p className="text-[10px] text-amber-400 font-mono">{admin?.role || 'SUPER_ADMIN'}</p>
              </div>
            </div>

            <button
              onClick={() => {
                logoutAdmin();
                navigate('/admin/dashboard');
              }}
              title="Log Out Admin"
              className="p-2 rounded-lg bg-[#181822] hover:bg-red-950/40 text-gray-400 hover:text-red-400 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
