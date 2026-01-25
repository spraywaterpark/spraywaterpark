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
    const settings = await getLatestSettings();
    
    const token = (settings?.waToken || "").trim();
    const phoneId = (settings?.waPhoneId || "").trim();
    const templateName = (settings?.waTemplateName || "ticket_confirmation").trim();
    
    // AUTO-FIX for Error #132001: Map en_us to en
    let langCode = (settings?.waLangCode || "en").trim().toLowerCase();
    if (langCode === 'en_us') langCode = 'en'; 

    const varCount = parseInt(settings?.waVarCount || "1");
    const shouldAdd91 = settings?.waAdd91 !== false;

    if (!token || !phoneId) return res.status(400).json({ success: false, details: "Missing API Token or Phone ID." });

    let cleanMobile = String(mobile || "").replace(/\D/g, '');
    if (shouldAdd91 && cleanMobile.length === 10) cleanMobile = "91" + cleanMobile;

    const params: any[] = [];
    if (varCount >= 1) {
      params.push({ type: "text", text: String(booking?.name || "Guest") });
    }
    if (varCount >= 2) {
      params.push({ type: "text", text: String(booking?.id || "N/A") });
    }

    const waPayload: any = {
      messaging_product: "whatsapp",
      to: cleanMobile,
      type: "template",
      template: {
        name: templateName,
        language: { code: langCode }
      }
    };

    if (params.length > 0) {
      waPayload.template.components = [{
        type: "body",
        parameters: params
      }];
    }

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
      
      await logToSheet([
        new Date().toLocaleString("en-IN"), 
        waData.messages?.[0]?.id || "FAILED", 
        cleanMobile, 
        waRes.ok ? "SUCCESS" : "ERROR", 
        waRes.ok 
          ? `Sent: ${templateName}` 
          : `Sent JSON: ${JSON.stringify(waPayload)} | Meta Error: (#${waData.error?.code}) ${waData.error?.message}`
      ]);

      if (!waRes.ok) return res.status(waRes.status).json({ success: false, details: `(#${waData.error?.code}) ${waData.error?.message}` });
      return res.status(200).json({ success: true, messageId: waData.messages?.[0]?.id });
    } catch (e: any) {
      return res.status(500).json({ success: false, details: e.message });
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
