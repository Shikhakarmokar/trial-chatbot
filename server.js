const express = require("express");
const cors = require("cors");
const path = require("path");
const XLSX = require("xlsx");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- SERVE FRONTEND ----------
app.use(express.static(path.join(__dirname, "public")));

// ---------- LOAD EXCEL SHEET ----------
function loadExcel() {
  const workbook = XLSX.readFile("data.xlsx");
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet); 
}

let excelData = loadExcel();

// ---------- CHATBOT API ----------
app.post("/chat", (req, res) => {
  const message = (req.body.message || "").toLowerCase().trim();

  if (!message) {
    return res.json({ reply: "Please type something." });
  }

  // Exact match
  const exact = excelData.find(
    row => row.keyword.toLowerCase() === message
  );
  if (exact) {
    return res.json({ reply: exact.response });
  }

  // Partial match
  const partial = excelData.find(
    row => message.includes(row.keyword.toLowerCase())
  );
  if (partial) {
    return res.json({ reply: partial.response });
  }

  res.json({
    reply: "I don't have that answer yet (trial bot). Try: hi / logistic / shipping."
  });
});

// ---------- START SERVER ----------
app.listen(3000, () => {
  console.log("Chatbot running → http://localhost:3000");
});
