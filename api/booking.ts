
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
    
    // Using VERCEL ENVIRONMENT VARIABLES for sensitive credentials
    const token = (process.env.WA_TOKEN || "").trim();
    const phoneId = (process.env.WA_PHONE_ID || "").trim();
    
    // Fetch template config from settings (fallback to hardcoded 'ticket')
    const settings = await getLatestSettings();
    const templateName = (settings?.waTemplateName || "ticket").trim();
    const langCode = (settings?.waLangCode || "en").trim();
    const shouldAdd91 = settings?.waAdd91 !== false;

    if (!token || !phoneId) {
        return res.status(400).json({ 
            success: false, 
            details: "Missing WA_TOKEN or WA_PHONE_ID in Vercel Environment Variables." 
        });
    }

    let cleanMobile = String(mobile || "").replace(/\D/g, '');
    if (shouldAdd91 && cleanMobile.length === 10) cleanMobile = "91" + cleanMobile;

    // Hardcoded parameters for the 'ticket' template (3 variables)
    // {{1}} = Booking ID
    // {{2}} = Date
    // {{3}} = Total Guests
    const totalGuests = (Number(booking?.adults) || 0) + (Number(booking?.kids) || 0);
    const params = [
      { type: "text", text: String(booking?.id || "N/A") },
      { type: "text", text: String(booking?.date || "N/A") },
      { type: "text", text: String(totalGuests || "1") }
    ];

    const waPayload: any = {
      messaging_product: "whatsapp",
      to: cleanMobile,
      type: "template",
      template: {
        name: templateName,
        language: { code: langCode },
        components: [{
          type: "body",
          parameters: params
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
        if (waData.error?.code === 190) errorMsg = "ERROR 190: Vercel Token is invalid or App was deleted.";
        
        await logToSheet([
            new Date().toLocaleString("en-IN"), 
            "FAILED", 
            cleanMobile, 
            "ERROR", 
            `Meta Error: ${errorMsg}`
        ]);

        return res.status(waRes.status).json({ success: false, details: errorMsg });
      }
      
      await logToSheet([
        new Date().toLocaleString("en-IN"), 
        waData.messages?.[0]?.id || "SUCCESS", 
        cleanMobile, 
        "SUCCESS", 
        `Template: ${templateName}`
      ]);

      return res.status(200).json({ success: true, messageId: waData.messages?.[0]?.id });
    } catch (e: any) {
      return res.status(500).json({ success: false, details: `Server Error: ${e.message}` });
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
