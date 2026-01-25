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

  // Function to log events to the "Logs" sheet
  const logToSheet = async (data: any[]) => {
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: "Logs!A:E",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [data] }
      });
    } catch (e) {
      console.error("Logging failed:", e);
    }
  };

  // --- 1. WEBHOOK VERIFICATION (GET REQUEST FROM META) ---
  if (req.method === "GET" && type === "webhook") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === "spray_water_park_secure") {
      return res.status(200).send(challenge);
    }
    return res.status(403).end();
  }

  // --- 2. WEBHOOK DATA RECEIVER (POST REQUEST FROM META) ---
  if (req.method === "POST" && type === "webhook") {
    const body = req.body;
    try {
      const entry = body.entry?.[0]?.changes?.[0]?.value;
      if (entry?.statuses?.[0]) {
        const statusUpdate = entry.statuses[0];
        // Log every status change to the Sheet for debugging (Sent, Delivered, Read, Failed)
        await logToSheet([
          new Date().toLocaleString("en-IN"), 
          statusUpdate.id, 
          statusUpdate.recipient_id, 
          statusUpdate.status.toUpperCase(), 
          statusUpdate.errors?.[0]?.message || "Status Update"
        ]);
      }
    } catch (e) {}
    return res.status(200).json({ status: "ok" });
  }

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

  // --- 3. WHATSAPP SENDING LOGIC ---
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
      return res.status(400).json({ success: false, details: "Settings incomplete." });
    }

    let cleanMobile = String(mobile || "").replace(/\D/g, '');
    if (shouldAdd91 && cleanMobile.length === 10) cleanMobile = "91" + cleanMobile;

    try {
      const waPayload = {
        messaging_product: "whatsapp",
        to: cleanMobile,
        type: "template",
        template: {
          name: templateName,
          language: { code: langCode },
          components: [{
              type: "body",
              parameters: [{
                  type: "text",
                  text: String(booking?.name || "Guest")
              }]
          }]
        }
      };

      const waRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(waPayload)
      });

      const waData = await waRes.json();
      
      // Log the attempt to the sheet
      await logToSheet([
        new Date().toLocaleString("en-IN"), 
        waData.messages?.[0]?.id || "FAILED", 
        cleanMobile, 
        waRes.ok ? "API_ACCEPTED" : "API_REJECTED", 
        waRes.ok ? `Template: ${templateName}` : (waData.error?.message || "Unknown Meta Error")
      ]);

      if (!waRes.ok) {
        return res.status(400).json({ success: false, details: waData.error?.message });
      }

      return res.status(200).json({ success: true, messageId: waData.messages?.[0]?.id });
    } catch (e: any) {
      return res.status(500).json({ success: false, details: e.message });
    }
  }

  // --- 4. SETTINGS & BOOKING DATA ---
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
