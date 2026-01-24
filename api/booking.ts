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

  const getLatestSettings = async () => {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: "Settings!A1",
      });
      const data = response.data.values?.[0]?.[0];
      return data ? JSON.parse(data) : {};
    } catch (e) { return {}; }
  };

  if (type === 'whatsapp') {
    const { mobile, booking } = req.body;
    const settings = await getLatestSettings();
    
    const token = (settings?.waToken || "").trim();
    const phoneId = (settings?.waPhoneId || "").trim();
    const templateName = (settings?.waTemplateName || "ticket").trim();
    const langCode = (settings?.waLangCode || "en").trim();
    const varName = (settings?.waVariableName || "guest_name").trim();
    const shouldAdd91 = settings?.waAdd91 !== false;

    if (!token || !phoneId) {
      return res.status(400).json({ success: false, details: "WhatsApp Token or Phone ID is missing in Admin Settings." });
    }

    let cleanMobile = String(mobile || "").replace(/\D/g, '');
    if (shouldAdd91 && cleanMobile.length === 10) cleanMobile = "91" + cleanMobile;

    try {
      // Dynamic Named Parameter Payload
      const waPayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanMobile,
        type: "template",
        template: {
          name: templateName,
          language: { code: langCode },
          components: [{
            type: "body",
            parameters: [
              {
                type: "text",
                parameter_name: varName, // Using the variable name from settings
                text: String(booking?.name || "Guest")
              }
            ]
          }]
        }
      };

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
        const error = waData.error || {};
        return res.status(400).json({ 
          success: false, 
          details: `Meta Error: ${error.message} (Code: ${error.code})` 
        });
      }

      return res.status(200).json({ success: true, metaResponse: waData });

    } catch (e: any) {
      return res.status(500).json({ success: false, details: `Internal Fetch Error: ${e.message}` });
    }
  }

  // --- SETTINGS & BOOKINGS LOGIC ---
  if (type === 'settings') {
    if (req.method === "GET") return res.status(200).json(await getLatestSettings());
    if (req.method === "POST") {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID, range: "Settings!A1",
        valueInputOption: "RAW", requestBody: { values: [[JSON.stringify(req.body)]] }
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

  return res.status(405).json({ success: false });
}
