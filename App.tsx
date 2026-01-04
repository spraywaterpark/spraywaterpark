
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage.tsx';
import BookingPage from './pages/BookingPage.tsx';
import AdminPanel from './pages/AdminPanel.tsx';
import PaymentPage from './pages/PaymentPage.tsx';
import MyBookings from './pages/MyBookings.tsx';
import { AuthState, Booking, AdminSettings } from './types.ts';
import { DEFAULT_ADMIN_SETTINGS } from './constants.ts';

const HeaderLink = ({ to, icon, label, active }: { to: string, icon: string, label: string, active: boolean }) => (
  <Link to={to} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50/50'}`}>
    <i className={`fas ${icon}`}></i>
    <span className="hidden sm:inline">{label}</span>
  </Link>
);

const AppContent: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('swp_auth');
    return saved ? JSON.parse(saved) : { role: null, user: null };
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('swp_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AdminSettings>(() => {
    const saved = localStorage.getItem('swp_settings');
    return saved ? JSON.parse(saved) : DEFAULT_ADMIN_SETTINGS;
  });

  const location = useLocation();

  useEffect(() => { localStorage.setItem('swp_auth', JSON.stringify(auth)); }, [auth]);
  useEffect(() => { localStorage.setItem('swp_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('swp_settings', JSON.stringify(settings)); }, [settings]);

  const loginAsGuest = (name: string, mobile: string) => setAuth({ role: 'guest', user: { name, mobile } });
  const loginAsAdmin = (email: string) => setAuth({ role: 'admin', user: { email } });
  const logout = () => { setAuth({ role: null, user: null }); sessionStorage.clear(); };
  const addBooking = (booking: Booking) => setBookings(prev => [booking, ...prev]);
  const updateSettings = (newSettings: AdminSettings) => setSettings(newSettings);

  return (
    <div className="min-h-screen bg-[#f8fbff] flex flex-col text-[#334155]">
      <header className="sticky top-0 z-[100] px-4 md:px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm no-print">
        <div className="flex items-center gap-4 md:gap-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 blue-gradient rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
              <i className="fas fa-water text-lg"></i>
            </div>
            <h1 className="text-sm md:text-xl font-black text-[#1B2559] uppercase tracking-tighter">Spray Aqua Resort</h1>
          </Link>
          {auth.role === 'guest' && (
            <nav className="flex items-center gap-1">
              <HeaderLink to="/book" icon="fa-ticket-alt" label="Book" active={location.pathname === '/book'} />
              <HeaderLink to="/my-bookings" icon="fa-history" label="History" active={location.pathname === '/my-bookings'} />
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4">
          {auth.role && (
            <button onClick={logout} title="Logout" className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
              <i className="fas fa-sign-out-alt text-sm"></i>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        <Routes>
          <Route path="/" element={auth.role === 'admin' ? <Navigate to="/admin" /> : auth.role === 'guest' ? <Navigate to="/book" /> : <LoginPage onGuestLogin={loginAsGuest} onAdminLogin={loginAsAdmin} />} />
          <Route path="/book" element={auth.role === 'guest' ? <BookingPage settings={settings} bookings={bookings} onProceed={(b) => b} /> : <Navigate to="/" />} />
          <Route path="/payment" element={auth.role === 'guest' ? <PaymentPage addBooking={addBooking} /> : <Navigate to="/" />} />
          <Route path="/my-bookings" element={auth.role === 'guest' ? <MyBookings bookings={bookings} mobile={auth.user?.mobile || ''} /> : <Navigate to="/" />} />
          <Route path="/admin" element={auth.role === 'admin' ? <AdminPanel bookings={bookings} settings={settings} onUpdateSettings={updateSettings} /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      
      <footer className="py-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest no-print">
        &copy; {new Date().getFullYear()} Spray Aqua Resort. All Splash Reserved.
      </footer>
    </div>
  );
};

const App: React.FC = () => (<HashRouter><AppContent /></HashRouter>);
export default App;
