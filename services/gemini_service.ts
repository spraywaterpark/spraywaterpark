
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

  const prompt = `You are the manager of Spray Aqua Resort. Generate a WhatsApp confirmation message in the following EXACT format. 

Hello *${booking.name}*! 🌊

We are absolutely thrilled to confirm your booking at *Spray Aqua Resort!* 

*Your Booking Details:*
📅 *Date:* ${booking.date}
⏰ *Slot:* ${booking.time} (${shiftTimings})
💰 *Total Amount Paid:* ₹${booking.totalAmount}
🎁 *SPECIAL OFFER INCLUDED:* *${offerDetail}* 🍴

*Rules:* No stags/only-male groups. No alcohol/smoking. Swimwear mandatory.

Warm regards,
*The Manager*
Spray Aqua Resort 🌴`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.1, 
      }
    });
    return response.text;
  } catch (e) {
    console.error("AI Generation Error:", e);
    return `Hello *${booking.name}*! 🌊\n\nBooking confirmed for ${booking.date}.\nTimings: ${shiftTimings}.\nOffer: ${offerDetail}\n\nRegards, Manager, Spray Aqua Resort.`;
  }
}

export async function generateWelcomeMessage(guestName: string) {
  const ai = getAI();
  const prompt = `You are the manager of Spray Aqua Resort. A guest named ${guestName} has just checked in at the gate. Generate a warm, professional, and exciting welcome message for WhatsApp. 
  Keep it concise. Mention that we hope they have a fantastic day and remind them that Nylon/Lycra swimwear is mandatory for pool access. 
  Include a bilingual greeting (English & Hindi).
  
  Format example:
  Welcome to Spray Aqua Resort, *${guestName}*! 🌊
  हम आपका स्वागत करते हैं!
  
  Enjoy the pools and the slides! 🏊‍♂️
  Reminder: Nylon/Lycra swimwear is mandatory.
  Have a splashing time! 🌴`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.7 }
    });
    return response.text;
  } catch (e) {
    return `Welcome to Spray Aqua Resort, *${guestName}*! 🌊\n\nEnjoy your day! Reminder: Swimwear is mandatory. 🏊‍♂️`;
  }
}
