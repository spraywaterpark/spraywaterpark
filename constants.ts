/* ===============================
   📜 TERMS & UI CONTENT
================================ */

export const TERMS_AND_CONDITIONS = [
  "Stags or groups consisting only of males are strictly not permitted entrance. (अकेले पुरुष या केवल पुरुषों के समूह को प्रवेश की अनुमति नहीं है।)",
  "Consumption of alcohol and smoking are strictly prohibited inside the resort premises. (परिसर के भीतर शराब का सेवन और धूम्रपान पूरी तरह से वर्जित है।)",
  "Appropriate swimwear (Nylon/Lycra) is mandatory for pool entry. Entry beyond changing rooms is restricted without costumes. (पूल में प्रवेश के लिए उचित स्विमवियर अनिवार्य है। बिना कॉस्ट्यूम के चेंजिंग रूम से आगे जाना वर्जित है।)",
  "Management is not responsible for the loss of any personal belongings. Paid locker facilities are available. (निजी सामान के खोने के लिए प्रबंधन जिम्मेदार नहीं है। सशुल्क लॉकर सुविधा उपलब्ध है।)"
];

/* ===============================
   💰 BASE PRICING
================================ */

export const PRICING = {
  MORNING_ADULT: 500,
  MORNING_KID: 350,
  EVENING_ADULT: 800,
  EVENING_KID: 500
};

/* ===============================
   🎁 OFFERS
================================ */

export const OFFERS = {
  MORNING: "FREE Chole Bhature (2:00 PM - 3:00 PM only)",
  EVENING: "FREE Buffet Dinner (8:00 PM - 10:00 PM)"
};

/* ===============================
   ⚙ ADMIN DEFAULT SETTINGS
================================ */

export const DEFAULT_ADMIN_SETTINGS = {
  morningAdultRate: 500,
  eveningAdultRate: 800,
  morningKidRate: 350,
  eveningKidRate: 500,

  earlyBirdDiscount: 20,
  extraDiscountPercent: 10,

  blockedSlots: [],
};

/* ===============================
   🕒 TIME SLOTS
================================ */

export const TIME_SLOTS = [
  "Morning Slot: 10:00 AM - 03:00 PM",
  "Evening Slot: 04:00 PM - 10:00 PM"
];

/* ===============================
   ☁ CLOUD SYNC
================================ */

export const MASTER_SYNC_ID = "1351141753443835904";

/* ===============================
   🧾 STAFF: LOCKER & COSTUME RULES
   (NEW — NO IMPACT ON EXISTING APP)
================================ */

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
  FEMALE_COSTUME_TOTAL: 300,

  MALE_COSTUME_RENT: 50,
  MALE_COSTUME_DEPOSIT: 50,

  FEMALE_COSTUME_RENT: 100,
  FEMALE_COSTUME_DEPOSIT: 100
};
