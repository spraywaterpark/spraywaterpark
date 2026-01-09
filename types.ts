export type UserRole = 'guest' | 'admin' | null;

export interface Booking {
  id: string;
  name: string;
  mobile: string;
  date: string;
  time: string;
  adults: number;
  kids: number;
  discountCode: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

/* 🔒 Blackout Structure */
export type BlackoutShift = 'Morning' | 'Evening' | 'Both';

export interface BlackoutEntry {
  date: string;
  shift: BlackoutShift;
}

export interface AdminSettings {
  morningAdultRate: number;
  eveningAdultRate: number;
  morningKidRate: number;
  eveningKidRate: number;

  earlyBirdDiscount: number;
  extraDiscountPercent: number;

  /* 🧠 Blackout system */
  blackouts?: BlackoutEntry[];
}

export interface AuthState {
  role: UserRole;
  user: {
    name?: string;
    mobile?: string;
    email?: string;
  } | null;
}
