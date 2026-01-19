import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

  if (req.query.type === 'health') {
    return res.status(200).json({
      whatsapp_token: !!WHATSAPP_TOKEN,
      whatsapp_phone_id: !!PHONE_NUMBER_ID,
      token_preview: WHATSAPP_TOKEN ? `${WHATSAPP_TOKEN.substring(0, 10)}...` : 'NONE'
    });
  }

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
        language: { code: langCode || "en_GB" } 
      }
    };

    if (variables && Array.isArray(variables)) {
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
      
      if (waRes.ok) {
        return res.status(200).json({ success: true, message_id: data.messages?.[0]?.id });
      } else {
        return res.status(waRes.status).json({ 
          success: false, 
          details: data.error?.message,
          code: data.error?.code,
          fb_trace_id: data.error?.fbtrace_id
        });
      }
    } catch (e: any) {
      return res.status(500).json({ success: false, details: e.message });
    }
  }

  // --- TICKETING LOGIC ---
  if (req.query.type === 'whatsapp' && req.method === 'POST') {
    const { mobile, booking, templateName, langCode } = req.body;
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) return res.status(400).json({ error: "CREDENTIALS_MISSING" });

    let cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length === 10) cleanMobile = `91${cleanMobile}`;

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${booking.id}`;

    try {
      const templateRes = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanMobile,
          type: "template",
          template: { 
            name: templateName || "booked_ticket", 
            language: { code: langCode || "en_GB" },
            components: [{
              type: "body",
              parameters: [
                // ONLY ONE VARIABLE based on user screenshot showing "Variable: Name"
                { type: "text", text: booking.name || "Guest" }
              ]
            }]
          }
        })
      });
      
      const templateData = await templateRes.json();
      
      if (!templateRes.ok) {
        return res.status(templateRes.status).json({ 
          success: false, 
          details: templateData.error?.message,
          meta_code: templateData.error?.code,
          fb_trace_id: templateData.error?.fbtrace_id
        });
      }

      // QR Image
      await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
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
