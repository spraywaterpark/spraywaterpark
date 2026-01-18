

import { Booking } from "../types";
import { generateConfirmationMessage } from "./gemini_service";

/**
 * WhatsApp Notification Service for Spray Aqua Resort
 * Automated via Server-Side Official Meta API
 */
export const notificationService = {
  /**
   * Triggers an official automated WhatsApp message from the server.
   */
  sendWhatsAppTicket: async (booking: Booking): Promise<boolean> => {
    console.log(`[Official WA] Sending ticket to: ${booking.mobile}`);
    
    try {
      // 1. Generate content via AI
      const aiMessage = await generateConfirmationMessage(booking);
      sessionStorage.setItem('last_ai_message', aiMessage);

      // 2. Call our internal API which handles the Meta Graph API logic
      const response = await fetch('/api/booking?type=whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: booking.mobile,
          message: aiMessage
        })
      });

      if (!response.ok) {
        throw new Error("Failed to send official WhatsApp message.");
      }

      return true;
    } catch (error) {
      console.error("Official WhatsApp Error:", error);
      
      // Fallback: If official API fails, try the manual method as a last resort
      const fallbackMsg = `*Spray Aqua Resort* \nHi ${booking.name}, your booking ID ${booking.id} is confirmed for ${booking.date}. See you soon!`;
      const encoded = encodeURIComponent(fallbackMsg);
      // We only open manual WA as a fallback if the automated one fails completely
      // window.open(`https://wa.me/91${booking.mobile}?text=${encoded}`, '_blank');
      
      return false;
    }
  }
};
