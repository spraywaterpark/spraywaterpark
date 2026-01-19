import { Booking, AdminSettings } from "../types";
import { DEFAULT_ADMIN_SETTINGS } from "../constants";

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
    // Attempt to get saved settings for template config
    let templateName = 'booked_ticket';
    let langCode = 'en_US';
    
    try {
      const saved = localStorage.getItem('swp_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        templateName = settings.waTemplateName || templateName;
        langCode = settings.waLangCode || langCode;
      }
    } catch (e) {}

    try {
      const response = await fetch('/api/booking?type=whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: booking.mobile,
          booking: booking,
          templateName,
          langCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "SERVER_ERROR",
          details: data.details || "Meta API rejected the message.",
          fb_trace_id: data.fb_trace_id,
          meta_code: data.meta_code || data.code,
          meta_subcode: data.meta_subcode
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: "NETWORK_ERROR",
        details: error.message || "Could not connect to the server."
      };
    }
  }
};
