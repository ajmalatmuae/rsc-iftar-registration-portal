import express from "express";
import { google } from "googleapis";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Create a router for API
const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

apiRouter.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "risalaupdate";

  if (username === adminUsername && password === adminPassword) {
    res.json({ status: "success", token: "admin-token-123" });
  } else {
    res.status(401).json({ status: "error", message: "Invalid credentials" });
  }
});

apiRouter.get("/debug", (req, res) => {
  res.json({
    status: "ok",
    env: {
      GOOGLE_SPREADSHEET_ID: !!process.env.GOOGLE_SPREADSHEET_ID,
      GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
      ADMIN_USERNAME: !!process.env.ADMIN_USERNAME,
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    },
    node_env: process.env.NODE_ENV,
  });
});

apiRouter.get("/registrations", async (req, res) => {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!spreadsheetId || !clientEmail || !privateKey) {
      return res.json({ status: "success", data: [], message: "Credentials missing, returning empty data" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
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
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch registrations",
      details: error.message || "Unknown error"
    });
  }
});

apiRouter.post("/register", async (req, res) => {
  try {
    const {
      registrationId,
      fullName,
      email,
      company,
      category,
      profession,
      otherProfession,
      phone,
      whatsappCode,
      whatsappNumber,
      area,
      gender,
      age,
      musandamTrip,
      date,
      mealsPledged
    } = req.body;

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!spreadsheetId || !clientEmail || !privateKey) {
      return res.json({ status: "success", message: "Mock saved (credentials missing)" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
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
        values: [
          [
            registrationId,
            fullName,
            email,
            phone,
            cleanWhatsapp,
            company,
            category,
            fullProfession,
            area,
            gender,
            age,
            musandamTrip,
            date || new Date().toISOString(),
            false,
            mealsPledged || 0
          ],
        ],
      },
    });

    res.json({ status: "success" });
  } catch (error: any) {
    console.error("Error saving to Google Sheets:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to save registration",
      details: error.message || "Unknown error"
    });
  }
});

apiRouter.post("/attendance", async (req, res) => {
  try {
    const { identifier } = req.body;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!spreadsheetId || !clientEmail || !privateKey) {
      return res.json({ status: "success", message: "Mock attendance saved (credentials missing)" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
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
        requestBody: {
          values: [['Yes']]
        }
      });
      res.json({ status: "success" });
    } else {
      res.status(404).json({ status: "error", message: "Registration not found" });
    }
  } catch (error) {
    console.error("Error updating attendance in Google Sheets:", error);
    res.status(500).json({ status: "error", message: "Failed to update attendance" });
  }
});

apiRouter.delete("/registrations/:registrationId", async (req, res) => {
  try {
    const { registrationId } = req.params;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!spreadsheetId || !clientEmail || !privateKey) {
      return res.json({ status: "success", message: "Mock deletion (credentials missing)" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
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
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: 0,
                  dimension: "ROWS",
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1,
                },
              },
            },
          ],
        },
      });
      res.json({ status: "success" });
    } else {
      res.status(404).json({ status: "error", message: "Registration not found" });
    }
  } catch (error) {
    console.error("Error deleting from Google Sheets:", error);
    res.status(500).json({ status: "error", message: "Failed to delete registration" });
  }
});

// Mount the router
// Handle both /api and root (Vercel rewrites can be tricky)
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const setupVite = async () => {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  };
  setupVite();
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;
