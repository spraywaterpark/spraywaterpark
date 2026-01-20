
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
  
  // WhatsApp Template Config
  waTemplateName: string;
  waLangCode: string;
  waVarCount?: number;
  waToken?: string;
  waPhoneId?: string;
  waAdd91?: boolean;
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
