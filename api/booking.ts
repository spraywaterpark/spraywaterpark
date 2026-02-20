
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
    // --- SETTINGS LOGIC ---
    if (type === 'settings') {
      if (req.method === "GET") {
        const response = await sheets.spreadsheets.values.get({ 
          spreadsheetId: process.env.SHEET_ID, 
          range: "adminpanel!A2:H100" 
        });
        const rows = response.data.values || [];
        if (rows.length === 0) return res.status(200).json({});
        
        const firstRow = rows[0];
        const settings: any = {
          morningAdultRate: parseInt(firstRow[0]) || 0,
          morningKidRate: parseInt(firstRow[1]) || 0,
          eveningAdultRate: parseInt(firstRow[2]) || 0,
          eveningKidRate: parseInt(firstRow[3]) || 0,
          earlyBirdDiscount: parseInt(firstRow[4]) || 0,
          extraDiscountPercent: parseInt(firstRow[5]) || 0,
          blockedSlots: []
        };

        // Parse Blocked Slots from columns G (6) and H (7)
        rows.forEach(row => {
          if (row[6] && row[7]) {
            settings.blockedSlots.push({ date: row[6], shift: row[7] });
          }
        });
        
        return res.status(200).json(settings);
      }

      if (req.method === "POST") {
        const s = req.body;
        const primaryValues = [
          s.morningAdultRate, 
          s.morningKidRate, 
          s.eveningAdultRate, 
          s.eveningKidRate, 
          s.earlyBirdDiscount, 
          s.extraDiscountPercent
        ];
        
        const blockedSlots = s.blockedSlots || [];
        const rowsToUpdate = [];
        const maxRows = Math.max(1, blockedSlots.length);

        for (let i = 0; i < maxRows; i++) {
          // Row structure: A-F (Rates), G-H (Blocked Slots)
          const row = i === 0 ? [...primaryValues] : ["", "", "", "", "", ""];
          if (blockedSlots[i]) {
            row[6] = blockedSlots[i].date;
            row[7] = blockedSlots[i].shift;
          } else {
            row[6] = ""; 
            row[7] = "";
          }
          rowsToUpdate.push(row);
        }

        // Clear and Update
        await sheets.spreadsheets.values.clear({ 
          spreadsheetId: process.env.SHEET_ID, 
          range: "adminpanel!A2:H100" 
        });
        
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: "adminpanel!A2",
          valueInputOption: "RAW",
          requestBody: { values: rowsToUpdate }
        });

        return res.status(200).json({ success: true });
      }
    }

    // --- WHATSAPP LOGIC ---
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
                  { type: "text", text: String(booking?.id) },
                  { type: "text", text: String(booking?.adults) },
                  { type: "text", text: String(booking?.kids) },
                  { type: "text", text: String(booking?.date) },
                  { type: "text", text: String(booking?.time) }
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

    // --- GATE ENTRY VALIDATION ---
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

    // --- DEFAULT POST (BOOKING) ---
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

    // --- DEFAULT GET (BOOKINGS LIST) ---
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
