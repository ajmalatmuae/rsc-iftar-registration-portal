import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "risalaupdate";

    if (username === adminUsername && password === adminPassword) {
      res.json({ status: "success", token: "admin-token-123" });
    } else {
      res.status(401).json({ status: "error", message: "Invalid credentials" });
    }
  });

  app.get("/api/registrations", async (req, res) => {
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
        range: "Sheet1!A:O", // Assuming N is for attended status, O is mealsPledged
      });

      const rows = response.data.values || [];
      
      // Skip header row if it exists, assuming first row might be headers if it contains "registrationId" or similar
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
    } catch (error) {
      console.error("Error fetching from Google Sheets:", error);
      res.status(500).json({ status: "error", message: "Failed to fetch registrations" });
    }
  });

  app.post("/api/register", async (req, res) => {
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
        // If not configured, just return success for demo purposes
        console.warn("Google Sheets credentials not configured. Skipping save.");
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
      const fullWhatsapp = `${whatsappCode}${whatsappNumber}`; // Removed space and + if handled by code, but let's strip + explicitly
      const cleanWhatsapp = fullWhatsapp.replace(/\+/g, '');

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Sheet1!A:O", // Adjust range if needed
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
              false, // Attended defaults to false
              mealsPledged || 0 // Meals pledged
            ],
          ],
        },
      });

      res.json({ status: "success" });
    } catch (error) {
      console.error("Error saving to Google Sheets:", error);
      res.status(500).json({ status: "error", message: "Failed to save registration" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
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

      // Get all rows to find the matching one
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Sheet1!A:O",
      });

      const rows = response.data.values || [];
      let rowIndex = -1;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (
          row[0]?.toLowerCase() === identifier.toLowerCase() || // registrationId
          row[3] === identifier || // phone
          row[1]?.toLowerCase() === identifier.toLowerCase() // fullName
        ) {
          rowIndex = i;
          break;
        }
      }

      if (rowIndex !== -1) {
        // Update the 'Attended' column (Column N, which is index 13, so N${rowIndex + 1})
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

  app.delete("/api/registrations/:registrationId", async (req, res) => {
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

      // Get all rows to find the matching one
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Sheet1!A:A", // Only need the first column to find the ID
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
        // Delete the row
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: 0, // Assuming Sheet1 is the first sheet (id 0)
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
