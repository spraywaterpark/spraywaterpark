
import { Booking } from "../types";
import { generateConfirmationMessage } from "./gemini_service";

export interface WhatsAppResponse {
  success: boolean;
  error?: string;
  details?: string;
  fb_trace_id?: string;
  meta_code?: number;
  meta_subcode?: number;
}

export const notificationService = {
  sendWhatsAppTicket: async (booking: Booking): Promise<WhatsAppResponse> => {
    console.log(`[Official WA] Sending ticket to: ${booking.mobile}`);
    
    try {
      const aiMessage = await generateConfirmationMessage(booking);
      sessionStorage.setItem('last_ai_message', aiMessage);

      const response = await fetch('/api/booking?type=whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: booking.mobile,
          message: aiMessage
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "SERVER_ERROR",
          details: data.details || "Failed to deliver WhatsApp message via Meta API.",
          fb_trace_id: data.fb_trace_id,
          meta_code: data.meta_code,
          meta_subcode: data.meta_subcode
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Official WhatsApp Error:", error);
      return {
        success: false,
        error: "NETWORK_ERROR",
        details: error.message || "Network connectivity issue."
      };
    }
  }
};
