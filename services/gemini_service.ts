
import { GoogleGenAI } from "@google/genai";
import { Booking } from "../types";

// Helper to initialize AI instance. 
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateConfirmationMessage(booking: Booking) {
  const ai = getAI();
  const isMorning = booking.time.toLowerCase().includes('morning');
  
  // Specific timings requested by user
  const shiftTimings = isMorning 
    ? "pool time 10am to 2pm and snacks time 1pm to 3pm" 
    : "pool time 4pm to 8pm and dinner time 7pm to 10pm";

  const offerDetail = isMorning
    ? "FREE Snacks / Chole Bhature included for all guests!"
    : "FREE Grand Buffet Dinner included for all guests!";

  const prompt = `You are the manager of Spray Aqua Resort. Generate a WhatsApp confirmation message in the following EXACT format:

Hello *${booking.name}*! 🌊

We are absolutely thrilled to confirm your booking at *Spray Aqua Resort!* Get ready for an unforgettable day of fun, splashes, and relaxation. 🏊‍♂️

*Your Booking Details:*
📅 *Date:* ${booking.date}
⏰ *Slot:* ${booking.time}
        (${shiftTimings})
💰 *Total Amount Paid:* ₹${booking.totalAmount}
🎁 *SPECIAL OFFER INCLUDED:* ${offerDetail} 🍴

To ensure you have the best experience, please take a moment to review our house rules:

🚫 *Group Policy:* Stags or groups consisting only of males are strictly not permitted entrance. (अकेले पुरुष या केवल पुरुषों के समूह को प्रवेश की अनुमति नहीं है।)
🚭 *Clean Environment:* Consumption of alcohol and smoking are strictly prohibited inside the resort premises. (परिसर के भीतर शराब का सेवन और धूम्रपान पूरी तरह से वर्जित है।)
🩱 *Pool Access:* Appropriate swimwear (Nylon/Lycra) is mandatory for pool entry. Entry beyond changing rooms is restricted without costumes. (पूल में प्रवेश के लिए उचित स्विमवियर अनिवार्य है। बिना कॉस्ट्यूम के चेंजिंग रूम से आगे जाना वर्जित है।)
🔒 *Safety:* Management is not responsible for the loss of any personal belongings. Paid locker facilities are available. (निजी सामान के खोने के लिए प्रबंधन जिम्मेदार नहीं है। सशुल्क लॉकर सुविधा उपलब्ध है।)

We can't wait to welcome you! If you have any questions, feel free to message us.

See you soon for some fun in the sun! ☀️

Warm regards,

*The Manager*
Spray Aqua Resort 🌴`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (e) {
    console.error("AI Generation Error:", e);
    // Hardcoded fallback matching the same format
    return `Hello *${booking.name}*! 🌊\n\nBooking confirmed for ${booking.date} (${booking.time}).\nTimings: ${shiftTimings}.\nOffer: ${offerDetail}\n\nRules apply as per resort policy (Bilingual).\n\nRegards, Manager, Spray Aqua Resort.`;
  }
}
