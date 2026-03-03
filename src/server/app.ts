import express from "express";
import { google } from "googleapis";
import cors from "cors";
import dotenv from "dotenv";

// Only load dotenv in development
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();

app.use(cors());
app.use(express.json());

// Helper to format the private key correctly for Google Auth
const getPrivateKey = () => {
  const key = process.env.GOOGLE_PRIVATE_KEY || process.env.VITE_GOOGLE_PRIVATE_KEY;
  if (!key) return undefined;
  
  let formattedKey = key.trim();
  if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
    formattedKey = formattedKey.slice(1, -1);
  }
  
  return formattedKey.replace(/\\n/g, '\n');
};

const getEnvVar = (name: string) => {
  return process.env[name] || process.env[`VITE_${name}`];
};

const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

apiRouter.post("/admin/login", (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ status: "error", message: "Request body is missing" });
    }
    
    const { username, password } = req.body;
    const adminUsername = getEnvVar("ADMIN_USERNAME") || "admin";
    const adminPassword = getEnvVar("ADMIN_PASSWORD") || "risalaupdate";

    if (username === adminUsername && password === adminPassword) {
      res.json({ status: "success", token: "admin-token-123" });
    } else {
      res.status(401).json({ status: "error", message: "Invalid credentials" });
    }
  } catch (error: any) {
    console.error("Login route error:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Internal server error during login", 
      details: error.message || "Unknown error" 
    });
  }
});

apiRouter.get("/debug", (req, res) => {
  const privateKey = getPrivateKey();
  const spreadsheetId = getEnvVar("GOOGLE_SPREADSHEET_ID");
  const clientEmail = getEnvVar("GOOGLE_CLIENT_EMAIL");

  res.json({
    status: "ok",
    diagnostics: {
      spreadsheetId_detected: !!spreadsheetId,
      clientEmail_detected: !!clientEmail,
      privateKey_detected: !!process.env.GOOGLE_PRIVATE_KEY || !!process.env.VITE_GOOGLE_PRIVATE_KEY,
      privateKey_valid_format: !!privateKey && privateKey.includes('BEGIN PRIVATE KEY'),
      privateKey_length: privateKey ? privateKey.length : 0,
    },
    env_keys_found: Object.keys(process.env).filter(k => 
      k.includes('GOOGLE') || k.includes('ADMIN') || k.includes('VITE_GOOGLE')
    ),
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV || 'not-detected'
  });
});

apiRouter.get("/registrations", async (req, res) => {
  try {
    const spreadsheetId = getEnvVar("GOOGLE_SPREADSHEET_ID");
    const clientEmail = getEnvVar("GOOGLE_CLIENT_EMAIL");
    const privateKey = getPrivateKey();

    if (!spreadsheetId || !clientEmail || !privateKey) {
      return res.json({ 
        status: "success", 
        data: [], 
        message: "Credentials missing in environment"
      });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A:O",
    });

    const rows = response.data.values || [];
    const startIndex = rows.length > 0 && rows[0][0]?.toLowerCase().includes('id') ? 1 : 0;
    
    const data = rows.slice(startIndex).map((row, index) => ({
      id: index + 1,
      registrationId: row[0] || '',
      fullName: row[1] || '',
      email: row[2] || '',
      phone: row[3] || '',
      whatsapp: row[4] || '',
      company: row[5] || '',
      category: row[6] || '',
      profession: row[7] || '',
      area: row[8] || '',
      gender: row[9] || '',
      age: row[10] || '',
      musandamTrip: row[11] || '',
      date: row[12] || '',
      attended: row[13] === 'TRUE' || row[13] === 'Yes' || false,
      mealsPledged: row[14] ? parseInt(row[14], 10) : 0
    }));

    res.json({ status: "success", data });
  } catch (error: any) {
    console.error("Error fetching from Google Sheets:", error);
    res.status(500).json({ status: "error", message: "Failed to fetch registrations" });
  }
});

apiRouter.post("/register", async (req, res) => {
  try {
    const {
      registrationId, fullName, email, company, category, profession,
      otherProfession, phone, whatsappCode, whatsappNumber, area,
      gender, age, musandamTrip, date, mealsPledged
    } = req.body;

    const spreadsheetId = getEnvVar("GOOGLE_SPREADSHEET_ID");
    const clientEmail = getEnvVar("GOOGLE_CLIENT_EMAIL");
    const privateKey = getPrivateKey();

    if (!spreadsheetId || !clientEmail || !privateKey) {
      return res.json({ status: "success", message: "Mock saved (credentials missing)" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const fullProfession = profession === 'Other' ? otherProfession : profession;
    const fullWhatsapp = `${whatsappCode}${whatsappNumber}`;
    const cleanWhatsapp = fullWhatsapp.replace(/\+/g, '');

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:O",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          registrationId, fullName, email, phone, cleanWhatsapp, company,
          category, fullProfession, area, gender, age, musandamTrip,
          date || new Date().toISOString(), false, mealsPledged || 0
        ]],
      },
    });

    res.json({ status: "success" });
  } catch (error: any) {
    console.error("Error saving to Google Sheets:", error);
    res.status(500).json({ status: "error", message: "Failed to save registration" });
  }
});

apiRouter.post("/attendance", async (req, res) => {
  try {
    const { identifier } = req.body;
    const spreadsheetId = getEnvVar("GOOGLE_SPREADSHEET_ID");
    const clientEmail = getEnvVar("GOOGLE_CLIENT_EMAIL");
    const privateKey = getPrivateKey();

    if (!spreadsheetId || !clientEmail || !privateKey) {
      return res.json({ status: "success", message: "Mock attendance saved" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A:O",
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (
        row[0]?.toLowerCase() === identifier.toLowerCase() ||
        row[3] === identifier ||
        row[1]?.toLowerCase() === identifier.toLowerCase()
      ) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex !== -1) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!N${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [['Yes']] }
      });
      res.json({ status: "success" });
    } else {
      res.status(404).json({ status: "error", message: "Registration not found" });
    }
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ status: "error", message: "Failed to update attendance" });
  }
});

apiRouter.delete("/registrations/:registrationId", async (req, res) => {
  try {
    const { registrationId } = req.params;
    const spreadsheetId = getEnvVar("GOOGLE_SPREADSHEET_ID");
    const clientEmail = getEnvVar("GOOGLE_CLIENT_EMAIL");
    const privateKey = getPrivateKey();

    if (!spreadsheetId || !clientEmail || !privateKey) {
      return res.json({ status: "success", message: "Mock deletion" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A:A",
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === registrationId) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex !== -1) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          }],
        },
      });
      res.json({ status: "success" });
    } else {
      res.status(404).json({ status: "error", message: "Registration not found" });
    }
  } catch (error) {
    console.error("Error deleting registration:", error);
    res.status(500).json({ status: "error", message: "Failed to delete registration" });
  }
});

app.use("/api", apiRouter);

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({
    status: "error",
    message: "Internal Server Error",
    details: err.message || "Unknown error"
  });
});

export default app;
