import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const ENV_TOKEN = process.env.WHATSAPP_TOKEN;
  const ENV_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

  // --- CONFIG DIAGNOSTIC TEST ---
  if (req.query.type === 'test_config' && req.method === 'POST') {
    const { token, phoneId, mobile, templateName, langCode, variables } = req.body;
    let cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length === 10) cleanMobile = `91${cleanMobile}`;

    const payload: any = {
      messaging_product: "whatsapp",
      to: cleanMobile,
      type: "template",
      template: { 
        name: templateName || "booked_ticket", 
        language: { code: langCode || "en" } 
      }
    };

    if (variables && Array.isArray(variables) && variables.length > 0) {
      payload.template.components = [{
        type: "body",
        parameters: variables.map(v => ({ type: "text", text: String(v) }))
      }];
    }

    try {
      const waRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await waRes.json();
      if (waRes.ok) return res.status(200).json({ success: true });
      else return res.status(waRes.status).json({ success: false, details: data.error?.message, code: data.error?.code });
    } catch (e: any) {
      return res.status(500).json({ success: false, details: e.message });
    }
  }

  // --- TICKETING LOGIC ---
  if (req.query.type === 'whatsapp' && req.method === 'POST') {
    const { mobile, booking, templateName, langCode, hasVariables, settings } = req.body;
    
    // Priority: Settings from Cloud > Vercel Env Vars
    const token = settings?.waToken || ENV_TOKEN;
    const phoneId = settings?.waPhoneId || ENV_PHONE_ID;

    if (!token || !phoneId) return res.status(400).json({ error: "CREDENTIALS_MISSING" });

    let cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length === 10) cleanMobile = `91${cleanMobile}`;

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${booking.id}`;

    try {
      const templatePayload: any = {
        messaging_product: "whatsapp",
        to: cleanMobile,
        type: "template",
        template: { 
          name: templateName || "booked_ticket", 
          language: { code: langCode || "en" }
        }
      };

      if (hasVariables) {
        templatePayload.template.components = [{
          type: "body",
          parameters: [{ type: "text", text: booking.name || "Guest" }]
        }];
      }

      // 1. Send Template
      const templateRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(templatePayload)
      });
      
      const templateData = await templateRes.json();
      if (!templateRes.ok) return res.status(templateRes.status).json({ success: false, details: templateData.error?.message, meta_code: templateData.error?.code });

      // Small delay between messages to improve reliability on Meta side
      await new Promise(r => setTimeout(r, 1000));

      // 2. Send QR Image
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

      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ success: false, details: error.message });
    }
  }

  // --- GOOGLE SHEETS LOGIC ---
  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) return res.status(500).json({ error: "Config Error" });
  const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS), scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  const sheets = google.sheets({ version: "v4", auth });
  const type = req.query.type;

  if (type === 'settings') {
    if (req.method === "GET") {
      const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Settings!A1" });
      const data = response.data.values?.[0]?.[0];
      return res.status(200).json(data ? JSON.parse(data) : null);
    }
    if (req.method === "POST") {
      await sheets.spreadsheets.values.update({ spreadsheetId: process.env.SHEET_ID, range: "Settings!A1", valueInputOption: "RAW", requestBody: { values: [[JSON.stringify(req.body)]] } });
      return res.status(200).json({ success: true });
    }
  }

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
