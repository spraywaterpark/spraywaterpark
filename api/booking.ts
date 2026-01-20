import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) {
    return res.status(500).json({ error: "Server Configuration Missing (Sheets)" });
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const type = req.query.type;

  // --- HELPER: GET LATEST SETTINGS FROM SHEET ---
  const getLatestSettings = async () => {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: "Settings!A1",
      });
      const data = response.data.values?.[0]?.[0];
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  };

  // --- WHATSAPP SENDING LOGIC (TEST & REAL) ---
  if (type === 'whatsapp' || type === 'test_config') {
    const { mobile, booking, testConfig } = req.body;
    
    // 1. Get credentials (either from test input or from Sheets)
    const settings = type === 'test_config' ? testConfig : await getLatestSettings();
    
    const token = settings?.waToken;
    const phoneId = settings?.waPhoneId;
    const templateName = settings?.waTemplateName || "booked_ticket";
    const langCode = settings?.waLangCode || "en";

    if (!token || !phoneId) {
      return res.status(400).json({ success: false, details: "WhatsApp Credentials (Token/ID) not found in Settings." });
    }

    let cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length === 10) cleanMobile = `91${cleanMobile}`;

    const qrImageUrl = booking ? `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${booking.id}` : null;

    try {
      // Step A: Send Template Message
      const payload: any = {
        messaging_product: "whatsapp",
        to: cleanMobile,
        type: "template",
        template: { 
          name: templateName, 
          language: { code: langCode }
        }
      };

      // Add variable if needed (Guest Name)
      if (settings.waVarCount > 0 && (booking?.name || testConfig?.name)) {
        payload.template.components = [{
          type: "body",
          parameters: [{ type: "text", text: booking?.name || "Guest" }]
        }];
      }

      const waRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const waData = await waRes.json();
      if (!waRes.ok) {
        return res.status(waRes.status).json({ success: false, details: waData.error?.message, code: waData.error?.code });
      }

      // Step B: Send QR Code (Only for real bookings)
      if (booking && qrImageUrl) {
        await new Promise(r => setTimeout(r, 1000)); // Delay
        await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: cleanMobile,
            type: "image",
            image: { link: qrImageUrl, caption: `Your official entry QR for booking ${booking.id}` }
          })
        });
      }

      return res.status(200).json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ success: false, details: e.message });
    }
  }

  // --- STANDARD SETTINGS LOGIC ---
  if (type === 'settings') {
    if (req.method === "GET") {
      const data = await getLatestSettings();
      return res.status(200).json(data);
    }
    if (req.method === "POST") {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: "Settings!A1",
        valueInputOption: "RAW",
        requestBody: { values: [[JSON.stringify(req.body)]] }
      });
      return res.status(200).json({ success: true });
    }
  }

  // --- BOOKING RECORDS LOGIC ---
  if (req.method === "GET" && !type) {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A2:J1000" });
    const rows = response.data.values || [];
    return res.status(200).json(rows.map((row: any) => ({
      id: row[0], name: row[1] || "Guest", mobile: row[2] || "", adults: parseInt(row[3])||0, kids: parseInt(row[4])||0, totalAmount: parseInt(row[6])||0, date: row[7] || "", time: row[8] || "", status: "confirmed", createdAt: row[0] || "",
    })).reverse());
  }

  if (req.method === "POST" && !type) {
    const { name, mobile, adults, kids, amount, date, time } = req.body;
    const values = [[new Date().toLocaleString("en-IN"), name, mobile, adults, kids, (adults + kids), amount, date, time, "PAID"]];
    await sheets.spreadsheets.values.append({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A:J", valueInputOption: "USER_ENTERED", requestBody: { values } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
