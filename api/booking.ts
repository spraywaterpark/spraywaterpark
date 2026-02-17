
import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) {
    return res.status(500).json({ success: false, details: "Server Configuration Missing" });
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const type = req.query.type;

  const logToSheet = async (data: any[]) => {
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: "Logs!A:E",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [data] }
      });
    } catch (e) {}
  };

  const getLatestSettings = async () => {
    try {
      const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Settings!A1" });
      return response.data.values?.[0]?.[0] ? JSON.parse(response.data.values[0][0]) : {};
    } catch (e) { return {}; }
  };

  if (type === 'whatsapp') {
    const { mobile, booking } = req.body;
    
    // FETCH CREDENTIALS FROM VERCEL ENVIRONMENT VARIABLES (Strictly WHATSAPP_TOKEN and WHATSAPP_PHONE_ID)
    const token = (process.env.WHATSAPP_TOKEN || "").trim();
    const phoneId = (process.env.WHATSAPP_PHONE_ID || "").trim();
    
    // Updated settings based on user confirmation
    const templateName = "ticket";
    const langCode = "en_US"; // Changed from 'en' to 'en_US' as requested

    if (!token || !phoneId) {
        return res.status(400).json({ 
            success: false, 
            details: "Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_ID in Vercel Environment Variables. Please verify your Vercel Dashboard Settings." 
        });
    }

    let cleanMobile = String(mobile || "").replace(/\D/g, '');
    if (cleanMobile.length === 10) cleanMobile = "91" + cleanMobile;

    // Formatting date to DD/MM/YYYY for professional look in template
    let displayDate = String(booking?.date || "N/A");
    if (displayDate.includes('-')) {
        const parts = displayDate.split('-'); // YYYY-MM-DD
        if (parts.length === 3) displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    const totalGuests = (Number(booking?.adults) || 0) + (Number(booking?.kids) || 0);

    // Hardcoded parameters for the 'ticket' template:
    // {{1}} = Booking ID (Text)
    // {{2}} = Date (Text: DD/MM/YYYY)
    // {{3}} = Total Guests (Text: e.g. "4")
    const waPayload: any = {
      messaging_product: "whatsapp",
      to: cleanMobile,
      type: "template",
      template: {
        name: templateName,
        language: { code: langCode },
        components: [{
          type: "body",
          parameters: [
            { type: "text", text: String(booking?.id || "N/A") },
            { type: "text", text: String(displayDate) },
            { type: "text", text: String(totalGuests || "1") }
          ]
        }]
      }
    };

    try {
      const waRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(waPayload)
      });

      const waData = await waRes.json();
      
      if (!waRes.ok) {
        let errorMsg = `(#${waData.error?.code}) ${waData.error?.message}`;
        await logToSheet([new Date().toLocaleString("en-IN"), "FAILED", cleanMobile, "ERROR", `Meta: ${errorMsg}`]);
        return res.status(waRes.status).json({ success: false, details: errorMsg });
      }
      
      await logToSheet([new Date().toLocaleString("en-IN"), waData.messages?.[0]?.id, cleanMobile, "SUCCESS", `Sent 'ticket' to ${cleanMobile}`]);
      return res.status(200).json({ success: true, messageId: waData.messages?.[0]?.id });
    } catch (e: any) {
      return res.status(500).json({ success: false, details: `System Error: ${e.message}` });
    }
  }

  if (type === 'settings') {
    if (req.method === "GET") return res.status(200).json(await getLatestSettings());
    if (req.method === "POST") {
      await sheets.spreadsheets.values.update({ spreadsheetId: process.env.SHEET_ID, range: "Settings!A1", valueInputOption: "RAW", requestBody: { values: [[JSON.stringify(req.body)]] } });
      return res.status(200).json({ success: true });
    }
  }

  if (req.method === "GET") {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A2:J1000" });
    return res.status(200).json((response.data.values || []).map((row: any) => ({
      id: row[0], name: row[1] || "Guest", mobile: row[2] || "", adults: parseInt(row[3])||0, kids: parseInt(row[4])||0, totalAmount: parseInt(row[6])||0, date: row[7] || "", time: row[8] || "", status: "confirmed", createdAt: row[0] || "",
    })).reverse());
  }

  if (req.method === "POST") {
    const { name, mobile, adults, kids, amount, date, time } = req.body;
    await sheets.spreadsheets.values.append({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A:J", valueInputOption: "USER_ENTERED", requestBody: { values: [[new Date().toLocaleString("en-IN"), name, mobile, adults, kids, (adults + kids), amount, date, time, "PAID"]] } });
    return res.status(200).json({ success: true });
  }
}
