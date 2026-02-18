
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
  const id = req.query.id;

  try {
    // 1. SETTINGS SYNC (MASTER DATA - RATES & SLOTS)
    if (type === 'settings') {
      if (req.method === "GET") {
        const response = await sheets.spreadsheets.values.get({ 
          spreadsheetId: process.env.SHEET_ID, 
          range: "Settings!A1:A1" 
        });
        const val = response.data.values?.[0]?.[0];
        return res.status(200).json(val ? JSON.parse(val) : {});
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

    // 2. WHATSAPP NOTIFICATION (STABLE & HARDCODED)
    if (type === 'whatsapp') {
      const { mobile, booking, isWelcome } = req.body;
      
      const token = (process.env.WHATSAPP_TOKEN || "").trim();
      const phoneId = (process.env.WHATSAPP_PHONE_ID || "").trim();
      
      if (!token || !phoneId) return res.status(400).json({ success: false, details: "WhatsApp API Key or Phone ID missing in Server Env." });

      let cleanMobile = String(mobile || "").replace(/\D/g, '');
      if (cleanMobile.length === 10) cleanMobile = "91" + cleanMobile;

      // HARDCODED TEMPLATES - Updated welcome_entry to welcome
      const templateName = isWelcome ? "welcome" : "ticket";
      
      const components = isWelcome 
        ? [ { type: "body", parameters: [ { type: "text", text: String(booking.name) } ] } ]
        : [
            { type: "header", parameters: [{ type: "image", image: { link: `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${booking.id}` } }] },
            { type: "body", parameters: [
                { type: "text", text: String(booking.id) },
                { type: "text", text: String(booking.adults) },
                { type: "text", text: String(booking.kids) },
                { type: "text", text: String(booking.date) },
                { type: "text", text: String(booking.time) }
            ]}
          ];

      const waPayload = {
        messaging_product: "whatsapp",
        to: cleanMobile,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en_US" },
          components: components
        }
      };

      const waRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(waPayload)
      });
      const waData = await waRes.json();
      return res.status(waRes.status).json({ success: waRes.ok, details: waData.error?.message || "Sent Successfully" });
    }

    // 3. TICKET DETAILS FOR SCANNER
    if (type === 'ticket_details') {
      const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A2:J1000" });
      const rows = response.data.values || [];
      const row = rows.find(r => r[0] === id);
      if (!row) return res.status(404).json({ success: false, details: "Ticket Not Found" });
      return res.status(200).json({ 
        success: true, 
        booking: { id: row[0], name: row[1], mobile: row[2], adults: row[3], kids: row[4], totalAmount: row[6], date: row[7], time: row[8], status: row[9] }
      });
    }

    // 4. GATE CHECK-IN
    if (type === 'checkin') {
      const { ticketId } = req.body;
      const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A2:J1000" });
      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(r => r[0] === ticketId);
      if (rowIndex === -1) return res.status(404).json({ success: false, details: "Ticket Not Found" });
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `Sheet1!J${rowIndex + 2}`,
        valueInputOption: "RAW",
        requestBody: { values: [["CHECKED-IN"]] }
      });
      return res.status(200).json({ success: true });
    }

    // 5. STANDARD BOOKING POST
    if (req.method === "POST" && !type) {
      const b = req.body;
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: "Sheet1!A:J",
        valueInputOption: "RAW",
        requestBody: { values: [[
          b.id, b.name, b.mobile, b.adults, b.kids, Number(b.adults) + Number(b.kids), b.amount, b.date, b.time, "PAID"
        ]] }
      });
      return res.status(200).json({ success: true });
    }

    // 6. STANDARD BOOKING GET
    if (req.method === "GET" && !type) {
      const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A2:J1000" });
      const rows = response.data.values || [];
      return res.status(200).json(rows.map(row => ({
        id: row[0], name: row[1], mobile: row[2], adults: parseInt(row[3])||0, kids: parseInt(row[4])||0, 
        totalAmount: parseInt(row[6])||0, date: row[7], time: row[8], status: row[9] === "CHECKED-IN" ? "checked-in" : "confirmed", createdAt: row[0]
      })).reverse());
    }

  } catch (e: any) {
    console.error("Critical API Error:", e.message);
    return res.status(500).json({ success: false, details: "Server Sync Error" });
  }
}
