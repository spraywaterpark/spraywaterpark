import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) {
    return res.status(500).json({ success: false, details: "Server Configuration (Env Vars) Missing" });
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
      if (!data) return {};
      return JSON.parse(data);
    } catch (e) { 
      console.error("Settings fetch error:", e);
      return {}; 
    }
  };

  // WHATSAPP SENDING LOGIC
  if (type === 'whatsapp') {
    const { mobile, booking } = req.body;
    const settings = await getLatestSettings();
    
    const token = (settings?.waToken || "").trim();
    const phoneId = (settings?.waPhoneId || "").trim();
    const templateName = (settings?.waTemplateName || "ticket").trim();
    const langCode = (settings?.waLangCode || "en").trim();
    const shouldAdd91 = settings?.waAdd91 !== false; // Default true

    if (!token || !phoneId) {
      return res.status(400).json({ 
        success: false, 
        details: "Configuration missing in Admin: Please enter Token and Phone ID in Settings tab." 
      });
    }

    let cleanMobile = String(mobile || "").replace(/\D/g, '');
    if (shouldAdd91 && cleanMobile.length === 10) {
      cleanMobile = "91" + cleanMobile;
    }

    try {
      // Structure for Meta 'Named Variable' templates (as per user screenshot)
      const payload = {
        messaging_product: "whatsapp",
        to: cleanMobile,
        type: "template",
        template: {
          name: templateName,
          language: { code: langCode },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  parameter_name: "guest_name", // Must match {{guest_name}} in Meta Template
                  text: String(booking?.name || "Guest")
                }
              ]
            }
          ]
        }
      };

      const waRes = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const waData = await waRes.json();

      if (!waRes.ok) {
        console.error("META ERROR:", JSON.stringify(waData));
        const errMsg = waData.error?.message || "Unknown Meta Error";
        const errCode = waData.error?.code || "N/A";
        return res.status(400).json({ 
          success: false, 
          details: `Meta API Rejected: [Code ${errCode}] ${errMsg}`
        });
      }

      return res.status(200).json({ success: true, meta_id: waData.messages?.[0]?.id });
    } catch (e: any) {
      console.error("SERVER WHATSAPP ERROR:", e);
      return res.status(500).json({ success: false, details: `Internal Server Error: ${e.message}` });
    }
  }

  // SETTINGS MANAGEMENT
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

  // BOOKING DATA (Sheet1)
  if (req.method === "GET" && !type) {
    try {
      const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A2:J1000" });
      const rows = response.data.values || [];
      return res.status(200).json(rows.map((row: any) => ({
        id: row[0], name: row[1] || "Guest", mobile: row[2] || "", adults: parseInt(row[3])||0, kids: parseInt(row[4])||0, totalAmount: parseInt(row[6])||0, date: row[7] || "", time: row[8] || "", status: "confirmed", createdAt: row[0] || "",
      })).reverse());
    } catch (e) {
      return res.status(200).json([]);
    }
  }

  if (req.method === "POST" && !type) {
    const { name, mobile, adults, kids, amount, date, time } = req.body;
    const values = [[new Date().toLocaleString("en-IN"), name, mobile, adults, kids, (adults + kids), amount, date, time, "PAID"]];
    await sheets.spreadsheets.values.append({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A:J", valueInputOption: "USER_ENTERED", requestBody: { values } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, details: "Method not allowed" });
}
