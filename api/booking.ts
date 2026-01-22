import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) {
    return res.status(500).json({ error: "Server Configuration Missing" });
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

    if (!token || !phoneId) {
      return res.status(400).json({ success: false, details: "Missing Phone ID or Token in Settings." });
    }

    let cleanMobile = String(mobile || "").replace(/\D/g, '');
    if (cleanMobile.length === 10) cleanMobile = "91" + cleanMobile;

    try {
      const components: any[] = [];
      if (varCount > 0) {
        const params = [];
        // Add name as first variable
        params.push({ type: "text", text: (booking?.name || testConfig?.name || "Guest") });
        // Add booking ID as second variable if needed
        if (varCount > 1) {
          params.push({ type: "text", text: (booking?.id || "TEST-123") });
        }
        // Fill remaining variables with generic text to avoid "Parameter Mismatch"
        for (let i = params.length; i < varCount; i++) {
          params.push({ type: "text", text: "Spray Water Park" });
        }

        components.push({
          type: "body",
          parameters: params
        });
      }

      const payload = {
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
        body: JSON.stringify(payload)
      });
      
      const waData = await waRes.json();
      
      if (!waRes.ok) {
        return res.status(waRes.status).json({ 
          success: false, 
          details: waData.error?.message || "Meta API Rejected Request",
          raw: waData
        });
      }

      return res.status(200).json({ 
        success: true, 
        meta_id: waData.messages?.[0]?.id,
        raw: waData,
        sent_to: cleanMobile
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, details: e.message });
    }
  }

  // Other handlers...
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
