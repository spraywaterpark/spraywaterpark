
import React, { useState } from 'react';
import { Booking, AdminSettings } from '../types';
import { notificationService } from '../services/notification_service';

const TicketHistory: React.FC<{ 
  bookings: Booking[], 
  user: { name?: string; mobile?: string } | null, 
  settings: AdminSettings, 
  onUpdateBooking: (b: Booking) => Promise<void> 
}> = ({ bookings, user, settings, onUpdateBooking }) => {
  const name = user?.name || '';
  const mobile = user?.mobile || '';

  const userList = bookings.filter(b => 
    b.mobile === mobile && b.name.toLowerCase().trim() === name.toLowerCase().trim()
  );
  const [resending, setResending] = useState<string | null>(null);
  const [sentStatus, setSentStatus] = useState<string | null>(null);

  // Upgrade State
  const [upgradingBooking, setUpgradingBooking] = useState<Booking | null>(null);
  const [upgradeCount, setUpgradeCount] = useState(1);
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);

  const handleResend = async (booking: Booking) => {
    setResending(booking.id);
    setSentStatus(null);
    try {
      const res = await notificationService.sendWhatsAppTicket(booking);
      if (res.success) {
        setSentStatus(booking.id);
        // Reset status after 3 seconds
        setTimeout(() => setSentStatus(null), 3000);
      } else {
        alert(`Failed: ${res.details || "Please check Admin Settings."}`);
      }
    } catch (e) {
      alert("Error occurred while connecting to server.");
    } finally {
      setResending(null);
    }
  };

  const getUpgradeRates = (booking: Booking) => {
    const isMorning = booking.time.toLowerCase().includes('morning');
    const adultRate = isMorning ? settings.morningAdultRate : settings.eveningAdultRate;
    const kidRate = isMorning ? settings.morningKidRate : settings.eveningKidRate;
    return { adultRate, kidRate, diff: adultRate - kidRate };
  };

  const handleConfirmUpgrade = async () => {
    if (!upgradingBooking || isProcessingUpgrade) return;
    setIsProcessingUpgrade(true);
    
    const { diff } = getUpgradeRates(upgradingBooking);
    const additionalAmount = Number(upgradeCount) * Number(diff);

    try {
      // 1. Create Razorpay Order for the difference
      const orderRes = await fetch('/api/booking?type=create_razorpay_order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: additionalAmount,
          receipt: `UPG-${upgradingBooking.id}-${Date.now()}`
        })
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error("Failed to create upgrade payment");

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Spray Aqua Resort",
        description: `Upgrade for ${upgradingBooking.id}`,
        order_id: orderData.order.id,
        handler: async (response: any) => {
          // 3. Verify Payment
          const verifyRes = await fetch('/api/booking?type=verify_razorpay_payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            // 4. Update Booking on Success
            const updatedBooking: Booking = {
              ...upgradingBooking,
              adults: Number(upgradingBooking.adults) + Number(upgradeCount),
              kids: Number(upgradingBooking.kids) - Number(upgradeCount),
              totalAmount: Number(upgradingBooking.totalAmount) + Number(additionalAmount)
            };

            await onUpdateBooking(updatedBooking);
            notificationService.sendWhatsAppTicket(updatedBooking).catch(e => console.warn("WA Update fail:", e));
            setUpgradingBooking(null);
            alert("Ticket upgraded successfully!");
          } else {
            alert("Payment verification failed.");
            setIsProcessingUpgrade(false);
          }
        },
        prefill: {
          name: upgradingBooking.name,
          contact: upgradingBooking.mobile
        },
        theme: { color: "#0284c7" },
        modal: {
          ondismiss: () => setIsProcessingUpgrade(false)
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (e: any) {
      console.error("Upgrade Error:", e);
      alert(e.message || "Failed to upgrade ticket. Please try again.");
      setIsProcessingUpgrade(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 animate-fade space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 no-print">
        <div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#1B2559] uppercase tracking-tight">
            My Tickets
          </h2>
          <p className="text-slate-600 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">
            Spray Aqua Resort Digital Wallet
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-700 shadow border border-slate-200 hover:bg-slate-50 transition"
        >
          <i className="fas fa-print mr-2"></i> Print Copy
        </button>
      </div>

      {userList.length === 0 ? (
        <div className="bg-white p-16 sm:p-24 rounded-[3rem] text-center border-4 border-dashed border-slate-200 shadow-inner">
          <i className="fas fa-ticket-alt text-6xl sm:text-8xl text-slate-100 mb-6"></i>
          <p className="text-slate-500 font-black uppercase text-xs tracking-[0.3em]">
            No Active Reservations
          </p>
          <button
            onClick={() => window.location.hash = '#/book'}
            className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow hover:scale-105 transition"
          >
            Book Your First Splash <i className="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {userList.map((b, idx) => (
            <div key={b.id} className="relative">
              {idx === 0 && (
                <div className="bg-emerald-50 p-8 sm:p-12 rounded-[2.5rem] border border-emerald-200 mb-10 shadow-lg relative overflow-hidden no-print">
                  <i className="fab fa-whatsapp absolute -right-4 -bottom-4 text-8xl text-emerald-100/50 -rotate-12"></i>
                  <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center text-3xl shadow-lg shadow-emerald-200">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="max-w-xl space-y-3">
                      <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tight">TICKET CONFIRMED!</h3>
                      <p className="text-emerald-700 font-semibold text-base leading-relaxed px-4">
                        Thank you for booking with us, your confirmed ticket has been sent to your mobile. To resend the ticket on your phone, click the button below.
                      </p>
                    </div>
                    <div className="pt-4 w-full max-w-xs">
                      <button
                        onClick={() => handleResend(b)}
                        disabled={resending === b.id}
                        className={`w-full px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 ${
                          sentStatus === b.id 
                            ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200'
                        }`}
                      >
                        {resending === b.id ? (
                          <><i className="fas fa-circle-notch fa-spin"></i> Sending...</>
                        ) : sentStatus === b.id ? (
                          <><i className="fas fa-check-double"></i> Ticket Sent! ✅</>
                        ) : (
                          <><i className="fab fa-whatsapp text-lg"></i> Resend Ticket on WhatsApp</>
                        )}
                      </button>
                      {sentStatus === b.id && (
                        <p className="mt-3 text-[9px] font-black text-emerald-600 uppercase animate-pulse">Check your WhatsApp app now!</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row border border-slate-200">
                <div className="bg-[#1B2559] lg:w-64 p-10 flex flex-col justify-center items-center text-white text-center">
                  <p className="text-[10px] font-black uppercase opacity-70 mb-2 tracking-[0.3em]">
                    Entrance Pass
                  </p>
                  <p className="text-2xl font-black mb-6 bg-white/10 px-4 py-1 rounded border border-white/20">
                    {b.id}
                  </p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${b.id}`}
                    alt="Booking QR Code"
                    className="w-28 h-28 bg-white p-2 rounded-xl"
                  />
                </div>
                <div className="flex-1 p-8 sm:p-12 flex flex-col sm:flex-row justify-between items-center gap-10">
                  <div className="text-center sm:text-left space-y-4">
                    <h4 className="text-3xl font-black text-[#1B2559] uppercase">
                      {b.date}
                    </h4>
                    <p className="text-blue-700 font-black text-xs uppercase tracking-[0.3em]">
                      {b.time}
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                      <span className="bg-slate-100 px-4 py-2 rounded-lg text-xs font-black uppercase">
                        {b.adults} Adults
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 px-4 py-2 rounded-lg text-xs font-black uppercase">
                          {b.kids} Kids
                        </span>
                        {b.kids > 0 && (
                          <button 
                            onClick={() => {
                              setUpgradingBooking(b);
                              setUpgradeCount(1);
                            }}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-md no-print"
                          >
                            <i className="fas fa-arrow-up mr-1"></i> Upgrade to Adult
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">
                      Fully Paid
                    </p>
                    <h3 className="text-4xl sm:text-5xl font-black text-[#1B2559]">
                      ₹{b.totalAmount}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upgrade Modal */}
      {upgradingBooking && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade no-print">
          <div className="bg-white rounded-[3rem] max-w-lg w-full p-10 space-y-8 shadow-2xl relative overflow-hidden border border-slate-200">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
            
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Upgrade Ticket</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Convert Child Pass to Adult Pass</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Available Kids</span>
                <span className="text-lg font-black text-slate-900">{upgradingBooking.kids}</span>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest block text-center">Number of kids to upgrade</label>
                <div className="flex items-center justify-center gap-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                  <button 
                    onClick={() => setUpgradeCount(Math.max(1, upgradeCount - 1))}
                    className="w-12 h-12 rounded-xl bg-slate-100 font-black text-xl hover:bg-slate-200 transition active:scale-90"
                  >
                    -
                  </button>
                  <span className="text-2xl font-black min-w-[2rem] text-center">{upgradeCount}</span>
                  <button 
                    onClick={() => setUpgradeCount(Math.min(upgradingBooking.kids, upgradeCount + 1))}
                    className="w-12 h-12 rounded-xl bg-slate-100 font-black text-xl hover:bg-slate-200 transition active:scale-90"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                  <span>Upgrade Fee (Per Person)</span>
                  <span>₹{getUpgradeRates(upgradingBooking).diff}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black uppercase text-slate-900">Total Payable</span>
                  <span className="text-3xl font-black text-blue-600 tracking-tighter">₹{upgradeCount * getUpgradeRates(upgradingBooking).diff}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleConfirmUpgrade}
                disabled={isProcessingUpgrade}
                className="w-full bg-slate-900 text-white h-20 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-slate-800 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isProcessingUpgrade ? (
                  <><i className="fas fa-circle-notch fa-spin"></i> Processing...</>
                ) : (
                  <><i className="fas fa-shield-alt"></i> Pay & Upgrade Now</>
                )}
              </button>
              <button 
                onClick={() => setUpgradingBooking(null)}
                disabled={isProcessingUpgrade}
                className="w-full py-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <i className="fas fa-lock text-blue-400"></i> Secure Payment Gateway
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketHistory;
