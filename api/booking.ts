import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (!process.env.GOOGLE_CREDENTIALS || !process.env.SHEET_ID) {
    return res.status(500).json({ error: "Server Configuration Missing (Sheets)" });
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
    const templateName = (settings?.waTemplateName || "ticket_confirmed").trim();
    const langCode = (settings?.waLangCode || "en").trim();
    const varCount = settings?.waVarCount !== undefined ? Number(settings.waVarCount) : 0;

    if (!token || !phoneId) {
      return res.status(400).json({ 
        success: false, 
        details: "Credentials Missing (Phone ID or Token)." 
      });
    }

    let cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length === 10) cleanMobile = `91${cleanMobile}`;

    try {
      const templatePayload: any = {
        messaging_product: "whatsapp",
        to: cleanMobile,
        type: "template",
        template: { 
          name: templateName, 
          language: { code: langCode }
        }
      };

      // If varCount is > 0, we send the components. 
      // If Meta dashboard shows "Type of Variable", you MUST send this.
      if (varCount > 0) {
        templatePayload.template.components = [{
          type: "body",
          parameters: [{ type: "text", text: booking?.name || testConfig?.name || "Guest" }]
        }];
      }

      const waRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(templatePayload)
      });
      
      const waData = await waRes.json();
      
      if (!waRes.ok) {
        let hint = "Technical Error from Meta.";
        const errorCode = waData.error?.code;
        const errorMsg = waData.error?.message?.toLowerCase() || "";
        
        if (errorCode === 132001) {
          hint = "Template Variable Mismatch! Your Meta Dashboard says 'Number' for variables, but you selected 'No Variables' in Admin. Try switching to '1 Variable' in Admin Portal.";
        } else if (errorCode === 100) {
          hint = "Invalid Parameter. Check if Template Name 'ticket_confirmed' matches exactly (no spaces).";
        } else if (errorCode === 190) {
          hint = "Token Invalid. Check your Permanent Access Token in Vercel.";
        }

        return res.status(waRes.status).json({ 
          success: false, 
          details: waData.error?.message || "Meta API Error",
          hint: hint,
          raw: waData 
        });
      }

      return res.status(200).json({ 
        success: true, 
        meta_id: waData.messages?.[0]?.id,
        info: "Accepted by Meta."
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, details: e.message });
    }
  }

  // ... rest of the handler remains same ...
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
