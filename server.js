// server.js
const express = require("express");
const path = require("path");
const XLSX = require("xlsx");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Load Excel data function (reads headers too)
function loadWorkbook() {
  try {
    const workbook = XLSX.readFile(path.join(__dirname, "data.xlsx"));
    return workbook;
  } catch (err) {
    console.error("Error reading Excel:", err);
    throw err;
  }
}

// append a row (object mapping) to first sheet
function appendRowToExcel(rowObj) {
  const filePath = path.join(__dirname, "data.xlsx");
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert sheet to JSON (array of objects)
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  // Append new row (ensure column order preserved by headers)
  rows.push(rowObj);

  // Convert JSON back to sheet
  const newSheet = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
  workbook.Sheets[sheetName] = newSheet;

  // Write file
  XLSX.writeFile(workbook, filePath);
}

// Keep existing chatbot behavior (reads excel into memory if needed)
function readExcelAsQA() {
  try {
    const workbook = loadWorkbook();
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch (err) {
    return [];
  }
}

let excelData = readExcelAsQA();

// Simple POST /chat for backward compatibility (same as before)
app.post("/chat", (req, res) => {
  const message = (req.body.message || "").toLowerCase().trim();

  if (!message) return res.json({ reply: "Please type something." });

  const exact = excelData.find(
    (row) => (row.keyword || "").toString().toLowerCase() === message
  );
  if (exact) return res.json({ reply: exact.response });

  const partial = excelData.find((row) =>
    message.includes((row.keyword || "").toString().toLowerCase())
  );
  if (partial) return res.json({ reply: partial.response });

  return res.json({
    reply:
      "I don't have that answer yet (trial bot). Try: hi / logistic / shipping.",
  });
});

// Save form endpoint: expects a JSON body with keys matching Excel headers
// Example payload:
// {
//  "Name":"Shikha", "Email":"a@b.com", "Department":"Logistics", "Phone":"123",
//  "Age":"25","Location":"Mumbai","Feedback":"Great",
//  "DeviceType":"Phone","OS":"Android","Browser":"Chrome",
//  "IsPWAInstalled":"TRUE","InstallTimestamp":"2025-11-19T10:00:00Z",
//  "ChatbotTimestamp":"2025-11-19T10:02:00Z","UserID":"...","SessionID":"..."
// }
app.post("/save-form", (req, res) => {
  try {
    const payload = req.body || {};

    // Build row object that matches Excel headers exactly
    // Using the exact header set we asked you to create:
    const row = {
      Name: payload.Name || "",
      Email: payload.Email || "",
      Department: payload.Department || "",
      Phone: payload.Phone || "",
      Age: payload.Age || "",
      Location: payload.Location || "",
      Feedback: payload.Feedback || "",
      DeviceType: payload.DeviceType || "",
      OS: payload.OS || "",
      Browser: payload.Browser || "",
      IsPWAInstalled: payload.IsPWAInstalled || "",
      InstallTimestamp: payload.InstallTimestamp || "",
      ChatbotTimestamp: payload.ChatbotTimestamp || "",
      UserID: payload.UserID || "",
      SessionID: payload.SessionID || "",
    };

    appendRowToExcel(row);

    // Reload excelData cache (optional)
    excelData = readExcelAsQA();

    res.json({ ok: true, message: "Saved to Excel" });
  } catch (err) {
    console.error("Error saving form:", err);
    res.status(500).json({ ok: false, error: err.message || "save failed" });
  }
});

// Health and reload endpoints (optional)
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.post("/reload-data", (req, res) => {
  excelData = readExcelAsQA();
  res.json({ reloaded: true, rows: excelData.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
