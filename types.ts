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
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

/* ===============================
   ADMIN: BLOCK DATE / SHIFT
================================ */

export type ShiftType = 'morning' | 'evening' | 'all';

export interface BlockedSlot {
  date: string;
  shift: ShiftType;
}

/* ===============================
   ADMIN SETTINGS
================================ */

export interface AdminSettings {
  morningAdultRate: number;
  eveningAdultRate: number;
  morningKidRate: number;
  eveningKidRate: number;

  earlyBirdDiscount: number;
  extraDiscountPercent: number;

  blockedSlots: BlockedSlot[];
}

/* ===============================
   AUTH STATE
================================ */

export interface AuthState {
  role: UserRole;
  user: {
    name?: string;
    mobile?: string;
    email?: string;
  } | null;
}

/* ===============================
   STAFF / LOCKER SYSTEM TYPES
   (future use – not active yet)
================================ */

export interface LockerIssue {
  guestName: string;
  guestMobile: string;

  maleLockers: number[];
  femaleLockers: number[];

  maleCostumes: number;
  femaleCostumes: number;

  rentAmount: number;
  securityDeposit: number;
  refundAmount: number;

  issuedAt: string;
  returnedAt?: string;
}
