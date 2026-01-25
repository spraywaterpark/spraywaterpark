
export const TERMS_AND_CONDITIONS = [
  "Stags or groups consisting only of males are strictly not permitted entrance. (अकेले पुरुष या केवल पुरुषों के समूह ko pravesh ki anumati nahi hai.)",
  "Consumption of alcohol and smoking are strictly prohibited inside the resort premises. (Parisar ke bhitar sharab ka sevan aur dhumrapan puri tarah se varjit hai.)",
  "Appropriate swimwear (Nylon/Lycra) is mandatory for pool entry. Entry beyond changing rooms is restricted without costumes. (Pool mein pravesh ke liye uchit swimwear anivarya hai.)",
  "Management is not responsible for the loss of any personal belongings. Paid locker facilities are available. (Niji saman ke khone ke liye prabandhan zimmedar nahi hai.)"
];

export const PRICING = {
  MORNING_ADULT: 500,
  MORNING_KID: 350,
  EVENING_ADULT: 800,
  EVENING_KID: 500
};

export const OFFERS = {
  MORNING: "FREE Chole Bhature (2:00 PM - 3:00 PM only)",
  EVENING: "FREE Grand Buffet Dinner (8:00 PM - 10:00 PM)"
};

export const DEFAULT_ADMIN_SETTINGS = {
  morningAdultRate: 500,
  eveningAdultRate: 800,
  morningKidRate: 350,
  eveningKidRate: 500,

  earlyBirdDiscount: 20,
  extraDiscountPercent: 10,

  blockedSlots: [],
  waTemplateName: 'ticket_confirmation', 
  waLangCode: 'en', // Changed from en_US to en as requested
  waVariableName: '', 
  waVarCount: 1,
  waAdd91: true
};

export const TIME_SLOTS = [
  "Morning Slot: 10:00 AM - 03:00 PM",
  "Evening Slot: 04:00 PM - 10:00 PM"
];

export const MASTER_SYNC_ID = "1351141753443835904";

export const LOCKER_RULES = {
  MALE_LOCKERS_TOTAL: 60,
  FEMALE_LOCKERS_TOTAL: 60,

  MALE_LOCKER_RENT: 100,
  MALE_LOCKER_DEPOSIT: 200,

  FEMALE_LOCKER_RENT: 100,
  FEMALE_LOCKER_DEPOSIT: 200
};

export const COSTUME_RULES = {
  MALE_COSTUME_TOTAL: 100,
  FEMALE_COSTUME_TOTAL: 200,

  MALE_COSTUME_RENT: 50,
  MALE_COSTUME_DEPOSIT: 50,

  FEMALE_COSTUME_RENT: 100,
  FEMALE_COSTUME_DEPOSIT: 100
};
