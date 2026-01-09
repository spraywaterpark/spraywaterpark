
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

export interface BlockedSlot {
  date: string;
  slot: string; // Specific slot name or "Full Day"
}

export interface AdminSettings {
  morningAdultRate: number;
  eveningAdultRate: number;
  morningKidRate: number;
  eveningKidRate: number;
  earlyBirdDiscount: number;
  extraDiscountPercent: number;
  blockedSlots: BlockedSlot[];
}

export interface AuthState {
  role: UserRole;
  user: {
    name?: string;
    mobile?: string;
    email?: string;
  } | null;
}
