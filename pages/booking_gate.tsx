// ... imports remain same

const BookingGate: React.FC<{ settings: AdminSettings, bookings: Booking[], onProceed: any }> = ({ settings, bookings }) => {
  const navigate = useNavigate();

  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(TIME_SLOTS[0]);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const isMorning = slot.toLowerCase().includes('morning');

  const adultRate = isMorning ? settings.morningAdultRate : settings.eveningAdultRate;
  const kidRate = isMorning ? settings.morningKidRate : settings.eveningKidRate;

  // Count bookings for same date & shift
  const alreadyBooked = bookings.filter(b => b.date === date && b.time === slot && b.status === 'confirmed')
    .reduce((sum, b) => sum + b.adults + b.kids, 0);

  let discountPercent = 0;
  if (alreadyBooked < 100) discountPercent = 20;
  else if (alreadyBooked < 200) discountPercent = 10;

  const subtotal = adults * adultRate + kids * kidRate;
  const discount = Math.round(subtotal * discountPercent / 100);
  const total = subtotal - discount;

  const offerText = isMorning
    ? "🎁 FREE: One Plate Chole Bhature with every ticket"
    : "🎁 FREE: Buffet Dinner with every ticket";

  const handleCheckout = () => {
    if (!date) return alert("Please select your visit date first.");
    setShowTerms(true);
  };

  const finalProceed = () => {
    if (!acceptedTerms) return;

    const draft = { date, time: slot, adults, kids, totalAmount: total, status: 'pending' };
    sessionStorage.setItem('swp_draft_booking', JSON.stringify(draft));
    navigate('/payment');
  };

  return (
    <div className="w-full flex flex-col items-center pb-12">

      <div className="w-full max-w-4xl text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white uppercase">Reservation</h2>
        <p className="text-white/70 text-xs mt-2">Spray Aqua Resort Booking Counter</p>
      </div>

      {/* OFFER BOX */}
      <div className="w-full max-w-4xl mb-6 bg-amber-100 text-amber-900 p-5 rounded-xl text-center font-bold shadow-lg">
        {offerText}
      </div>

      {/* EARLY BIRD DISCOUNT */}
      {date && discountPercent > 0 && (
        <div className="w-full max-w-4xl mb-6 bg-emerald-100 text-emerald-800 p-4 rounded-lg text-center font-bold">
          🎉 Early Bird Discount Applied: {discountPercent}% OFF
        </div>
      )}

      {/* ===== Existing UI continues (keep rest of your design) ===== */}
