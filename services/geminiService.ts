
import { GoogleGenAI } from "@google/genai";
import { Booking } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateConfirmationMessage(booking: Booking) {
  const ai = getAI();
  const isMorning = booking.time.toLowerCase().includes('morning');
  
  const shiftTimings = isMorning 
    ? "pool time 10am to 2pm and snacks time 1pm to 3pm" 
    : "pool time 4pm to 8pm and dinner time 7pm to 10pm";

  const offerDetail = isMorning
    ? "FREE Snacks / Chole Bhature included for all guests!"
    : "FREE Grand Buffet Dinner included for all guests!";

  const prompt = `Generate an official WhatsApp message for Spray Aqua Resort guest ${booking.name}:
  Date: ${booking.date}
  Slot: ${booking.time} (${shiftTimings})
  Paid: ₹${booking.totalAmount}
  Offer: ${offerDetail}
  
  Follow the specific bilingual rules format for Stags, Alcohol, Swimwear, and Safety as requested by the owner.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (e) {
    return `Booking Confirmed for ${booking.name} on ${booking.date}.`;
  }
}
