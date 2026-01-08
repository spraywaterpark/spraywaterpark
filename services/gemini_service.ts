
import { GoogleGenAI } from "@google/genai";
import { Booking } from "../types";
import { TERMS_AND_CONDITIONS, OFFERS } from "../constants";

// Helper to initialize AI instance. 
// Updated to use process.env.API_KEY directly as a named parameter per guidelines.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateConfirmationMessage(booking: Booking) {
  const ai = getAI();
  const isMorning = booking.time.includes('Morning');
  const slotOffer = isMorning ? OFFERS.MORNING : OFFERS.EVENING;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the manager of Spray Aqua Resort. Generate a friendly, exciting WhatsApp confirmation message for a guest named ${booking.name}. 
      Booking Details: 
      - Date: ${booking.date}
      - Slot: ${booking.time}
      - Special Offer Included: ${slotOffer}
      - Total Amount Paid: ₹${booking.totalAmount}
      
      Briefly mention these rules: ${TERMS_AND_CONDITIONS.join(', ')}. 
      Keep the tone helpful and professional. Use emojis.`,
    });
    // Correctly accessing the .text property (not as a function) as per GenerateContentResponse guidelines.
    return response.text;
  } catch (e) {
    console.error("AI Generation Error:", e);
    return `*Spray Aqua Resort - Booking Confirmed!* \n\nHi ${booking.name}, your splash day is set for ${booking.date} (${booking.time}). \nOffer: ${slotOffer}. \nSee you soon!`;
  }
}
