import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import LoginGate from './pages/login_gate';
import BookingGate from './pages/booking_gate';
import AdminPortal from './pages/admin_portal';
import SecurePayment from './pages/secure_payment';
import TicketHistory from './pages/ticket_history';
import { AuthState, Booking, AdminSettings } from './types';
import { DEFAULT_ADMIN_SETTINGS } from './constants';

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
      <header className="sticky top-0 z-[100] px-6 py-4 flex justify-between items-center bg-white shadow-sm no-print">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 blue-gradient rounded-xl flex items-center justify-center text-white"><i className="fas fa-water"></i></div>
          <h1 className="text-xl font-black uppercase tracking-tighter">Spray Aqua</h1>
        </Link>
        <div className="flex items-center gap-4">
          {auth.role === 'guest' && (
            <div className="flex gap-2">
               <Link to="/book" className={`px-4 py-2 font-bold text-xs uppercase ${location.pathname === '/book' ? 'text-blue-600' : 'text-gray-400'}`}>Book</Link>
               <Link to="/my-bookings" className={`px-4 py-2 font-bold text-xs uppercase ${location.pathname === '/my-bookings' ? 'text-blue-600' : 'text-gray-400'}`}>Tickets</Link>
            </div>
          )}
          {auth.role && (
            <button onClick={logout} className="text-red-500 font-black text-xs uppercase ml-2 px-4 py-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Logout</button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        <Routes>
          <Route path="/" element={auth.role === 'admin' ? <Navigate to="/admin" /> : auth.role === 'guest' ? <Navigate to="/book" /> : <LoginGate onGuestLogin={loginAsGuest} onAdminLogin={loginAsAdmin} />} />
          <Route path="/book" element={auth.role === 'guest' ? <BookingGate settings={settings} bookings={bookings} onProceed={(b: any) => b} /> : <Navigate to="/" />} />
          <Route path="/payment" element={auth.role === 'guest' ? <SecurePayment addBooking={addBooking} /> : <Navigate to="/" />} />
          <Route path="/my-bookings" element={auth.role === 'guest' ? <TicketHistory bookings={bookings} mobile={auth.user?.mobile || ''} /> : <Navigate to="/" />} />
          <Route path="/admin" element={auth.role === 'admin' ? <AdminPortal bookings={bookings} settings={settings} onUpdateSettings={updateSettings} /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => (<HashRouter><AppContent /></HashRouter>);
export default App;
