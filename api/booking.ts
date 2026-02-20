
import { google } from "googleapis";

// Helper for IST Time & Date comparison
const getISTDateObject = () => {
  const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(new Date());
  const d: any = {};
  parts.forEach(p => d[p.type] = p.value);
  return {
    todayStr: `${d.year}-${d.month}-${d.day}`, // YYYY-MM-DD
    currentHour: parseInt(d.hour)
  };
};

const getISTFullTimestamp = () => {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(new Date());
};

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

  try {
    if (type === 'whatsapp') {
      const { mobile, booking, isWelcome } = req.body;
      const token = (process.env.WHATSAPP_TOKEN || "").trim();
      const phoneId = (process.env.WHATSAPP_PHONE_ID || "").trim();
      
      if (!token || !phoneId) return res.status(400).json({ success: false, details: "WhatsApp API Config missing" });
      
      let cleanMobile = String(mobile || "").replace(/\D/g, '');
      if (cleanMobile.length > 10) cleanMobile = cleanMobile.slice(-10);
      cleanMobile = "91" + cleanMobile;

      let payload: any = {};
      
      if (isWelcome) {
        // Welcome Template - en_US (Screenshot 1)
        payload = {
          messaging_product: "whatsapp",
          to: cleanMobile,
          type: "template",
          template: { 
            name: "welcome", 
            language: { code: "en_US" }, 
            components: [{ 
              type: "body", 
              parameters: [{ type: "text", text: String(booking?.name || "Guest").trim() }] 
            }]
          }
        };
      } else {
        // Ticket Template - en_US (Screenshot 2)
        payload = {
          messaging_product: "whatsapp",
          to: cleanMobile,
          type: "template",
          template: { 
            name: "ticket", 
            language: { code: "en_US" }, 
            components: [
              { 
                type: "header", 
                parameters: [{ 
                  type: "image", 
                  image: { link: `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${booking?.id}` } 
                }] 
              },
              { 
                type: "body", 
                parameters: [
                  { type: "text", text: String(booking?.id) },     // {{1}} Ticket No
                  { type: "text", text: String(booking?.adults) }, // {{2}} Adults
                  { type: "text", text: String(booking?.kids) },   // {{3}} Kids
                  { type: "text", text: String(booking?.date) },   // {{4}} Date
                  { type: "text", text: String(booking?.time) }   // {{5}} Slot
                ] 
              }
            ]
          }
        };
      }

      const waRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const waData = await waRes.json();
      return res.status(waRes.ok ? 200 : 400).json({ success: waRes.ok, details: waData.error?.message || "Success" });
    }

    if (type === 'ticket_details') {
      const searchId = String(req.query.id).toUpperCase();
      const response = await sheets.spreadsheets.values.get({ 
        spreadsheetId: process.env.SHEET_ID, range: "booking!A2:L1000" 
      });
      const rows = response.data.values || [];
      const row = rows.find(r => r[0] === searchId);
      if (!row) return res.status(404).json({ success: false, details: "Ticket Not Found" });
      
      const { todayStr, currentHour } = getISTDateObject();
      const bDate = row[7];
      const bSlot = row[8].toLowerCase();
      const bStatus = row[10];

      let validation = "VALID";
      if (bStatus === "CHECKED-IN") validation = "ALREADY_USED";
      else if (bDate < todayStr) validation = "EXPIRED";
      else if (bDate > todayStr) validation = "FUTURE_DATE";
      else {
        // Same day, check shift
        const isMorningShift = bSlot.includes("morning");
        const currentShift = currentHour < 15 ? "morning" : "evening";
        if (isMorningShift && currentShift === "evening") validation = "EXPIRED_SLOT";
        else if (!isMorningShift && currentShift === "morning") validation = "FUTURE_SLOT";
      }

      return res.status(200).json({ 
        success: true, 
        validation,
        booking: {
          id: row[0], name: row[1], mobile: row[2], 
          adults: parseInt(row[3])||0, kids: parseInt(row[4])||0, 
          date: row[7], time: row[8], 
          status: bStatus
        } 
      });
    }

    if (type === 'checkin') {
      const { ticketId } = req.body;
      const response = await sheets.spreadsheets.values.get({ 
        spreadsheetId: process.env.SHEET_ID, range: "booking!A2:L1000" 
      });
      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(r => r[0] === ticketId);
      if (rowIndex === -1) return res.status(404).json({ success: false });
      
      const nowIST = getISTFullTimestamp();
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `booking!K${rowIndex + 2}:L${rowIndex + 2}`,
        valueInputOption: "RAW",
        requestBody: { values: [["CHECKED-IN", nowIST]] }
      });
      return res.status(200).json({ success: true });
    }

    // Default POST for booking
    if (req.method === "POST") {
      const b = req.body;
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID, range: "booking!A:L",
        valueInputOption: "RAW",
        requestBody: { values: [[
          b.id, b.name, b.mobile, b.adults, b.kids, Number(b.adults) + Number(b.kids), 
          b.amount, b.date, b.time, "PAID", "YET TO ARRIVE", ""
        ]] }
      });
      return res.status(200).json({ success: true });
    }

    // Default GET for settings
    if (type === 'settings' && req.method === "GET") {
      const response = await sheets.spreadsheets.values.get({ 
        spreadsheetId: process.env.SHEET_ID, range: "adminpanel!A2:H100" 
      });
      const rows = response.data.values || [];
      if (rows.length === 0) return res.status(200).json({});
      const firstRow = rows[0];
      return res.status(200).json({
        morningAdultRate: parseInt(firstRow[0]) || 0,
        morningKidRate: parseInt(firstRow[1]) || 0,
        eveningAdultRate: parseInt(firstRow[2]) || 0,
        eveningKidRate: parseInt(firstRow[3]) || 0,
        earlyBirdDiscount: parseInt(firstRow[4]) || 0,
        extraDiscountPercent: parseInt(firstRow[5]) || 0,
        blockedSlots: []
      });
    }

    if (req.method === "GET") {
      const response = await sheets.spreadsheets.values.get({ 
        spreadsheetId: process.env.SHEET_ID, range: "booking!A2:L1000" 
      });
      const rows = response.data.values || [];
      return res.status(200).json(rows.map(row => ({
        id: row[0], name: row[1], mobile: row[2], adults: row[3], kids: row[4], totalAmount: row[6], date: row[7], time: row[8], status: row[10]
      })).reverse());
    }

  } catch (e: any) {
    return res.status(500).json({ success: false, details: e.message });
  }
}
