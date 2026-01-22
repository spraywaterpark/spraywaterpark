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
    const cloudSettings = await getLatestSettings();
    const settings = type === 'test_config' ? testConfig : cloudSettings;
    
    const token = (settings?.waToken || "").trim();
    const phoneId = (settings?.waPhoneId || "").trim();
    const templateName = (settings?.waTemplateName || "ticket").trim();
    const langCode = (settings?.waLangCode || "en").trim();
    const varCount = settings?.waVarCount !== undefined ? Number(settings.waVarCount) : 1;
    const shouldAdd91 = settings?.waAdd91 !== false;

    if (!token || !phoneId) {
      return res.status(400).json({ 
        success: false, 
        details: "Missing Config: Phone ID or Token is empty." 
      });
    }

    // formatting for Meta (Target Mobile)
    let cleanMobile = String(mobile || "").replace(/\D/g, '');
    if (shouldAdd91) {
      if (cleanMobile.length === 10) cleanMobile = "91" + cleanMobile;
      else if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) { /* Correct */ }
      else if (cleanMobile.length === 11 && cleanMobile.startsWith('0')) cleanMobile = "91" + cleanMobile.substring(1);
    }

    try {
      // Build Precise Meta Payload
      const components = [];
      if (varCount > 0) {
        components.push({
          type: "body",
          parameters: [
            {
              type: "text",
              text: (booking?.name || testConfig?.name || "Guest")
            }
          ]
        });
      }

      const templatePayload = {
        messaging_product: "whatsapp",
        to: cleanMobile,
        type: "template",
        template: { 
          name: templateName, 
          language: { code: langCode },
          components: components
        }
      };

      const waRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(templatePayload)
      });
      
      const waData = await waRes.json();
      
      if (!waRes.ok) {
        return res.status(waRes.status).json({ 
          success: false, 
          details: waData.error?.message || "Meta Rejected Request",
          raw: waData,
          sent_payload: templatePayload
        });
      }

      // Meta 200 OK
      return res.status(200).json({ 
        success: true, 
        meta_id: waData.messages?.[0]?.id,
        info: "Meta accepted the message. Check delivery on phone.",
        raw: waData,
        sent_payload: templatePayload
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, details: e.message });
    }
  }

  // Settings & Sheet Handlers
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
