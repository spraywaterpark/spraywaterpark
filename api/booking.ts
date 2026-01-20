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

  if (type === 'whatsapp' || type === 'test_config') {
    const { mobile, booking, testConfig } = req.body;
    const settings = type === 'test_config' ? testConfig : await getLatestSettings();
    
    const token = settings?.waToken?.trim();
    const phoneId = settings?.waPhoneId?.trim();
    const templateName = settings?.waTemplateName?.trim() || "booked_ticket";
    const langCode = settings?.waLangCode?.trim() || "en";

    if (!token || !phoneId) {
      return res.status(400).json({ success: false, details: "WhatsApp Credentials (Token/ID) are missing." });
    }

    // Strict number cleaning: remove all non-digits, then handle 10-digit cases
    let cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length === 10) {
      cleanMobile = `91${cleanMobile}`;
    } else if (cleanMobile.length > 10 && cleanMobile.startsWith('0')) {
      cleanMobile = `91${cleanMobile.substring(1)}`;
    }

    try {
      const payload: any = {
        messaging_product: "whatsapp",
        to: cleanMobile,
        type: "template",
        template: { 
          name: templateName, 
          language: { code: langCode }
        }
      };

      if (settings.waVarCount > 0) {
        payload.template.components = [{
          type: "body",
          parameters: [{ type: "text", text: booking?.name || testConfig?.name || "Guest" }]
        }];
      }

      const waRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });
      
      const waData = await waRes.json();
      
      if (!waRes.ok) {
        // Return full Meta error for debugging
        return res.status(waRes.status).json({ 
          success: false, 
          details: waData.error?.message || "Meta API Error",
          code: waData.error?.code,
          fullError: waData
        });
      }

      // If it's a real booking, send the QR Code image as well
      if (booking && !type.includes('test')) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${booking.id}`;
        await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: cleanMobile,
            type: "image",
            image: { link: qrUrl, caption: `Booking ID: ${booking.id}\nScan this at the entrance.` }
          })
        });
      }

      return res.status(200).json({ success: true, metaResponse: waData });
    } catch (e: any) {
      return res.status(500).json({ success: false, details: e.message });
    }
  }

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

  // --- GET ALL BOOKINGS ---
  if (req.method === "GET" && !type) {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A2:J1000" });
    const rows = response.data.values || [];
    return res.status(200).json(rows.map((row: any) => ({
      id: row[0], name: row[1] || "Guest", mobile: row[2] || "", adults: parseInt(row[3])||0, kids: parseInt(row[4])||0, totalAmount: parseInt(row[6])||0, date: row[7] || "", time: row[8] || "", status: "confirmed", createdAt: row[0] || "",
    })).reverse());
  }

  // --- SAVE NEW BOOKING ---
  if (req.method === "POST" && !type) {
    const { name, mobile, adults, kids, amount, date, time } = req.body;
    const values = [[new Date().toLocaleString("en-IN"), name, mobile, adults, kids, (adults + kids), amount, date, time, "PAID"]];
    await sheets.spreadsheets.values.append({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A:J", valueInputOption: "USER_ENTERED", requestBody: { values } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
