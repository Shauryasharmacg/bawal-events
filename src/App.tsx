import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth-context.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { AdminSidebar } from './components/AdminSidebar.js';

// Public & User Pages
import { HomePage } from './pages/HomePage.js';
import { ExperiencesPage } from './pages/ExperiencesPage.js';
import { ExperienceDetailPage } from './pages/ExperienceDetailPage.js';
import { RegistrationPage } from './pages/RegistrationPage.js';
import { TicketConfirmationPage } from './pages/TicketConfirmationPage.js';
import { MyTicketsPage } from './pages/MyTicketsPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { FaqPage } from './pages/FaqPage.js';
import { ContactPage } from './pages/ContactPage.js';

// Admin Pages
import { AdminAuthGuard } from './components/AdminAuthGuard.js';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.js';
import { AdminCheckinPage } from './pages/admin/AdminCheckinPage.js';
import { AdminEventsPage } from './pages/admin/AdminEventsPage.js';
import { AdminRegistrationsPage } from './pages/admin/AdminRegistrationsPage.js';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage.js';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.js';
import { AdminSponsorsPage } from './pages/admin/AdminSponsorsPage.js';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.js';

const AppContent: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const { admin, adminToken } = useAuth();

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdminRoute = currentPath.startsWith('/admin');

  // Render Admin Layout with Guard
  if (isAdminRoute) {
    if (!admin && !adminToken) {
      return <AdminAuthGuard navigate={navigate} />;
    }

    let adminContent = <AdminDashboardPage navigate={navigate} />;
    if (currentPath === '/admin/checkin') adminContent = <AdminCheckinPage />;
    else if (currentPath === '/admin/events') adminContent = <AdminEventsPage navigate={navigate} />;
    else if (currentPath === '/admin/registrations') adminContent = <AdminRegistrationsPage navigate={navigate} />;
    else if (currentPath === '/admin/payments') adminContent = <AdminPaymentsPage />;
    else if (currentPath === '/admin/tickets') adminContent = <AdminRegistrationsPage navigate={navigate} />;
    else if (currentPath === '/admin/users') adminContent = <AdminUsersPage />;
    else if (currentPath === '/admin/sponsors') adminContent = <AdminSponsorsPage />;
    else if (currentPath === '/admin/settings') adminContent = <AdminSettingsPage />;

    return (
      <div className="min-h-screen bg-[#0A0A0C] text-[#E2E2E8] flex flex-col md:flex-row">
        <AdminSidebar currentPath={currentPath} navigate={navigate} />
        <main className="flex-1 overflow-y-auto min-h-screen bg-[#08080A]">
          {adminContent}
        </main>
      </div>
    );
  }

  // Render Public & Attendee Layout
  let pageContent = <HomePage navigate={navigate} />;

  if (currentPath === '/experiences') {
    pageContent = <ExperiencesPage navigate={navigate} />;
  } else if (currentPath.startsWith('/experiences/')) {
    const slug = currentPath.replace('/experiences/', '');
    pageContent = <ExperienceDetailPage slug={slug} navigate={navigate} />;
  } else if (currentPath.startsWith('/register/')) {
    const slug = currentPath.replace('/register/', '');
    pageContent = <RegistrationPage slug={slug} navigate={navigate} />;
  } else if (currentPath.startsWith('/tickets/')) {
    const ticketId = currentPath.replace('/tickets/', '');
    pageContent = <TicketConfirmationPage ticketId={ticketId} navigate={navigate} />;
  } else if (currentPath === '/my-tickets') {
    pageContent = <MyTicketsPage navigate={navigate} />;
  } else if (currentPath === '/login') {
    pageContent = <LoginPage navigate={navigate} />;
  } else if (currentPath === '/profile') {
    pageContent = <ProfilePage navigate={navigate} />;
  } else if (currentPath === '/faq') {
    pageContent = <FaqPage navigate={navigate} />;
  } else if (currentPath === '/contact') {
    pageContent = <ContactPage />;
  }

  return (
    <div className="min-h-screen bg-[#02040D] text-[#E2E2E8] flex flex-col justify-between selection:bg-[#0038FF] selection:text-white">
      <div>
        <Navbar currentPath={currentPath} navigate={navigate} />
        <main>{pageContent}</main>
      </div>
      <Footer navigate={navigate} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
