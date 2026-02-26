
import { google } from "googleapis";
import Razorpay from "razorpay";
import crypto from "crypto";

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

  let auth;
  try {
    auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  } catch (err) {
    return res.status(500).json({ success: false, details: "Invalid GOOGLE_CREDENTIALS format" });
  }
  const sheets = google.sheets({ version: "v4", auth });
  const type = req.query.type;

  try {
    // 1. SETTINGS LOGIC
    if (type === 'settings') {
      if (req.method === "GET") {
        const response = await sheets.spreadsheets.values.get({ 
          spreadsheetId: process.env.SHEET_ID, range: "adminpanel!A2:H100" 
        });
        const rows = response.data.values || [];
        const settings: any = {
          morningAdultRate: 500, morningKidRate: 350, eveningAdultRate: 800, eveningKidRate: 500,
          earlyBirdDiscount: 20, extraDiscountPercent: 10, blockedSlots: []
        };
        if (rows.length > 0) {
          const firstRow = rows[0];
          settings.morningAdultRate = parseInt(firstRow[0]) || 500;
          settings.morningKidRate = parseInt(firstRow[1]) || 350;
          settings.eveningAdultRate = parseInt(firstRow[2]) || 800;
          settings.eveningKidRate = parseInt(firstRow[3]) || 500;
          settings.earlyBirdDiscount = parseInt(firstRow[4]) || 20;
          settings.extraDiscountPercent = parseInt(firstRow[5]) || 10;
          rows.forEach(row => {
            if (row[6] && row[7]) settings.blockedSlots.push({ date: row[6], shift: row[7] });
          });
        }
        return res.status(200).json(settings);
      }
      if (req.method === "POST") {
        const s = req.body;
        const primary = [s.morningAdultRate, s.morningKidRate, s.eveningAdultRate, s.eveningKidRate, s.earlyBirdDiscount, s.extraDiscountPercent];
        const blockedSlots = s.blockedSlots || [];
        const rowsToUpdate = [];
        const maxRows = Math.max(1, blockedSlots.length);
        for (let i = 0; i < maxRows; i++) {
          const row = i === 0 ? [...primary] : ["", "", "", "", "", ""];
          if (blockedSlots[i]) { row[6] = blockedSlots[i].date; row[7] = blockedSlots[i].shift; }
          else { row[6] = ""; row[7] = ""; }
          rowsToUpdate.push(row);
        }
        await sheets.spreadsheets.values.clear({ spreadsheetId: process.env.SHEET_ID, range: "adminpanel!A2:H100" });
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID, range: "adminpanel!A2",
          valueInputOption: "RAW", requestBody: { values: rowsToUpdate }
        });
        return res.status(200).json({ success: true });
      }
    }

    // 2. RENTALS LOGIC
    if (type === 'rentals') {
      if (req.method === "GET") {
        const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Lockers!A2:P2000" });
        const rows = (response.data.values || []).filter(r => r[0]); // Filter empty rows
        return res.status(200).json(rows.map(r => ({
          receiptNo: r[0] || "", guestName: r[1] || "", guestMobile: r[2] || "", date: r[3] || "", shift: r[4] || "",
          maleLockers: r[5] ? r[5].split(',').map(Number) : [],
          femaleLockers: r[6] ? r[6].split(',').map(Number) : [],
          maleCostumes: parseInt(r[7]) || 0, femaleCostumes: parseInt(r[8]) || 0,
          rentAmount: parseInt(r[9]) || 0, securityDeposit: parseInt(r[10]) || 0,
          totalCollected: parseInt(r[11]) || 0, refundableAmount: parseInt(r[12]) || 0,
          status: r[13] || "issued", createdAt: r[14] || "", returnedAt: r[15] || ''
        })));
      }
      if (req.method === "POST") {
        if (req.query.action === 'update') {
          const rental = req.body;
          const resp = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "Lockers!A2:A2000" });
          const rows = resp.data.values || [];
          const idx = rows.findIndex(r => r[0] === rental.receiptNo);
          if (idx === -1) return res.status(404).json({ success: false });
          await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SHEET_ID, range: `Lockers!N${idx + 2}:P${idx + 2}`,
            valueInputOption: "RAW", requestBody: { values: [[rental.status, "", getISTFullTimestamp()]] }
          });
          return res.status(200).json({ success: true });
        } else {
          const r = req.body;
          await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SHEET_ID, range: "Lockers!A:P",
            valueInputOption: "RAW", requestBody: { values: [[
              r.receiptNo, r.guestName, r.guestMobile, r.date, r.shift,
              r.maleLockers.join(','), r.femaleLockers.join(','),
              r.maleCostumes, r.femaleCostumes, r.rentAmount, r.securityDeposit,
              r.totalCollected, r.refundableAmount, r.status, getISTFullTimestamp(), ""
            ]] }
          });
          return res.status(200).json({ success: true });
        }
      }
    }

    // 3. WHATSAPP LOGIC
    if (type === 'whatsapp') {
      const { mobile, booking, isWelcome } = req.body;
      const phoneId = (process.env.WHATSAPP_PHONE_ID || "").trim();
      const token = (process.env.WHATSAPP_TOKEN || "").trim();
      let cleanMobile = String(mobile || "").replace(/\D/g, '').slice(-10);
      cleanMobile = "91" + cleanMobile;

      let payload: any = { messaging_product: "whatsapp", to: cleanMobile, type: "template", template: { language: { code: "en_US" } } };
      if (isWelcome) {
        payload.template.name = "welcome";
        payload.template.components = [{ type: "body", parameters: [{ type: "text", text: String(booking?.name || "Guest").trim() }] }];
      } else {
        payload.template.name = "ticket";
        payload.template.components = [
          { type: "header", parameters: [{ type: "image", image: { link: `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${booking?.id}` } }] },
          { type: "body", parameters: [{type:"text",text:booking.id}, {type:"text",text:booking.adults}, {type:"text",text:booking.kids}, {type:"text",text:booking.date}, {type:"text",text:booking.time}] }
        ];
      }
      const waRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.status(waRes.ok ? 200 : 400).json({ success: waRes.ok });
    }

    // 4. TICKETS & CHECKIN
    if (type === 'ticket_details') {
      const searchId = String(req.query.id).toUpperCase();
      const resp = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "booking!A2:L1000" });
      const rows = resp.data.values || [];
      const row = rows.find(r => r[0] === searchId);
      if (!row) return res.status(404).json({ success: false });
      const { todayStr, currentHour } = getISTDateObject();
      let validation = "VALID";
      if (row[10] === "CHECKED-IN") validation = "ALREADY_USED";
      else if (row[7] < todayStr) validation = "EXPIRED";
      else if (row[7] > todayStr) validation = "FUTURE_DATE";
      else {
        const isMorning = row[8].toLowerCase().includes("morning");
        const currentShift = currentHour < 15 ? "morning" : "evening";
        if (isMorning && currentShift === "evening") validation = "EXPIRED_SLOT";
        else if (!isMorning && currentShift === "morning") validation = "FUTURE_SLOT";
      }
      return res.status(200).json({ success: true, validation, booking: { id: row[0], name: row[1], mobile: row[2], adults: row[3], kids: row[4], date: row[7], time: row[8], status: row[10] } });
    }

    if (type === 'checkin') {
      const { ticketId } = req.body;
      const resp = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "booking!A2:L1000" });
      const rows = resp.data.values || [];
      const idx = rows.findIndex(r => r[0] === ticketId);
      if (idx === -1) return res.status(404).json({ success: false });
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID, range: `booking!K${idx + 2}:L${idx + 2}`,
        valueInputOption: "RAW", requestBody: { values: [["CHECKED-IN", getISTFullTimestamp()]] }
      });
      return res.status(200).json({ success: true });
    }

    if (type === 'update_ticket') {
      const b = req.body;
      const resp = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "booking!A2:A1000" });
      const rows = resp.data.values || [];
      const idx = rows.findIndex(r => r[0] === b.id);
      if (idx === -1) return res.status(404).json({ success: false });
      
      // Update columns: D (Adults), E (Kids), F (Total Guests), G (Amount)
      // Columns are 0-indexed: A=0, B=1, C=2, D=3, E=4, F=5, G=6
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID, range: `booking!D${idx + 2}:G${idx + 2}`,
        valueInputOption: "RAW", 
        requestBody: { 
          values: [[b.adults, b.kids, Number(b.adults) + Number(b.kids), b.totalAmount]] 
        }
      });
      return res.status(200).json({ success: true });
    }

    if (type === 'reset_shift') {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID, range: "Lockers!N2:N2000",
        valueInputOption: "RAW", requestBody: { values: Array(1999).fill(["returned"]) }
      });
      return res.status(200).json({ success: true });
    }

    // 5. RAZORPAY LOGIC
    if (type === 'create_razorpay_order') {
      const { amount, currency = "INR", receipt } = req.body;
      
      const keyId = (process.env.RAZORPAY_KEY_ID || "").trim().replace(/['"]/g, '');
      const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim().replace(/['"]/g, '');

      // Log masked keys for debugging in Vercel Logs
      console.log(`Attempting Razorpay Order: KeyID=${keyId.substring(0, 8)}..., Secret=${keySecret.substring(0, 4)}...`);

      if (!keyId || !keySecret) {
        return res.status(500).json({ 
          success: false, 
          message: "Razorpay Keys are missing in environment variables. Please check Vercel settings." 
        });
      }

      try {
        // Use a more universal way to initialize Razorpay in ESM/Vercel
        const RazorpayLib = (Razorpay as any).default || Razorpay;
        const razorpay = new RazorpayLib({
          key_id: keyId,
          key_secret: keySecret,
        });

        const options = {
          amount: Math.round(Number(amount) * 100),
          currency,
          receipt: String(receipt),
        };

        const order = await razorpay.orders.create(options);
        return res.status(200).json({ success: true, order });
      } catch (err: any) {
        console.error("Razorpay Order Error:", err);
        return res.status(500).json({ 
          success: false, 
          message: `Razorpay Error: ${err.message || 'Unknown Error'}`,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
      }
    }

    if (type === 'verify_razorpay_payment') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

      if (!keySecret) {
        return res.status(500).json({ success: false, message: "Razorpay Secret Missing" });
      }

      try {
        const generated_signature = crypto
          .createHmac("sha256", keySecret)
          .update(razorpay_order_id + "|" + razorpay_payment_id)
          .digest("hex");

        if (generated_signature === razorpay_signature) {
          return res.status(200).json({ success: true });
        } else {
          return res.status(400).json({ success: false, message: "Invalid signature" });
        }
      } catch (err: any) {
        return res.status(500).json({ success: false, message: "Verification failed" });
      }
    }

    if (req.method === "POST") {
      const b = req.body;
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID, range: "booking!A:L",
        valueInputOption: "RAW", requestBody: { values: [[b.id, b.name, b.mobile, b.adults, b.kids, Number(b.adults) + Number(b.kids), b.amount, b.date, b.time, "PAID", "YET TO ARRIVE", ""]] }
      });
      return res.status(200).json({ success: true });
    }

    if (req.method === "GET") {
      const resp = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: "booking!A2:L1000" });
      const rows = (resp.data.values || []).filter(row => row[0]); // Ensure ID exists
      return res.status(200).json(rows.map(row => ({ 
        id: row[0] || "", 
        name: row[1] || "", 
        mobile: row[2] || "", 
        adults: Number(row[3]) || 0, 
        kids: Number(row[4]) || 0, 
        totalAmount: Number(row[6]) || 0, 
        date: row[7] || "", 
        time: row[8] || "", 
        status: row[10] === "CHECKED-IN" ? "checked-in" : "confirmed" 
      })).reverse());
    }
  } catch (e: any) {
    return res.status(500).json({ success: false, details: e.message });
  }
}
