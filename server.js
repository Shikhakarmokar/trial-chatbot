// server.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Your Google Apps Script Web App URL
const GOOGLE_SHEET_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbzcD1wNgchReR-N5WYhhvgYdsMeOzBQfypYkhalcs4tdcYGr75PTbM4sgRSH_bhdJS8/exec";

// -------------------------
// Chat Endpoint (unchanged)
// -------------------------
app.post("/chat", (req, res) => {
  const message = (req.body.message || "").trim();

  if (!message) {
    return res.json({ reply: "Please type something." });
  }

  return res.json({
    reply:
      "This chatbot now saves your data into Google Sheets automatically.\nLet's begin!",
  });
});

// ----------------------------
// Save Form → Google Sheets
// ----------------------------
app.post("/save-form", async (req, res) => {
  try {
    const payload = req.body || {};

    // Send data to Google Sheets WebApp
    const response = await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("Google Sheets Response:", result);

    return res.json({ ok: true, message: "Saved to Google Sheets" });
  } catch (err) {
    console.error("Error saving to Google Sheets:", err);
    return res.status(500).json({
      ok: false,
      error: "Google Sheet save failed",
    });
  }
});

// -----------------------
// Health Check Endpoint
// -----------------------
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// -----------------------
// Start the Server
// -----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
