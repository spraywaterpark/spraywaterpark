
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

  if (type === 'whatsapp') {
    const { mobile, booking } = req.body;
    const token = (process.env.WHATSAPP_TOKEN || "").trim();
    const phoneId = (process.env.WHATSAPP_PHONE_ID || "").trim();
    const templateName = "ticket";
    const langCode = "en_US";

    if (!token || !phoneId) {
        return res.status(400).json({ success: false, details: "WhatsApp Credentials Missing in Vercel." });
    }

    let cleanMobile = String(mobile || "").replace(/\D/g, '');
    if (cleanMobile.length === 10) cleanMobile = "91" + cleanMobile;

    // 1. Format Date
    let displayDate = String(booking?.date || "N/A");
    if (displayDate.includes('-')) {
        const parts = displayDate.split('-');
        if (parts.length === 3) displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // 2. Exact Slot Times as requested
    let slotTime = "10:00 AM to 03:00 PM";
    if (String(booking?.time).toLowerCase().includes("evening")) {
        slotTime = "04:00 PM to 10:00 PM";
    }

    // 3. QR Code URL (This is for the IMAGE HEADER)
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${booking.id}`;

    const waPayload = {
      messaging_product: "whatsapp",
      to: cleanMobile,
      type: "template",
      template: {
        name: templateName,
        language: { code: langCode },
        components: [
          {
            type: "header", // Sends to the Media Image Header
            parameters: [
              {
                type: "image",
                image: {
                  link: qrImageUrl
                }
              }
            ]
          },
          {
            type: "body", // Sends to {{1}} to {{5}}
            parameters: [
              { type: "text", text: String(booking?.id || "N/A") }, // {{1}}
              { type: "text", text: String(booking?.adults || "0") }, // {{2}}
              { type: "text", text: String(booking?.kids || "0") }, // {{3}}
              { type: "text", text: String(displayDate) }, // {{4}}
              { type: "text", text: String(slotTime) } // {{5}}
            ]
          }
        ]
      }
    };

    try {
      const waRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(waPayload)
      });
      const waData = await waRes.json();
      if (!waRes.ok) return res.status(waRes.status).json({ success: false, details: waData.error?.message });
      return res.status(200).json({ success: true, messageId: waData.messages?.[0]?.id });
    } catch (e: any) {
      return res.status(500).json({ success: false, details: e.message });
    }
  }

  // Handle Gate Check-in
  if (type === 'checkin') {
    const { ticketId } = req.body;
    try {
      const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A2:J1000" });
      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(r => r[0] === ticketId);
      if (rowIndex === -1) return res.status(404).json({ success: false, details: "Ticket Not Found" });
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `Sheet1!J${rowIndex + 2}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [["CHECKED-IN"]] }
      });
      return res.status(200).json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ success: false, details: e.message });
    }
  }

  // Settings & General Bookings
  if (type === 'settings') {
    if (req.method === "GET") {
        const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Settings!A1" });
        return res.status(200).json(response.data.values?.[0]?.[0] ? JSON.parse(response.data.values[0][0]) : {});
    }
    if (req.method === "POST") {
      await sheets.spreadsheets.values.update({ spreadsheetId: process.env.SHEET_ID, range: "Settings!A1", valueInputOption: "RAW", requestBody: { values: [[JSON.stringify(req.body)]] } });
      return res.status(200).json({ success: true });
    }
  }

  if (req.method === "GET") {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A2:J1000" });
    return res.status(200).json((response.data.values || []).map((row: any) => ({
      id: row[0], name: row[1] || "Guest", mobile: row[2] || "", adults: parseInt(row[3])||0, kids: parseInt(row[4])||0, totalAmount: parseInt(row[6])||0, date: row[7] || "", time: row[8] || "", status: row[9] === "CHECKED-IN" ? "checked-in" : "confirmed", createdAt: row[0] || "",
    })).reverse());
  }

  if (req.method === "POST") {
    const { name, mobile, adults, kids, amount, date, time } = req.body;
    const ticketId = 'SWP-' + Math.floor(100000 + Math.random() * 900000);
    await sheets.spreadsheets.values.append({ spreadsheetId: process.env.SHEET_ID, range: "Sheet1!A:J", valueInputOption: "USER_ENTERED", requestBody: { values: [[ticketId, name, mobile, adults, kids, (adults + kids), amount, date, time, "PAID"]] } });
    return res.status(200).json({ success: true, ticketId });
  }
}
