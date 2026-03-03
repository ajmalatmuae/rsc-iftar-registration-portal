import express from "express";
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
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

apiRouter.post("/admin/login", (req, res) => {
  try {
    const { username, password } = req.body || {};
    const adminUsername = getEnvVar("ADMIN_USERNAME") || "admin";
    const adminPassword = getEnvVar("ADMIN_PASSWORD") || "risalaupdate";

    if (username === adminUsername && password === adminPassword) {
      res.json({ status: "success", token: "admin-token-123" });
    } else {
      res.status(401).json({ status: "error", message: "Invalid credentials" });
    }
  } catch (error: any) {
    res.status(500).json({ status: "error", message: "Login error" });
  }
});

apiRouter.get("/debug", (req, res) => {
  const privateKey = getPrivateKey();
  res.json({
    status: "ok",
    diagnostics: {
      spreadsheetId: !!getEnvVar("GOOGLE_SPREADSHEET_ID"),
      clientEmail: !!getEnvVar("GOOGLE_CLIENT_EMAIL"),
      privateKey: !!privateKey,
      privateKey_format: privateKey?.includes('BEGIN PRIVATE KEY'),
    }
  });
});

// Lazy load Google Sheets logic to avoid heavy imports on cold start
const getSheetsClient = async () => {
  const { google } = await import("googleapis");
  const spreadsheetId = getEnvVar("GOOGLE_SPREADSHEET_ID");
  const clientEmail = getEnvVar("GOOGLE_CLIENT_EMAIL");
  const privateKey = getPrivateKey();

  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new Error("Missing Google Sheets credentials");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return { sheets: google.sheets({ version: "v4", auth }), spreadsheetId };
};

apiRouter.get("/registrations", async (req, res) => {
  try {
    const { sheets, spreadsheetId } = await getSheetsClient();
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
    console.error("Fetch error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

apiRouter.post("/register", async (req, res) => {
  try {
    const {
      registrationId, fullName, email, company, category, profession,
      otherProfession, phone, whatsappCode, whatsappNumber, area,
      gender, age, musandamTrip, date, mealsPledged
    } = req.body;

    const { sheets, spreadsheetId } = await getSheetsClient();
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
    console.error("Register error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

apiRouter.post("/attendance", async (req, res) => {
  try {
    const { identifier } = req.body;
    const { sheets, spreadsheetId } = await getSheetsClient();
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
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

apiRouter.delete("/registrations/:registrationId", async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { sheets, spreadsheetId } = await getSheetsClient();
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
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.use("/api", apiRouter);

export default app;
