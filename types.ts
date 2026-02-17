

export type UserRole = 'guest' | 'admin' | 'staff' | null;

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
  // Fix: Added 'checked-in' to the status union to reflect actual data states from the API and allow valid status comparisons
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked-in';
  paymentMode: 'online' | 'cash';
  createdAt: string;
}

export type ShiftType = 'morning' | 'evening' | 'all';

export interface BlockedSlot {
  date: string;
  shift: ShiftType;
}

export interface AdminSettings {
  morningAdultRate: number;
  eveningAdultRate: number;
  morningKidRate: number;
  eveningKidRate: number;

  earlyBirdDiscount: number;
  extraDiscountPercent: number;

  blockedSlots: BlockedSlot[];
  lastShiftReset?: string; 
  
  // Minimal template config
  waTemplateName: string;
  waLangCode: string;
}

export interface AuthState {
  role: UserRole;
  user: {
    name?: string;
    mobile?: string;
    email?: string;
  } | null;
}

export type GenderType = 'male' | 'female';

export interface LockerReceipt {
  receiptNo: string;
  guestName: string;
  guestMobile: string;
  date: string;
  shift: ShiftType;
  maleLockers: number[];
  femaleLockers: number[];
  maleCostumes: number;
  femaleCostumes: number;
  rentAmount: number;
  securityDeposit: number;
  totalCollected: number;
  refundableAmount: number;
  status: 'issued' | 'returned';
  createdAt: string;
  returnedAt?: string;
}

export type LockerIssue = LockerReceipt;
