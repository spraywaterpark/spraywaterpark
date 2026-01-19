
import { Booking } from "../types";

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
    console.log(`[Backend-AI WA] Requesting ticket for: ${booking.mobile}`);
    
    try {
      // We no longer call generateConfirmationMessage here.
      // The backend /api/booking?type=whatsapp will do it.
      const response = await fetch('/api/booking?type=whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: booking.mobile,
          booking: booking // Send the full object, server will generate text
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "SERVER_ERROR",
          details: data.details || "Meta API rejected the message.",
          fb_trace_id: data.fb_trace_id,
          meta_code: data.meta_code,
          meta_subcode: data.meta_subcode
        };
      }

      // Store the generated message for the 'Get on WhatsApp' button fallback
      if (data.ai_message) {
        sessionStorage.setItem('last_ai_message', data.ai_message);
      }

      return { success: true };
    } catch (error: any) {
      console.error("Official WhatsApp Error:", error);
      return {
        success: false,
        error: "NETWORK_ERROR",
        details: error.message || "Could not connect to the server."
      };
    }
  }
};
